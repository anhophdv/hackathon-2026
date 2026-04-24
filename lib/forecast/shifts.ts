// Auto shift management engine — station-staffing edition.
//
// Given the same forecast that powers Today's Plan and the historical
// hourly order shape, this engine answers one question for the Store
// Manager: "How many people should I have at each station, each hour,
// to hit today's demand without overspending labour?"
//
// Outputs:
//   - ShiftCell: per station × hour with recommended headcount, the
//     currently-scheduled headcount, and a fit status.
//   - ShiftAdjustment: station-level "add N / reduce N for hh:00–hh:00"
//     recommendations derived from consecutive mismatches.
//   - ShiftMove: optional cross-role reallocations that realise the
//     adjustments using the people already on the rota (no new payroll).

import {
  DRIVER_THROUGHPUT,
  MAKE_LINE_THROUGHPUT,
  Role,
  Shift,
  deliveryCapacityByHour,
  pizzaCapacityByHour,
  staffByHour,
} from "../mock/labor";
import { GeneratedHistory, ordersByHourForDate } from "../mock/orders";
import { addDays } from "../utils";
import { DayForecast } from "./engine";

export const OPEN_HOUR = 11;
export const CLOSE_HOUR = 23;
export const OPEN_HOURS: number[] = Array.from(
  { length: CLOSE_HOUR - OPEN_HOUR },
  (_, i) => OPEN_HOUR + i,
);

// Fallback defaults if no historical same-weekday data is available.
// When history is available these are replaced per-hour by measured values.
const FALLBACK_PIZZAS_PER_ORDER = 1.4;
const FALLBACK_DELIVERY_SHARE = 0.55;
const FALLBACK_DINE_IN_SHARE = 0.15;
const FALLBACK_COLLECTION_SHARE = 0.3;
// Target utilisation for station sizing. Running stations at 85% of
// peak throughput leaves headroom for rush spikes while avoiding
// idle labour.
const TARGET_UTILISATION = 0.85;
// Rough average order value used for impact costing.
const AVG_ORDER_VALUE = 18;
// Fraction of at-risk demand we expect to actually recover per added
// head-hour when going from short -> matched staffing.
const RECOVERY_FACTOR = 0.6;
// Blended hourly cost used to price "reduce" savings.
const BLENDED_HOURLY_COST = 13;
// Ignore hours with negligible projected demand (pre-open quiet).
const OFF_HOUR_DEMAND_EPSILON = 3;

export type CellFit = "off" | "match" | "short" | "over" | "critical";

export type HourlyDemand = {
  hour: number;
  orders: number;
  pizzas: number;
  deliveries: number;
  dineIn: number;
  collection: number;
  // Historical shares used to derive the above (0..1).
  deliveryShare: number;
  dineInShare: number;
  collectionShare: number;
  // Average pizzas per order for this hour (from the last same-weekdays).
  pizzasPerOrder: number;
  // Coefficient of variation of orders across the sample days — higher
  // means more uncertainty, which we use to soften confidence scores.
  cv: number;
  // Number of reference days this hour was averaged from.
  sampleDays: number;
};

export type ShiftCell = {
  role: Role;
  hour: number;
  actualStaff: number;
  recommendedStaff: number;
  capacity: number;
  demand: number;
  utilisation: number;
  fit: CellFit;
};

export type ShiftAdjustment = {
  id: string;
  role: Role;
  fromHour: number;
  toHour: number;
  delta: number; // +N = add heads, -N = reduce heads
  reason: string[];
  expectedOrders: number; // only for +delta
  expectedGBP: number; // £ orders saved (adds) or labour saved (reduces)
  confidence: number;
  severity: "high" | "med" | "low";
};

export type ShiftMove = {
  id: string;
  staffId: string;
  staffName: string;
  fromRole: Role;
  toRole: Role;
  fromHour: number;
  toHour: number;
  why: string[];
  expectedOrders: number;
  expectedGBP: number;
  confidence: number;
};

export type StationSummary = {
  role: Role;
  scheduledHours: number;
  recommendedHours: number;
  deltaHours: number; // + means need more heads, - means overstaffed
};

export type ShiftPlan = {
  cells: ShiftCell[];
  adjustments: ShiftAdjustment[];
  moves: ShiftMove[];
  stations: StationSummary[];
  totals: {
    scheduledHours: number;
    recommendedHours: number;
    alignmentPct: number; // 100% = schedule exactly matches plan
    shortHours: number;
    overHours: number;
    projectedCost: number;
    recommendedCost: number;
    savingsEstimate: number;
  };
};

