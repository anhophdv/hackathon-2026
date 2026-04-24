import { GeneratedHistory, ordersByHourForDate, promoForDate } from "../mock/orders";
import {
  deliveryCapacityByHour,
  pizzaCapacityByHour,
  staffByHour,
} from "../mock/labor";
import { DayForecast, forecastDay, WhatIf } from "./engine";
import { buildIngredientPlan, buildPrepPlan } from "./inventory";
import { addDays, formatGBP } from "../utils";
import { translate } from "../i18n/messages";

export type Severity = "high" | "med" | "low";
export type Owner = "Manager" | "Shift Lead" | "Kitchen" | "Front" | "Driver";

export type ActionStep = {
  at: string;
  do: string;
  qty?: number;
  unit?: string;
  owner?: Owner;
};

export type Recommendation = {
  id: string;
  severity: Severity;
  category:
    | "Inventory"
    | "Prep"
    | "Labor"
    | "Capacity"
    | "Promo"
    | "Service"
    | "Waste";
  title: string;
  whyItMatters: string;
  drivers: string[];
  steps: ActionStep[];
  expectedImpact: string;
  confidence: number;
  freshnessMins: number;
};

export type RecommendationsBundle = {
  for: Date;
  forecast: DayForecast;
  recs: Recommendation[];
};

function clipPct(x: number) {
  return Math.round(x * 1000) / 10;
}

