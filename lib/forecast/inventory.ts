import { IngredientId, MENU } from "../mock/menu";
import { STOCK, STOCK_BY_ID } from "../mock/inventory";
import { DayForecast } from "./engine";

export type IngredientNeed = {
  id: IngredientId;
  label: string;
  unit: string;
  requiredQty: number; // total requirement for the period
  onHand: number;
  shortfall: number; // requiredQty - onHand (capped at 0 below)
  packsToOrder: number;
  packSize: number;
  estCost: number;
  cutoffHour: number;
  leadTimeHrs: number;
  shelfLifeHrs: number;
  riskLevel: "high" | "med" | "low" | "ok";
};

export function explodeBom(perSku: Record<string, number>) {
  const need: Partial<Record<IngredientId, number>> = {};
  for (const [skuId, qty] of Object.entries(perSku)) {
    const item = MENU.find((m) => m.id === skuId);
    if (!item) continue;
    for (const [ing, perUnit] of Object.entries(item.bom) as [
      IngredientId,
      number,
    ][]) {
      need[ing] = (need[ing] ?? 0) + perUnit * qty;
    }
  }
  return need;
}

export function buildIngredientPlan(
  forecasts: DayForecast[],
  safetyStockPct = 0.10,
): IngredientNeed[] {
  // total per ingredient across forecast horizon
  const totalNeed: Partial<Record<IngredientId, number>> = {};
  for (const f of forecasts) {
    const e = explodeBom(f.perSku);
    for (const [k, v] of Object.entries(e) as [IngredientId, number][]) {
      totalNeed[k] = (totalNeed[k] ?? 0) + v;
    }
  }

  return STOCK.map((s) => {
    const required = (totalNeed[s.id] ?? 0) * (1 + safetyStockPct);
    const shortfall = Math.max(0, required - s.onHand);
    const packs = Math.ceil(shortfall / s.packSize);
    const orderUnits = packs * s.packSize;
    const cost = orderUnits * s.unitCost;

    // risk: how many days of cover do we have?
    const dailyAvg = required / Math.max(1, forecasts.length);
    const daysCover = dailyAvg > 0 ? s.onHand / dailyAvg : 99;
    let risk: IngredientNeed["riskLevel"] = "ok";
    if (daysCover < 0.5) risk = "high";
    else if (daysCover < 1) risk = "med";
    else if (daysCover < 1.5) risk = "low";

    return {
      id: s.id,
      label: s.label,
      unit: s.unit,
      requiredQty: Math.round(required),
      onHand: s.onHand,
      shortfall: Math.round(shortfall),
      packsToOrder: packs,
      packSize: s.packSize,
      estCost: Math.round(cost * 100) / 100,
      cutoffHour: s.cutoffHour,
      leadTimeHrs: s.leadTimeHrs,
      shelfLifeHrs: s.shelfLifeHrs,
      riskLevel: risk,
    };
  }).sort((a, b) => {
    const order = { high: 0, med: 1, low: 2, ok: 3 } as const;
    return order[a.riskLevel] - order[b.riskLevel];
  });
}

export type PrepTask = {
  id: string;
  label: string;
  qty: number;
  unit: string;
  doBy: string; // e.g. "before 17:00"
  reason: string;
};

// Time-bucketed prep tasks for a single day forecast (e.g. dough must be prepped 4h before peak).
export function buildPrepPlan(forecast: DayForecast): PrepTask[] {
  const e = explodeBom(forecast.perSku);
  const tasks: PrepTask[] = [];

  const doughLarge = Math.round(e.dough_large ?? 0);
  const doughMedium = Math.round(e.dough_medium ?? 0);
  if (doughLarge > 0) {
    tasks.push({
      id: "prep_dough_l",
      label: "Prep large dough balls",
      qty: doughLarge,
      unit: "balls",
      doBy: "before 16:00",
      reason: "Cold-proof needs 2-3h before evening peak (18:00-21:00)",
    });
  }
  if (doughMedium > 0) {
    tasks.push({
      id: "prep_dough_m",
      label: "Prep medium dough balls",
      qty: doughMedium,
      unit: "balls",
      doBy: "before 16:00",
      reason: "Cold-proof needs 2-3h before evening peak",
    });
  }

  const cheese = Math.round((e.mozzarella_g ?? 0) / 1000);
  if (cheese > 0) {
    tasks.push({
      id: "prep_cheese",
      label: "Pre-shred mozzarella",
      qty: cheese,
      unit: "kg",
      doBy: "before 17:00",
      reason: "Make-line consumes ~22 pizzas/staff/hour at peak",
    });
  }

  const wings = Math.round(e.wing_pieces ?? 0);
  if (wings > 0) {
    tasks.push({
      id: "prep_wings",
      label: "Marinate wings",
      qty: wings,
      unit: "pcs",
      doBy: "before 16:00",
      reason: "30 min marinade + holding",
    });
  }
  return tasks;
}