export const BOARD_ROLES: Role[] = [
  "Shift Lead",
  "Make Line",
  "Oven",
  "Driver",
  "Front",
];

// Minimum headcount targets for roles without a throughput model.
// Peak window (17..20) needs an extra pair of hands up front / on leads.
function headcountTarget(role: Role, hour: number): number {
  const peak = hour >= 17 && hour <= 20;
  switch (role) {
    case "Shift Lead":
      return peak ? 2 : 1;
    case "Front":
      return peak ? 2 : 1;
    case "Manager":
      return 1;
    default:
      return 0;
  }
}

export function projectHourlyDemand(
  history: GeneratedHistory,
  forecast: DayForecast,
  date: Date,
): HourlyDemand[] {
  // Use a same-weekday average (up to last 4 weeks) for a stable hourly
  // shape, channel mix, and item mix.
  const weekday = date.getDay();
  const refDays = history.days
    .filter(
      (d) => d.date.getDay() === weekday && d.date.getTime() < date.getTime(),
    )
    .slice(-4);

  const lastWeek = history.days.find(
    (d) => d.date.getTime() === addDays(date, -7).getTime(),
  );
  const daysForShape = refDays.length ? refDays : lastWeek ? [lastWeek] : [];
  const sampleDays = daysForShape.length;

  const refOrderCount = daysForShape.length
    ? daysForShape.reduce((s, d) => s + d.orders.length, 0) /
      daysForShape.length
    : forecast.baseline;

  // Per-hour aggregates across reference days.
  type HourAgg = {
    orders: number[]; // order counts per ref day at this hour
    delivery: number;
    collection: number;
    dineIn: number;
    pizzas: number;
  };
  const agg: HourAgg[] = Array.from({ length: 24 }, () => ({
    orders: [],
    delivery: 0,
    collection: 0,
    dineIn: 0,
    pizzas: 0,
  }));

  for (const day of daysForShape) {
    const perHourOrderCount = Array.from({ length: 24 }, () => 0);
    for (const o of day.orders) {
      const h = o.ts.getHours();
      perHourOrderCount[h]++;
      if (o.channel === "Delivery") agg[h].delivery++;
      else if (o.channel === "Collection") agg[h].collection++;
      else agg[h].dineIn++;
      // Count pizza lines (category === "Pizza") for this order.
      for (const line of o.lines) {
        // Pizzas have ids prefixed with "pz_" in the mock menu.
        if (line.itemId.startsWith("pz_")) {
          agg[h].pizzas += line.qty;
        }
      }
    }
    for (let h = 0; h < 24; h++) agg[h].orders.push(perHourOrderCount[h]);
  }

  const scale = forecast.p50 / Math.max(1, refOrderCount);

  return OPEN_HOURS.map((hour) => {
    const a = agg[hour];
    const meanOrders = a.orders.length
      ? a.orders.reduce((s, x) => s + x, 0) / a.orders.length
      : 0;
    const variance = a.orders.length
      ? a.orders.reduce((s, x) => s + (x - meanOrders) ** 2, 0) /
        a.orders.length
      : 0;
    const cv = meanOrders > 0 ? Math.sqrt(variance) / meanOrders : 0;
    const totalHist = a.delivery + a.collection + a.dineIn;
    const deliveryShare =
      totalHist > 0 ? a.delivery / totalHist : FALLBACK_DELIVERY_SHARE;
    const dineInShare =
      totalHist > 0 ? a.dineIn / totalHist : FALLBACK_DINE_IN_SHARE;
    const collectionShare =
      totalHist > 0 ? a.collection / totalHist : FALLBACK_COLLECTION_SHARE;
    const pizzasPerOrder =
      totalHist > 0
        ? a.pizzas / Math.max(1, totalHist)
        : FALLBACK_PIZZAS_PER_ORDER;

    const orders = meanOrders * scale;
    return {
      hour,
      orders,
      pizzas: orders * pizzasPerOrder,
      deliveries: orders * deliveryShare,
      collection: orders * collectionShare,
      dineIn: orders * dineInShare,
      deliveryShare,
      dineInShare,
      collectionShare,
      pizzasPerOrder,
      cv,
      sampleDays,
    };
  });
}

