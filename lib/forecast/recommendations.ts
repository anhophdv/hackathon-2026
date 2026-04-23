import { GeneratedHistory, ordersByHourForDate, promoForDate } from "../mock/orders";
import {
  deliveryCapacityByHour,
  pizzaCapacityByHour,
  staffByHour,
} from "../mock/labor";
import { DayForecast, forecastDay, WhatIf } from "./engine";
import { buildIngredientPlan, buildPrepPlan } from "./inventory";
import { addDays, formatGBP } from "../utils";

export type Severity = "high" | "med" | "low";
export type Owner = "Manager" | "Shift Lead" | "Kitchen" | "Front" | "Driver";

export type ActionStep = {
  at: string; // "16:00"
  do: string; // "Prep 35 dough balls"
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
  confidence: number; // 0..1
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

  // Compare to last week same-day actual
  const lastWeek = history.days.find(
    (d) => d.date.getTime() === addDays(date, -7).getTime(),
  );
  const lastWeekOrders = lastWeek?.orders.length ?? forecast.baseline;
  const upliftVsLastWeek = (forecast.p50 - lastWeekOrders) / Math.max(1, lastWeekOrders);

  // ---- Inventory recs ----
  const ingredientPlan = buildIngredientPlan([forecast]);
  const ingredientShortfalls = ingredientPlan.filter((p) => p.shortfall > 0);
  for (const need of ingredientShortfalls.slice(0, 6)) {
    const sev: Severity =
      need.riskLevel === "high" ? "high" : need.riskLevel === "med" ? "med" : "low";
    recs.push({
      id: `inv_${need.id}`,
      severity: sev,
      category: "Inventory",
      title: `Order ${need.packsToOrder} pack${need.packsToOrder === 1 ? "" : "s"} of ${need.label} (${formatGBP(need.estCost)})`,
      whyItMatters: `Forecasted requirement ${need.requiredQty} ${need.unit}, on-hand only ${need.onHand} ${need.unit}. Shortfall ${need.shortfall} ${need.unit}.`,
      drivers: [
        ...forecast.drivers.filter((d) => d.delta !== 0).map((d) => d.label),
        `Lead time ${need.leadTimeHrs}h, supplier cutoff ${need.cutoffHour}:00`,
      ],
      steps: [
        {
          at: `${String(need.cutoffHour - 1).padStart(2, "0")}:30`,
          do: `Place purchase order with depot for ${need.packsToOrder} × ${need.packSize} ${need.unit}`,
          owner: "Manager",
          qty: need.packsToOrder,
          unit: "packs",
        },
        {
          at: `${String(need.cutoffHour).padStart(2, "0")}:00`,
          do: "Confirm cutoff acknowledgement from depot",
          owner: "Manager",
        },
      ],
      expectedImpact: `Prevents stockout of ${need.label}; protects ~${Math.round((need.shortfall / Math.max(1, need.requiredQty)) * forecast.p50)} at-risk orders`,
      confidence: need.riskLevel === "high" ? 0.92 : 0.84,
      freshnessMins: 5,
    });
  }

  // ---- Prep recs ----
  const prep = buildPrepPlan(forecast);
  if (prep.length) {
    recs.push({
      id: "prep_today",
      severity: upliftVsLastWeek > 0.10 ? "high" : "med",
      category: "Prep",
      title: `Pre-prep batch for tonight's peak (forecast ${Math.round(forecast.p50)} orders, ${upliftVsLastWeek >= 0 ? "+" : ""}${clipPct(upliftVsLastWeek)}% vs last week)`,
      whyItMatters: `Peak window 18:00-21:00 expected to deliver ~${Math.round(forecast.p50 * 0.42)} orders. Make-line throughput must be primed.`,
      drivers: forecast.drivers.filter((d) => d.delta !== 0).map((d) => d.label),
      steps: prep.map((t, i) => ({
        at: t.doBy.replace("before ", ""),
        do: `${t.label}`,
        qty: t.qty,
        unit: t.unit,
        owner: "Kitchen" as Owner,
      })),
      expectedImpact: `Reduces ticket time by ~25%, prevents 8-12 dough stockouts at peak`,
      confidence: 0.88,
      freshnessMins: 2,
    });
  }

  // ---- Labor / capacity recs ----
  // Detect peak-hour capacity gaps vs forecast hourly orders
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
    const worst = gaps.reduce((a, b) => (a.demand - a.cap > b.demand - b.cap ? a : b));
    recs.push({
      id: "labor_makeline",
      severity: "high",
      category: "Labor",
      title: `Add 1 Make-Line cover ${worst.hour}:00-${worst.hour + 2}:00 (projected ${Math.round(worst.demand)} orders vs ${Math.round(worst.cap)} capacity)`,
      whyItMatters: `Without extra cover, ticket time at ${worst.hour}:00 will exceed 18 min and customer satisfaction will drop.`,
      drivers: [
        `Forecast ${Math.round(forecast.p50)} orders today (+${clipPct(upliftVsLastWeek)}% WoW)`,
        ...forecast.drivers.filter((d) => d.delta !== 0).map((d) => d.label),
      ],
      steps: [
        {
          at: `${String(worst.hour - 1).padStart(2, "0")}:30`,
          do: "Move Sam from Front to Make-Line",
          owner: "Shift Lead",
        },
        {
          at: `${String(worst.hour).padStart(2, "0")}:00`,
          do: "Pre-heat secondary oven",
          owner: "Kitchen",
        },
        {
          at: `${String(worst.hour).padStart(2, "0")}:30`,
          do: "Stagger 15-min breaks; no breaks in peak window",
          owner: "Shift Lead",
        },
      ],
      expectedImpact: `Adds ~22 pizza/hr capacity, holds ticket time ≤ 12 min, protects ~£${Math.round(gaps.reduce((s, g) => s + (g.demand - g.cap), 0) * 14)} revenue`,
      confidence: 0.87,
      freshnessMins: 4,
    });
  }

  // Driver capacity for delivery
  const drv = deliveryCapacityByHour(19);
  const projDeliv = forecast.p50 * 0.55 * 0.18; // 18% of orders fall in 19h, ~55% delivery
  if (projDeliv > drv) {
    recs.push({
      id: "labor_driver",
      severity: "med",
      category: "Capacity",
      title: `Call in 1 extra driver 18:00-21:30`,
      whyItMatters: `Projected ${Math.round(projDeliv)} delivery orders/hr at 19:00 vs ${drv.toFixed(1)} driver capacity.`,
      drivers: [
        `Delivery share 55%`,
        ...forecast.drivers.filter((d) => d.delta !== 0).map((d) => d.label),
      ],
      steps: [
        { at: "16:00", do: "Phone Hugo for additional 18:00-21:30 cover", owner: "Manager" },
        { at: "17:45", do: "Brief on delivery zones A-C", owner: "Shift Lead" },
      ],
      expectedImpact: "Holds delivery promise time at 30 min; protects ~12 late-delivery refunds",
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
      title: `Activate "${promo.name}" assets across in-store, online and social`,
      whyItMatters: `Today is a promo day. Historical uplift +${clipPct(promo.demandMult - 1)}% on order count and +${clipPct(((promo as any).weightBoost ?? 1) - 1)}% on Pepperoni / Meat Feast share.`,
      drivers: [`Weekday: ${date.toLocaleDateString("en-GB", { weekday: "long" })}`, "Recurring promotion"],
      steps: [
        { at: "11:00", do: "Refresh in-store screens with promo creative", owner: "Front" },
        { at: "11:30", do: "Push social reminder + WhatsApp broadcast", owner: "Manager" },
        { at: "16:00", do: "Refresh signage for evening footfall", owner: "Front" },
      ],
      expectedImpact: `+${clipPct(promo.demandMult - 1)}% orders, ~${formatGBP(forecast.revenue * (promo.demandMult - 1) * 0.3)} incremental revenue`,
      confidence: 0.82,
      freshnessMins: 1,
    });
  }

  // ---- Waste rec (if forecast is BELOW last week)
  if (upliftVsLastWeek < -0.08) {
    recs.push({
      id: "waste_underprep",
      severity: "med",
      category: "Waste",
      title: `Reduce dough prep by ~${Math.abs(Math.round(upliftVsLastWeek * 100))}% vs last ${date.toLocaleDateString("en-GB", { weekday: "long" })}`,
      whyItMatters: `Forecast is ${clipPct(upliftVsLastWeek)}% below last week — over-prep would mean dough waste at end of shelf life.`,
      drivers: forecast.drivers.filter((d) => d.delta < 0).map((d) => d.label),
      steps: [
        { at: "15:30", do: "Re-balance dough prep batch downward", owner: "Kitchen" },
        { at: "20:00", do: "Re-forecast on actuals; adjust closing-shift prep", owner: "Shift Lead" },
      ],
      expectedImpact: `Saves ~${formatGBP(Math.abs(upliftVsLastWeek) * forecast.revenue * 0.08)} waste`,
      confidence: 0.75,
      freshnessMins: 3,
    });
  }

  // Sort by severity then confidence
  const sevOrder: Record<Severity, number> = { high: 0, med: 1, low: 2 };
  recs.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity] || b.confidence - a.confidence);

  return { for: date, forecast, recs };
}
