import { GeneratedHistory } from "../mock/orders";
import { addDays, startOfDay } from "../utils";
import { forecastDay } from "./engine";

const INTL_LOCALE = "en-GB";

export type AccuracyPoint = {
  date: Date;
  label: string;
  actualOrders: number;
  actualRevenue: number;
  predOrders: number;
  predOrdersP10: number;
  predOrdersP90: number;
  predRevenue: number;
};

// Walks last N days of history, generating a forecast that uses ONLY the days strictly before each target date.
export function walkForwardAccuracy(
  history: GeneratedHistory,
  days = 21,
): AccuracyPoint[] {
  const out: AccuracyPoint[] = [];
  const end = startOfDay(history.endDate);
  for (let i = days - 1; i >= 0; i--) {
    const target = addDays(end, -i);
    const trimmed: GeneratedHistory = {
      ...history,
      days: history.days.filter((d) => d.date.getTime() < target.getTime()),
      startDate: history.startDate,
      endDate: addDays(target, -1),
    };
    if (trimmed.days.length < 7) continue;
    const f = forecastDay({ history: trimmed, date: target });
    const actual = history.days.find((d) => d.date.getTime() === target.getTime());
    if (!actual) continue;
    out.push({
      date: target,
      label: target.toLocaleDateString(INTL_LOCALE, { weekday: "short", day: "2-digit", month: "short" }),
      actualOrders: actual.orders.length,
      actualRevenue: actual.revenue,
      predOrders: Math.round(f.p50),
      predOrdersP10: Math.round(f.p10),
      predOrdersP90: Math.round(f.p90),
      predRevenue: f.revenue,
    });
  }
  return out;
}

export type AccuracyKpis = {
  mape: number; // 0..1
  bias: number; // (pred-actual)/actual avg
  hitRate: number; // % within p10..p90
  stockoutsPrevented: number; // demo metric
  wasteSavedGBP: number; // demo metric
};

export function computeAccuracyKpis(points: AccuracyPoint[]): AccuracyKpis {
  if (!points.length) {
    return { mape: 0, bias: 0, hitRate: 0, stockoutsPrevented: 0, wasteSavedGBP: 0 };
  }
  let mape = 0;
  let bias = 0;
  let hits = 0;
  for (const p of points) {
    const err = (p.predOrders - p.actualOrders) / Math.max(1, p.actualOrders);
    mape += Math.abs(err);
    bias += err;
    if (p.actualOrders >= p.predOrdersP10 && p.actualOrders <= p.predOrdersP90) hits++;
  }
  return {
    mape: mape / points.length,
    bias: bias / points.length,
    hitRate: hits / points.length,
    stockoutsPrevented: Math.round(points.length * 1.6),
    wasteSavedGBP: Math.round(points.reduce((s, p) => s + p.actualRevenue * 0.018, 0)),
  };
}

// Compare two consecutive weeks (week-over-week) for the chart toggle
export function weekOverWeek(history: GeneratedHistory) {
  const end = startOfDay(history.endDate);
  const thisWeek = Array.from({ length: 7 }, (_, i) =>
    history.days.find((d) => d.date.getTime() === addDays(end, -6 + i).getTime()),
  );
  const lastWeek = Array.from({ length: 7 }, (_, i) =>
    history.days.find((d) => d.date.getTime() === addDays(end, -13 + i).getTime()),
  );
  return thisWeek.map((d, i) => ({
    label: d?.date.toLocaleDateString(INTL_LOCALE, { weekday: "short" }) ?? "",
    thisWeek: d?.orders.length ?? 0,
    lastWeek: lastWeek[i]?.orders.length ?? 0,
    thisRev: d?.revenue ?? 0,
    lastRev: lastWeek[i]?.revenue ?? 0,
  }));
}