function demandForRole(role: Role, d: HourlyDemand): number {
  switch (role) {
    case "Make Line":
      return d.pizzas;
    case "Oven":
      // Ovens pace the make line; ~1 oven hand per 2 make-line hands.
      return d.pizzas / 2;
    case "Driver":
      return d.deliveries;
    default:
      return 0;
  }
}

function capacityForRole(role: Role, hour: number, shifts: Shift[]): number {
  switch (role) {
    case "Make Line":
      return pizzaCapacityByHour(hour, shifts);
    case "Oven":
      return staffByHour("Oven", hour, shifts) * MAKE_LINE_THROUGHPUT;
    case "Driver":
      return deliveryCapacityByHour(hour, shifts);
    default:
      return 0;
  }
}

// Recommended headcount per station, derived from hourly demand history.
function recommendHeadcount(role: Role, hour: number, d: HourlyDemand): number {
  const peak = hour >= 17 && hour <= 20;
  if (role === "Shift Lead" || role === "Front" || role === "Manager") {
    // Closed? No one needed. Otherwise use the headcount target, with
    // a lunch/peak bump if projected orders exceed a threshold.
    if (d.orders < OFF_HOUR_DEMAND_EPSILON) return 0;
    return headcountTarget(role, hour);
  }
  if (role === "Make Line") {
    if (d.pizzas < OFF_HOUR_DEMAND_EPSILON) return peak ? 2 : 1;
    // Size for TARGET_UTILISATION of peak throughput, ceiling so we
    // never round down through a gap.
    const raw = d.pizzas / (MAKE_LINE_THROUGHPUT * TARGET_UTILISATION);
    return Math.max(peak ? 2 : 1, Math.ceil(raw));
  }
  if (role === "Oven") {
    if (d.pizzas < OFF_HOUR_DEMAND_EPSILON) return peak ? 1 : 1;
    // 1 oven hand per ~2 make-line hands worth of pies.
    const raw = d.pizzas / 2 / (MAKE_LINE_THROUGHPUT * TARGET_UTILISATION);
    return Math.max(1, Math.ceil(raw));
  }
  if (role === "Driver") {
    if (d.deliveries < 1) return 0;
    const raw = d.deliveries / (DRIVER_THROUGHPUT * TARGET_UTILISATION);
    return Math.max(1, Math.ceil(raw));
  }
  return 0;
}

function fitFor(actual: number, recommended: number, demand: number): CellFit {
  if (recommended === 0 && actual === 0) return "off";
  if (recommended === 0 && demand < OFF_HOUR_DEMAND_EPSILON) return "off";
  if (actual === recommended) return "match";
  if (actual < recommended)
    return recommended - actual >= 2 ? "critical" : "short";
  return "over";
}

export function computeShiftBoard(
  shifts: Shift[],
  hourlyDemand: HourlyDemand[],
): ShiftCell[] {
  const cells: ShiftCell[] = [];
  const demandByHour = new Map(hourlyDemand.map((d) => [d.hour, d]));

  for (const role of BOARD_ROLES) {
    for (const hour of OPEN_HOURS) {
      const d: HourlyDemand = demandByHour.get(hour) ?? {
        hour,
        orders: 0,
        pizzas: 0,
        deliveries: 0,
        dineIn: 0,
        collection: 0,
        deliveryShare: FALLBACK_DELIVERY_SHARE,
        dineInShare: FALLBACK_DINE_IN_SHARE,
        collectionShare: FALLBACK_COLLECTION_SHARE,
        pizzasPerOrder: FALLBACK_PIZZAS_PER_ORDER,
        cv: 0,
        sampleDays: 0,
      };
      const actualStaff = staffByHour(role, hour, shifts);
      const recommendedStaff = recommendHeadcount(role, hour, d);
      const capacity = capacityForRole(role, hour, shifts);
      const demand = demandForRole(role, d);
      const utilisation = capacity > 0 ? demand / capacity : 0;
      cells.push({
        role,
        hour,
        actualStaff,
        recommendedStaff,
        capacity,
        demand,
        utilisation,
        fit: fitFor(actualStaff, recommendedStaff, demand),
      });
    }
  }
  return cells;
}

// ---------- Station-level adjustments (primary output) ----------

