// Hour-by-hour stockout timeline.
// Given a day forecast and current inventory, simulate consumption per hour
// and return the specific clock time at which each at-risk ingredient runs out.

import { IngredientId, MENU } from "../mock/menu";
import { STOCK } from "../mock/inventory";
import { DayForecast } from "./engine";
import { ordersByHourForDate } from "../mock/orders";
import type { GeneratedHistory } from "../mock/orders";

export type StockoutEvent = {
  id: IngredientId;
  label: string;
  unit: string;
  atHour: number; // 0..23 (local)
  atMinute: number;
  clock: string; // "12:45 PM"
  depletedAt: string; // ISO-ish
  onHand: number;
  dailyNeed: number;
  impactedSkus: { name: string; share: number }[];
  hourlyBurn: number;
  severity: "high" | "med" | "low";
};

export type TimelineBucket = {
  hour: number;
  clock: string; // "12:00 PM"
  demandShare: number;
  orders: number;
  stockouts: string[]; // labels of ingredients running out in this hour
};

const HOUR_PROFILE: Record<number, number> = {
  11: 0.35,
  12: 0.85,
  13: 1.05,
  14: 0.55,
  15: 0.30,
  16: 0.40,
  17: 0.85,
  18: 1.45,
  19: 1.55,
  20: 1.35,
  21: 0.95,
  22: 0.45,
  23: 0.20,
};

