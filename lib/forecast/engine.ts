import { MENU } from "../mock/menu";
import {
  GeneratedHistory,
  promoForDate,
} from "../mock/orders";
import { addDays, isWeekend, startOfDay } from "../utils";
import { translate } from "../i18n/messages";

export type Weather = "sunny" | "cloudy" | "rainy" | "cold" | "hot";
export type LocalEvent = "none" | "match" | "holiday" | "school_break";

export type WhatIf = {
  weather: Weather;
  event: LocalEvent;
  promoUpliftPct: number; // -50 .. +50; default 0 means use natural promo
  pricePct: number; // -10 .. +10
  marketingPushPct: number; // 0 .. 50
};

export const DEFAULT_WHATIF: WhatIf = {
  weather: "cloudy",
  event: "none",
  promoUpliftPct: 0,
  pricePct: 0,
  marketingPushPct: 0,
};

const WEATHER_MULT: Record<Weather, number> = {
  sunny: 1.05,
  cloudy: 1.0,
  rainy: 1.12, // people stay in & order delivery
  cold: 1.08,
  hot: 0.95,
};

const EVENT_MULT: Record<LocalEvent, number> = {
  none: 1.0,
  match: 1.18,
  holiday: 1.10,
  school_break: 1.07,
};

export type DayForecast = {
  date: Date;
  weekday: number;
  baseline: number; // historical avg orders for this weekday
  promoMult: number;
  whatIfMult: number;
  p50: number; // expected orders
  p10: number;
  p90: number;
  revenue: number; // expected
  drivers: Driver[];
  perSku: Record<string, number>; // expected qty
};

export type Driver = {
  label: string;
  delta: number; // multiplier delta vs baseline (e.g. +0.18)
  kind: "promo" | "weekday" | "weather" | "event" | "marketing" | "price" | "trend";
};

// price elasticity (rough): -1.2 means -1% qty per +1% price
const PRICE_ELASTICITY = -1.2;

export type ForecastInput = {
  history: GeneratedHistory;
  date: Date; // forecast for this date
  whatIf?: Partial<WhatIf>;
  // for WoW accuracy demo, allow comparing prior promos
  applyNaturalPromo?: boolean;
};

function trimmedMean(values: number[], trim = 0.1) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const k = Math.floor(sorted.length * trim);
  const inner = sorted.slice(k, sorted.length - k);
  if (!inner.length) return sorted[Math.floor(sorted.length / 2)];
  return inner.reduce((s, v) => s + v, 0) / inner.length;
}

export function forecastDay(input: ForecastInput): DayForecast {
  const { history, date } = input;
  const wi: WhatIf = { ...DEFAULT_WHATIF, ...(input.whatIf ?? {}) };
  const weekday = date.getDay();
  const tr = (k: string, v?: Record<string, string | number>) =>
    translate(k, v);

  // baseline = trimmed mean of same-weekday orders in history
  const sameWeekday = history.days.filter((d) => d.date.getDay() === weekday);
  const baselineOrders = trimmedMean(sameWeekday.map((d) => d.orders.length));

  const drivers: Driver[] = [];

  // weekday already in baseline; track for transparency
  const weekdayMult = 1.0;
  drivers.push({
    label: tr("driver.baseline", { n: baselineOrders.toFixed(0) }),
    delta: 0,
    kind: "weekday",
  });

  // natural promo flag for this date
  const promo = promoForDate(date);
  const naturalPromoMult = input.applyNaturalPromo === false ? 1 : promo.demandMult;
  if (naturalPromoMult !== 1) {
    drivers.push({
      label: promo.name ?? tr("driver.promo_active"),
      delta: naturalPromoMult - 1,
      kind: "promo",
    });
  }

  // user-specified promo uplift (override / additional)
  const userPromo = 1 + wi.promoUpliftPct / 100;
  if (wi.promoUpliftPct !== 0) {
    drivers.push({
      label: tr("driver.promo_uplift", {
        sign: wi.promoUpliftPct > 0 ? "+" : "",
        pct: wi.promoUpliftPct,
      }),
      delta: userPromo - 1,
      kind: "promo",
    });
  }

  const wMult = WEATHER_MULT[wi.weather];
  if (wMult !== 1) {
    drivers.push({
      label: tr("driver.weather", {
        w: translate(`whatif.weather.${wi.weather}`),
      }),
      delta: wMult - 1,
      kind: "weather",
    });
  }
  const eMult = EVENT_MULT[wi.event];
  if (eMult !== 1) {
    drivers.push({
      label: tr("driver.event", {
        e: translate(`whatif.event.${wi.event}`),
      }),
      delta: eMult - 1,
      kind: "event",
    });
  }
  const mMult = 1 + wi.marketingPushPct / 100 * 0.4; // marketing has 40% conversion
  if (wi.marketingPushPct > 0) {
    drivers.push({
      label: tr("driver.marketing", { pct: wi.marketingPushPct }),
      delta: mMult - 1,
      kind: "marketing",
    });
  }
  const priceMult = 1 + (wi.pricePct / 100) * PRICE_ELASTICITY;
  if (wi.pricePct !== 0) {
    drivers.push({
      label: tr("driver.price", {
        sign: wi.pricePct > 0 ? "+" : "",
        pct: wi.pricePct,
      }),
      delta: priceMult - 1,
      kind: "price",
    });
  }

  const whatIfMult = wMult * eMult * mMult * priceMult * userPromo;

  const p50 = baselineOrders * weekdayMult * naturalPromoMult * whatIfMult;
  const sd = p50 * 0.10;
  const p10 = Math.max(0, p50 - 1.28 * sd);
  const p90 = p50 + 1.28 * sd;

  // Per-SKU mix from historical share, perturbed by promo weight on promoBoost items
  const totalQty: Record<string, number> = {};
  let allItems = 0;
  for (const d of sameWeekday) {
    for (const [k, v] of Object.entries(d.itemQty)) {
      totalQty[k] = (totalQty[k] ?? 0) + v;
      allItems += v;
    }
  }
  const perSku: Record<string, number> = {};
  // expected total items (historical items per order * forecasted orders)
  const itemsPerOrder = allItems / Math.max(1, sameWeekday.reduce((s, d) => s + d.orders.length, 0));
  const totalItems = p50 * itemsPerOrder;
  for (const item of MENU) {
    const share = (totalQty[item.id] ?? 0) / Math.max(1, allItems);
    const promoBoost =
      (item.promoBoost ?? 0) *
      ((promo.active && input.applyNaturalPromo !== false ? promo.weightBoost : 1) - 1);
    perSku[item.id] = share * totalItems * (1 + promoBoost);
  }

  // revenue estimate
  let revenue = 0;
  for (const item of MENU) {
    revenue += item.price * (1 + wi.pricePct / 100) * (perSku[item.id] ?? 0);
  }

  return {
    date,
    weekday,
    baseline: baselineOrders,
    promoMult: naturalPromoMult,
    whatIfMult,
    p50,
    p10,
    p90,
    revenue: Math.round(revenue * 100) / 100,
    drivers,
    perSku,
  };
}

export function forecastNDays(
  history: GeneratedHistory,
  startDate: Date,
  n: number,
  whatIf?: Partial<WhatIf>,
): DayForecast[] {
  const out: DayForecast[] = [];
  for (let i = 0; i < n; i++) {
    out.push(
      forecastDay({
        history,
        date: addDays(startOfDay(startDate), i),
        whatIf,
      }),
    );
  }
  return out;
}