function groupConsecutive(
  cells: ShiftCell[],
): Array<{ from: number; to: number; delta: number; cells: ShiftCell[] }> {
  const groups: Array<{
    from: number;
    to: number;
    delta: number;
    cells: ShiftCell[];
  }> = [];
  let current: (typeof groups)[number] | null = null;
  for (const c of cells.slice().sort((a, b) => a.hour - b.hour)) {
    const delta = c.recommendedStaff - c.actualStaff;
    if (delta === 0 || c.fit === "off") {
      if (current) {
        groups.push(current);
        current = null;
      }
      continue;
    }
    const sign = Math.sign(delta);
    if (!current || Math.sign(current.delta) !== sign || current.to !== c.hour) {
      if (current) groups.push(current);
      current = { from: c.hour, to: c.hour + 1, delta, cells: [c] };
    } else {
      current.to = c.hour + 1;
      current.delta = Math.max(
        Math.abs(current.delta),
        Math.abs(delta),
      ) * sign;
      current.cells.push(c);
    }
  }
  if (current) groups.push(current);
  return groups;
}

function buildAdjustments(
  cells: ShiftCell[],
  forecast: DayForecast,
  hourlyDemand: HourlyDemand[],
): ShiftAdjustment[] {
  const driverLabels = forecast.drivers
    .filter((d) => d.delta !== 0)
    .map((d) => d.label)
    .slice(0, 2);
  const hourlyByHour = new Map(hourlyDemand.map((d) => [d.hour, d]));

  const out: ShiftAdjustment[] = [];

  for (const role of BOARD_ROLES) {
    const roleCells = cells.filter((c) => c.role === role);
    const groups = groupConsecutive(roleCells);
    for (const g of groups) {
      const hours = g.to - g.from;
      const absDelta = Math.abs(g.delta);
      const isAdd = g.delta > 0;

      // Expected orders only meaningful for adds on throughput roles.
      const totalAtRisk = g.cells.reduce((s, c) => {
        const gap = Math.max(0, c.recommendedStaff - c.actualStaff);
        if (!gap) return s;
        if (role === "Make Line" || role === "Oven") {
          return s + gap * MAKE_LINE_THROUGHPUT * TARGET_UTILISATION;
        }
        if (role === "Driver") {
          return s + gap * DRIVER_THROUGHPUT * TARGET_UTILISATION;
        }
        return s;
      }, 0);

      // Per-hour pizzas-per-order average across the window, weighted by
      // projected orders, so we can translate pizza-throughput back into
      // orders protected.
      const avgPizzasPerOrder =
        (() => {
          const ws = g.cells.map((c) => hourlyByHour.get(c.hour));
          const num = ws.reduce(
            (s, w) => s + (w?.pizzasPerOrder ?? FALLBACK_PIZZAS_PER_ORDER),
            0,
          );
          return num / Math.max(1, ws.length);
        })() || FALLBACK_PIZZAS_PER_ORDER;

      const expectedOrders = isAdd
        ? Math.max(
            1,
            Math.round(
              (role === "Make Line" || role === "Oven"
                ? totalAtRisk / avgPizzasPerOrder
                : role === "Driver"
                  ? totalAtRisk
                  : hours * 8) * RECOVERY_FACTOR,
            ),
          )
        : 0;

      const expectedGBP = isAdd
        ? Math.round(expectedOrders * AVG_ORDER_VALUE)
        : Math.round(absDelta * hours * BLENDED_HOURLY_COST);

      const avgUtil = Math.round(
        (g.cells.reduce((s, c) => s + (c.utilisation || 0), 0) /
          Math.max(1, g.cells.length)) * 100,
      );

      // Pick the most informative historical stat for this role.
      const peakHourly = g.cells
        .map((c) => hourlyByHour.get(c.hour))
        .filter((x): x is HourlyDemand => !!x);
      const avgDeliveryShare = peakHourly.length
        ? peakHourly.reduce((s, w) => s + w.deliveryShare, 0) / peakHourly.length
        : FALLBACK_DELIVERY_SHARE;
      const avgDineInShare = peakHourly.length
        ? peakHourly.reduce((s, w) => s + w.dineInShare, 0) / peakHourly.length
        : FALLBACK_DINE_IN_SHARE;
      const avgCollectionShare = peakHourly.length
        ? peakHourly.reduce((s, w) => s + w.collectionShare, 0) /
          peakHourly.length
        : FALLBACK_COLLECTION_SHARE;
      const avgCV = peakHourly.length
        ? peakHourly.reduce((s, w) => s + w.cv, 0) / peakHourly.length
        : 0;
      const sampleN = peakHourly[0]?.sampleDays ?? 0;

      const reason: string[] = [];
      if (isAdd) {
        if (role === "Make Line") {
          reason.push(
            `Make Line projected ${avgUtil}% of peak throughput (target ${Math.round(
              TARGET_UTILISATION * 100,
            )}%) · avg ${avgPizzasPerOrder.toFixed(1)} pizzas/order`,
          );
        } else if (role === "Oven") {
          reason.push(
            `Oven pacing at ${avgUtil}% vs target; demand tracks Make Line queue`,
          );
        } else if (role === "Driver") {
          reason.push(
            `Delivery share at this hour historically ${Math.round(
              avgDeliveryShare * 100,
            )}% · capacity at ${avgUtil}%`,
          );
        } else if (role === "Front") {
          reason.push(
            `Dine-in + collection ${Math.round(
              (avgDineInShare + avgCollectionShare) * 100,
            )}% of orders this hour — front counter load`,
          );
        } else {
          reason.push(`${role} below peak headcount target`);
        }
      } else {
        if (role === "Driver") {
          reason.push(
            `Delivery share only ${Math.round(
              avgDeliveryShare * 100,
            )}% this hour — driver cover exceeds need`,
          );
        } else {
          reason.push(
            `${role} scheduled above historical same-weekday demand this hour`,
          );
        }
      }
      // Evidence line for transparency.
      if (sampleN > 0) {
        reason.push(
          `Based on ${sampleN} same-weekday${sampleN === 1 ? "" : "s"} · variance ±${Math.round(avgCV * 100)}%`,
        );
      }
      reason.push(...driverLabels);

      const severity: ShiftAdjustment["severity"] =
        absDelta >= 2 || g.cells.some((c) => c.fit === "critical")
          ? "high"
          : isAdd
            ? "med"
            : "low";

      const baseConfidence =
        role === "Make Line"
          ? 0.88
          : role === "Oven"
            ? 0.84
            : role === "Driver"
              ? 0.82
              : 0.76;
      // Soften confidence when same-weekday variance is high, and nudge
      // upwards when we have a full 4-week sample.
      const cvPenalty = Math.min(0.15, avgCV * 0.5);
      const sampleBoost = sampleN >= 4 ? 0.02 : sampleN === 0 ? -0.05 : 0;
      const confidence = Math.max(
        0.55,
        Math.min(0.95, baseConfidence - cvPenalty + sampleBoost),
      );

      out.push({
        id: `adj_${role}_${g.from}_${g.to}_${g.delta > 0 ? "add" : "cut"}`,
        role,
        fromHour: g.from,
        toHour: g.to,
        delta: g.delta > 0 ? absDelta : -absDelta,
        reason,
        expectedOrders,
        expectedGBP,
        confidence,
        severity,
      });
    }
  }

  return out.sort((a, b) => {
    const sevOrder = { high: 0, med: 1, low: 2 } as const;
    return (
      sevOrder[a.severity] - sevOrder[b.severity] || b.expectedGBP - a.expectedGBP
    );
  });
}