export function buildRecommendations(
  history: GeneratedHistory,
  date: Date,
  whatIf?: Partial<WhatIf>,
): RecommendationsBundle {
  const forecast = forecastDay({ history, date, whatIf });
  const promo = promoForDate(date);
  const recs: Recommendation[] = [];
  const tr = (
    k: string,
    v?: Record<string, string | number | undefined | null>,
  ) =>
    translate(k, v);
  const weekdayName = tr(`weekday.${date.getDay()}`);

  // Compare to last week same-day actual
  const lastWeek = history.days.find(
    (d) => d.date.getTime() === addDays(date, -7).getTime(),
  );
  const lastWeekOrders = lastWeek?.orders.length ?? forecast.baseline;
  const upliftVsLastWeek = (forecast.p50 - lastWeekOrders) / Math.max(1, lastWeekOrders);

  const nonZeroDrivers = forecast.drivers
    .filter((d) => d.delta !== 0)
    .map((d) => d.label);

  // ---- Inventory recs ----
  const ingredientPlan = buildIngredientPlan([forecast]);
  const ingredientShortfalls = ingredientPlan.filter((p) => p.shortfall > 0);
  for (const need of ingredientShortfalls.slice(0, 6)) {
    const sev: Severity =
      need.riskLevel === "high" ? "high" : need.riskLevel === "med" ? "med" : "low";
    const item = tr(`ingredient.${need.id}`);
    recs.push({
      id: `inv_${need.id}`,
      severity: sev,
      category: "Inventory",
      title: tr("rec.inv.title", {
        packs: need.packsToOrder,
        s: need.packsToOrder === 1 ? "" : "s",
        item,
        cost: formatGBP(need.estCost),
      }),
      whyItMatters: tr("rec.inv.why", {
        required: need.requiredQty,
        onHand: need.onHand,
        shortfall: need.shortfall,
        unit: need.unit,
      }),
      drivers: [
        ...nonZeroDrivers,
        tr("rec.inv.driver_lt", {
          lead: need.leadTimeHrs,
          hour: need.cutoffHour,
        }),
      ],
      steps: [
        {
          at: `${String(need.cutoffHour - 1).padStart(2, "0")}:30`,
          do: tr("rec.inv.step1", {
            packs: need.packsToOrder,
            size: need.packSize,
            unit: need.unit,
          }),
          owner: "Manager",
          qty: need.packsToOrder,
          unit: tr("rec.inv.unit_packs"),
        },
        {
          at: `${String(need.cutoffHour).padStart(2, "0")}:00`,
          do: tr("rec.inv.step2"),
          owner: "Manager",
        },
      ],
      expectedImpact: tr("rec.inv.impact", {
        item,
        n: Math.round(
          (need.shortfall / Math.max(1, need.requiredQty)) * forecast.p50,
        ),
      }),
      confidence: need.riskLevel === "high" ? 0.92 : 0.84,
      freshnessMins: 5,
    });
  }

  // ---- Prep recs ----
  const prep = buildPrepPlan(forecast);
  if (prep.length) {
    recs.push({
      id: "prep_today",
      severity: upliftVsLastWeek > 0.1 ? "high" : "med",
      category: "Prep",
      title: tr("rec.prep.title", {
        p50: Math.round(forecast.p50),
        sign: upliftVsLastWeek >= 0 ? "+" : "",
        pct: clipPct(upliftVsLastWeek),
      }),
      whyItMatters: tr("rec.prep.why", { n: Math.round(forecast.p50 * 0.42) }),
      drivers: nonZeroDrivers,
      steps: prep.map((task) => ({
        at: task.at,
        do: task.label,
        qty: task.qty,
        unit: task.unit,
        owner: "Kitchen" as Owner,
      })),
      expectedImpact: tr("rec.prep.impact"),
      confidence: 0.88,
      freshnessMins: 2,
    });
  }

  // ---- Labor / capacity recs ----
  const lastWeekHours = lastWeek
    ? ordersByHourForDate(history, lastWeek.date)
    : Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0 }));
  const peakHours = [17, 18, 19, 20];
  const gaps: { hour: number; demand: number; cap: number }[] = [];
  for (const h of peakHours) {
    const prev = lastWeekHours[h]?.orders ?? 0;
    const projected = prev * (forecast.p50 / Math.max(1, lastWeekOrders));
    const cap = pizzaCapacityByHour(h);
    if (projected > cap) gaps.push({ hour: h, demand: projected, cap });
  }
  if (gaps.length) {
    const worst = gaps.reduce((a, b) =>
      a.demand - a.cap > b.demand - b.cap ? a : b,
    );
    recs.push({
      id: "labor_makeline",
      severity: "high",
      category: "Labor",
      title: tr("rec.labor.title", {
        from: worst.hour,
        to: worst.hour + 2,
        demand: Math.round(worst.demand),
        cap: Math.round(worst.cap),
      }),
      whyItMatters: tr("rec.labor.why", { hour: worst.hour }),
      drivers: [
        tr("rec.labor.driver_forecast", {
          p50: Math.round(forecast.p50),
          pct: clipPct(upliftVsLastWeek),
        }),
        ...nonZeroDrivers,
      ],
      steps: [
        {
          at: `${String(worst.hour - 1).padStart(2, "0")}:30`,
          do: tr("rec.labor.step1"),
          owner: "Shift Lead",
        },
        {
          at: `${String(worst.hour).padStart(2, "0")}:00`,
          do: tr("rec.labor.step2"),
          owner: "Kitchen",
        },
        {
          at: `${String(worst.hour).padStart(2, "0")}:30`,
          do: tr("rec.labor.step3"),
          owner: "Shift Lead",
        },
      ],
      expectedImpact: tr("rec.labor.impact", {
        gbp: Math.round(gaps.reduce((s, g) => s + (g.demand - g.cap), 0) * 14),
      }),
      confidence: 0.87,
      freshnessMins: 4,
    });
  }

  const drv = deliveryCapacityByHour(19);
  const projDeliv = forecast.p50 * 0.55 * 0.18;
  if (projDeliv > drv) {
    recs.push({
      id: "labor_driver",
      severity: "med",
      category: "Capacity",
      title: tr("rec.driver.title"),
      whyItMatters: tr("rec.driver.why", {
        deliv: Math.round(projDeliv),
        cap: drv.toFixed(1),
      }),
      drivers: [tr("rec.driver.driver_share"), ...nonZeroDrivers],
      steps: [
        { at: "16:00", do: tr("rec.driver.step1"), owner: "Manager" },
        { at: "17:45", do: tr("rec.driver.step2"), owner: "Shift Lead" },
      ],
      expectedImpact: tr("rec.driver.impact"),
      confidence: 0.78,
      freshnessMins: 6,
    });
  }

  // ---- Promo recs ----
  if (promo.active) {
    recs.push({
      id: "promo_push",
      severity: "low",
      category: "Promo",
      title: tr("rec.promo.title", { name: promo.name }),
      whyItMatters: tr("rec.promo.why", {
        pct: clipPct(promo.demandMult - 1),
        boost: clipPct(((promo as any).weightBoost ?? 1) - 1),
      }),
      drivers: [
        tr("rec.promo.driver_weekday", { weekday: weekdayName }),
        tr("rec.promo.driver_recurring"),
      ],
      steps: [
        { at: "11:00", do: tr("rec.promo.step1"), owner: "Front" },
        { at: "11:30", do: tr("rec.promo.step2"), owner: "Manager" },
        { at: "16:00", do: tr("rec.promo.step3"), owner: "Front" },
      ],
      expectedImpact: tr("rec.promo.impact", {
        pct: clipPct(promo.demandMult - 1),
        gbp: formatGBP(forecast.revenue * (promo.demandMult - 1) * 0.3),
      }),
      confidence: 0.82,
      freshnessMins: 1,
    });
  }

  // ---- Waste rec ----
  if (upliftVsLastWeek < -0.08) {
    recs.push({
      id: "waste_underprep",
      severity: "med",
      category: "Waste",
      title: tr("rec.waste.title", {
        pct: Math.abs(Math.round(upliftVsLastWeek * 100)),
        weekday: weekdayName,
      }),
      whyItMatters: tr("rec.waste.why", { delta: clipPct(upliftVsLastWeek) }),
      drivers: forecast.drivers.filter((d) => d.delta < 0).map((d) => d.label),
      steps: [
        { at: "15:30", do: tr("rec.waste.step1"), owner: "Kitchen" },
        { at: "20:00", do: tr("rec.waste.step2"), owner: "Shift Lead" },
      ],
      expectedImpact: tr("rec.waste.impact", {
        gbp: formatGBP(Math.abs(upliftVsLastWeek) * forecast.revenue * 0.08),
      }),
      confidence: 0.75,
      freshnessMins: 3,
    });
  }

  const sevOrder: Record<Severity, number> = { high: 0, med: 1, low: 2 };
  recs.sort(
    (a, b) => sevOrder[a.severity] - sevOrder[b.severity] || b.confidence - a.confidence,
  );

  return { for: date, forecast, recs };
}