function fmtClock(h: number, m = 0) {
  const suffix = h >= 12 ? "PM" : "AM";
  const disp = ((h + 11) % 12) + 1;
  return `${disp}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function hourlyDemandShare(): Record<number, number> {
  const total = Object.values(HOUR_PROFILE).reduce((s, v) => s + v, 0);
  const out: Record<number, number> = {};
  for (const [h, v] of Object.entries(HOUR_PROFILE)) {
    out[Number(h)] = v / total;
  }
  return out;
}

export type TimelineInput = {
  forecast: DayForecast;
  // Optional override of current on-hand at start of the day. Defaults to STOCK.
  onHand?: Partial<Record<IngredientId, number>>;
  // Planned prep additions delivered at a given hour (e.g. dough batch prepped at 16:00).
  preppedAt?: Partial<Record<IngredientId, { qty: number; hour: number }[]>>;
  // Optional sku-level demand multipliers (e.g., whatif copilot scenario).
  skuMultipliers?: Record<string, number>;
};

export type TimelineResult = {
  buckets: TimelineBucket[];
  stockouts: StockoutEvent[];
};

// Core: walk hour 11..23, consume ingredients proportional to demand share, detect when onHand < 0.
export function buildTimeline(input: TimelineInput): TimelineResult {
  const { forecast } = input;
  const share = hourlyDemandShare();

  // Project each SKU's hourly qty
  const skuHourly: Record<string, Record<number, number>> = {};
  for (const [sku, totalQty] of Object.entries(forecast.perSku)) {
    const mult = input.skuMultipliers?.[sku] ?? 1;
    const q = totalQty * mult;
    skuHourly[sku] = {};
    for (const [hStr, frac] of Object.entries(share)) {
      const h = Number(hStr);
      skuHourly[sku][h] = q * frac;
    }
  }

  // Hourly ingredient consumption from BOM
  const ingHourly: Record<string, Record<number, number>> = {};
  for (const [sku, hMap] of Object.entries(skuHourly)) {
    const item = MENU.find((m) => m.id === sku);
    if (!item) continue;
    for (const [ing, perUnit] of Object.entries(item.bom) as [string, number][]) {
      if (!ingHourly[ing]) ingHourly[ing] = {};
      for (const [hStr, qty] of Object.entries(hMap)) {
        const h = Number(hStr);
        ingHourly[ing][h] = (ingHourly[ing][h] ?? 0) + qty * perUnit;
      }
    }
  }

  // Starting on-hand
  const onHand: Record<string, number> = {};
  for (const s of STOCK) {
    onHand[s.id] = input.onHand?.[s.id] ?? s.onHand;
  }

  const stockouts: StockoutEvent[] = [];
  const depletedFlag: Record<string, boolean> = {};

  // Pre-compute per-SKU share of each ingredient (for impacted list)
  const ingSkuShare: Record<string, Record<string, number>> = {};
  for (const item of MENU) {
    for (const [ing, perUnit] of Object.entries(item.bom) as [string, number][]) {
      const total = forecast.perSku[item.id] ?? 0;
      if (!ingSkuShare[ing]) ingSkuShare[ing] = {};
      ingSkuShare[ing][item.name] =
        (ingSkuShare[ing][item.name] ?? 0) + total * perUnit;
    }
  }

  const buckets: TimelineBucket[] = [];
  const hours = Object.keys(HOUR_PROFILE).map(Number).sort((a, b) => a - b);
  for (const h of hours) {
    const bucket: TimelineBucket = {
      hour: h,
      clock: fmtClock(h),
      demandShare: share[h],
      orders: forecast.p50 * share[h],
      stockouts: [],
    };
    // Apply prep arrivals at this hour
    for (const [ing, batches] of Object.entries(input.preppedAt ?? {}) as [
      string,
      { qty: number; hour: number }[],
    ][]) {
      for (const b of batches ?? []) {
        if (b.hour === h) onHand[ing] = (onHand[ing] ?? 0) + b.qty;
      }
    }

    // Consume ingredients proportional to hourly demand; detect stockout within this hour
    for (const [ing, hMap] of Object.entries(ingHourly)) {
      if (depletedFlag[ing]) continue;
      const burn = hMap[h] ?? 0;
      if (burn <= 0) continue;
      const remaining = onHand[ing] ?? 0;
      if (remaining <= 0) {
        // already out — skip; should have been flagged already
        continue;
      }
      if (remaining < burn) {
        // time-to-empty: fraction of hour
        const frac = remaining / burn;
        const mins = Math.max(0, Math.min(59, Math.floor(frac * 60)));
        const stockItem = STOCK.find((s) => s.id === ing);
        const label = stockItem?.label ?? ing;
        const unit = stockItem?.unit ?? "";
        const dailyNeed = Object.values(hMap).reduce((s, v) => s + v, 0);
        const skuShare = ingSkuShare[ing] ?? {};
        const total = Object.values(skuShare).reduce((a, b) => a + b, 0) || 1;
        const impacted = Object.entries(skuShare)
          .map(([name, v]) => ({ name, share: v / total }))
          .sort((a, b) => b.share - a.share)
          .slice(0, 3);

        const severity: StockoutEvent["severity"] =
          h <= 14 || h >= 19 ? "high" : h >= 17 ? "med" : "low";

        stockouts.push({
          id: ing as IngredientId,
          label,
          unit,
          atHour: h,
          atMinute: mins,
          clock: fmtClock(h, mins),
          depletedAt: fmtClock(h, mins),
          onHand: Math.round(remaining),
          dailyNeed: Math.round(dailyNeed),
          impactedSkus: impacted,
          hourlyBurn: Math.round(burn),
          severity,
        });
        bucket.stockouts.push(label);
        depletedFlag[ing] = true;
        onHand[ing] = 0;
      } else {
        onHand[ing] = remaining - burn;
      }
    }
    buckets.push(bucket);
  }

  stockouts.sort((a, b) => a.atHour * 60 + a.atMinute - (b.atHour * 60 + b.atMinute));
  return { buckets, stockouts };
}

// Pull today's actual hourly distribution for the "before" firefighting story.
export function todayOrdersByHour(history: GeneratedHistory) {
  const last = history.days[history.days.length - 1];
  return ordersByHourForDate(history, last.date)
    .filter((h) => h.hour >= 10 && h.hour <= 23)
    .map((h) => ({
      hour: h.hour,
      clock: fmtClock(h.hour),
      orders: h.orders,
    }));
}