// ---------- Station summary & totals ----------

function buildStations(cells: ShiftCell[]): StationSummary[] {
  return BOARD_ROLES.map((role) => {
    const roleCells = cells.filter((c) => c.role === role);
    const scheduledHours = roleCells.reduce((s, c) => s + c.actualStaff, 0);
    const recommendedHours = roleCells.reduce(
      (s, c) => s + c.recommendedStaff,
      0,
    );
    return {
      role,
      scheduledHours,
      recommendedHours,
      deltaHours: recommendedHours - scheduledHours,
    };
  });
}

// ---------- Cross-role moves (how to realise adjustments) ----------

const DONOR_ROLES_FOR: Record<Role, Role[]> = {
  "Make Line": ["Front", "Oven", "Shift Lead"],
  Oven: ["Make Line", "Front"],
  "Shift Lead": [],
  Front: ["Shift Lead", "Make Line"],
  Driver: [],
  Manager: [],
};

function pickDonorForWindow(
  shifts: Shift[],
  cells: ShiftCell[],
  targetRole: Role,
  window: { from: number; to: number },
  used: Set<string>,
): { donor: Shift; fromRole: Role } | null {
  for (const donorRole of DONOR_ROLES_FOR[targetRole]) {
    // Donor role must have "over" or "match" across the whole window
    // AND pulling one person wouldn't drop them below their own
    // recommended staffing for any hour in the window.
    const slackEvery = (() => {
      for (let h = window.from; h < window.to; h++) {
        const c = cells.find((x) => x.role === donorRole && x.hour === h);
        if (!c) return false;
        if (c.actualStaff - 1 < c.recommendedStaff) return false;
      }
      return true;
    })();
    if (!slackEvery) continue;

    const candidate = shifts.find(
      (s) =>
        s.role === donorRole &&
        !used.has(s.id) &&
        s.start <= window.from &&
        s.end >= window.to,
    );
    if (candidate) return { donor: candidate, fromRole: donorRole };
  }
  return null;
}

function buildMoves(
  adjustments: ShiftAdjustment[],
  cells: ShiftCell[],
  shifts: Shift[],
  forecast: DayForecast,
): ShiftMove[] {
  const moves: ShiftMove[] = [];
  const used = new Set<string>();
  const driverLabels = forecast.drivers
    .filter((d) => d.delta !== 0)
    .map((d) => d.label)
    .slice(0, 2);

  // Only try to realise "add" adjustments on cross-trainable stations.
  const adds = adjustments.filter(
    (a) => a.delta > 0 && DONOR_ROLES_FOR[a.role].length > 0,
  );
  for (const adj of adds) {
    if (moves.length >= 3) break;
    for (let i = 0; i < adj.delta; i++) {
      if (moves.length >= 3) break;
      const picked = pickDonorForWindow(
        shifts,
        cells,
        adj.role,
        { from: adj.fromHour, to: adj.toHour },
        used,
      );
      if (!picked) break;

      moves.push({
        id: `move_${picked.donor.id}_to_${adj.role}_${adj.fromHour}`,
        staffId: picked.donor.id,
        staffName: picked.donor.name,
        fromRole: picked.fromRole,
        toRole: adj.role,
        fromHour: adj.fromHour,
        toHour: adj.toHour,
        why: [
          `${adj.role} needs +${adj.delta} ${adj.fromHour}:00–${adj.toHour}:00 per station plan`,
          ...driverLabels,
        ],
        expectedOrders: Math.max(
          1,
          Math.round(adj.expectedOrders / Math.max(1, adj.delta)),
        ),
        expectedGBP: Math.round(adj.expectedGBP / Math.max(1, adj.delta)),
        confidence: adj.confidence,
      });
      used.add(picked.donor.id);
    }
  }
  return moves;
}

// ---------- Public entry point ----------

export function buildShiftPlan(
  history: GeneratedHistory,
  forecast: DayForecast,
  date: Date,
  shifts: Shift[],
): ShiftPlan {
  const hourly = projectHourlyDemand(history, forecast, date);
  const cells = computeShiftBoard(shifts, hourly);
  const adjustments = buildAdjustments(cells, forecast, hourly);
  const moves = buildMoves(adjustments, cells, shifts, forecast);
  const stations = buildStations(cells);

  const scheduledHours = stations.reduce((s, x) => s + x.scheduledHours, 0);
  const recommendedHours = stations.reduce(
    (s, x) => s + x.recommendedHours,
    0,
  );
  const shortHours = cells.reduce(
    (s, c) => s + Math.max(0, c.recommendedStaff - c.actualStaff),
    0,
  );
  const overHours = cells.reduce(
    (s, c) => s + Math.max(0, c.actualStaff - c.recommendedStaff),
    0,
  );
  // Alignment score: share of cells where actual == recommended
  // (restricted to in-service cells).
  const inService = cells.filter((c) => c.fit !== "off");
  const matches = inService.filter((c) => c.fit === "match").length;
  const alignmentPct = inService.length
    ? Math.round((matches / inService.length) * 100)
    : 100;

  const projectedCost = scheduledHours * BLENDED_HOURLY_COST;
  const recommendedCost = recommendedHours * BLENDED_HOURLY_COST;
  const savingsEstimate = Math.max(0, projectedCost - recommendedCost);

  return {
    cells,
    adjustments,
    moves,
    stations,
    totals: {
      scheduledHours,
      recommendedHours,
      alignmentPct,
      shortHours,
      overHours,
      projectedCost,
      recommendedCost,
      savingsEstimate,
    },
  };
}

// Keep the two low-level helpers exported for callers that want the
// raw building blocks (and for tests).
export { MAKE_LINE_THROUGHPUT, DRIVER_THROUGHPUT, BLENDED_HOURLY_COST };
