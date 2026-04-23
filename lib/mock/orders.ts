import { MENU, MenuItem, Category } from "./menu";
import { gauss, makeRng, pickWeighted, randInt } from "./rng";
import { addDays, isWeekend, startOfDay } from "../utils";

export type OrderLine = {
  itemId: string;
  qty: number;
  price: number;
};

export type Order = {
  id: string;
  ts: Date; // timestamp placed
  channel: "Dine-in" | "Collection" | "Delivery";
  lines: OrderLine[];
  total: number;
  promo?: string;
};

export type DayBucket = {
  date: Date;
  orders: Order[];
  revenue: number;
  itemQty: Record<string, number>;
  category: Record<Category, number>;
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

const WEEKDAY_MULT: number[] = [
  1.55, // Sun
  0.85, // Mon
  1.05, // Tue (2-for-Tuesday promo)
  0.90, // Wed
  1.00, // Thu
  1.35, // Fri
  1.65, // Sat
];

export type PromoFlag = {
  active: boolean;
  name?: string;
  // multiplier applied to selection weight of items with promoBoost
  weightBoost: number;
  // overall demand multiplier for the day
  demandMult: number;
};

export function promoForDate(d: Date): PromoFlag {
  const day = d.getDay();
  // Tuesdays: "2 for Tuesday" boosts pepperoni & meat feast slightly
  if (day === 2)
    return {
      active: true,
      name: "2 for Tuesday",
      weightBoost: 1.15,
      demandMult: 1.08,
    };
  // Weekends: "Family Weekend Deal" - bigger uplift
  if (day === 5)
    return {
      active: true,
      name: "Friday Family Deal",
      weightBoost: 1.35,
      demandMult: 1.18,
    };
  if (day === 6 || day === 0)
    return {
      active: true,
      name: "Weekend Family Deal",
      weightBoost: 1.45,
      demandMult: 1.25,
    };
  return { active: false, weightBoost: 1, demandMult: 1 };
}

function pickItemFor(
  rand: () => number,
  category: Category,
  promo: PromoFlag,
): MenuItem {
  const items = MENU.filter((m) => m.category === category).map((item) => ({
    item,
    weight:
      item.popularity *
      (1 + (item.promoBoost ?? 0) * (promo.active ? promo.weightBoost : 0)),
  }));
  return pickWeighted(rand, items);
}

function buildBasket(rand: () => number, promo: PromoFlag): OrderLine[] {
  const lines: OrderLine[] = [];

  // Always at least one pizza
  const pizzaCount = pickWeighted(rand, [
    { item: 1, weight: 0.55 },
    { item: 2, weight: 0.30 },
    { item: 3, weight: 0.12 },
    { item: 4, weight: 0.03 },
  ]);
  for (let i = 0; i < pizzaCount; i++) {
    const it = pickItemFor(rand, "Pizza", promo);
    lines.push({ itemId: it.id, qty: 1, price: it.price });
  }

  // Side attach rate
  if (rand() < 0.65) {
    const it = pickItemFor(rand, "Side", promo);
    lines.push({ itemId: it.id, qty: 1, price: it.price });
  }
  if (rand() < 0.20) {
    const it = pickItemFor(rand, "Side", promo);
    lines.push({ itemId: it.id, qty: 1, price: it.price });
  }
  // Drink
  if (rand() < 0.70) {
    const it = pickItemFor(rand, "Drink", promo);
    lines.push({ itemId: it.id, qty: 1, price: it.price });
  }
  // Dessert
  if (rand() < 0.25) {
    const it = pickItemFor(rand, "Dessert", promo);
    lines.push({ itemId: it.id, qty: 1, price: it.price });
  }
  return lines;
}

const CHANNELS: { ch: Order["channel"]; w: number }[] = [
  { ch: "Delivery", w: 0.55 },
  { ch: "Collection", w: 0.30 },
  { ch: "Dine-in", w: 0.15 },
];

export type GeneratedHistory = {
  startDate: Date; // inclusive (28 days back)
  endDate: Date; // inclusive (today)
  days: DayBucket[];
};

export type GenerateOptions = {
  weeks?: number; // default 4
  baseDailyOrders?: number; // mean orders for a Monday
  seed?: number;
  endDate?: Date; // inclusive end (defaults to today)
};

export function generateHistory(opts: GenerateOptions = {}): GeneratedHistory {
  const weeks = opts.weeks ?? 4;
  const base = opts.baseDailyOrders ?? 110;
  const rand = makeRng(opts.seed ?? 20260423);
  const end = startOfDay(opts.endDate ?? new Date());
  const start = addDays(end, -(weeks * 7 - 1));

  const days: DayBucket[] = [];
  let serial = 0;

  for (let i = 0; i < weeks * 7; i++) {
    const date = addDays(start, i);
    const promo = promoForDate(date);
    const weekdayMult = WEEKDAY_MULT[date.getDay()];

    // tiny week-on-week trend so the chart shows movement
    const trend = 1 + (i / (weeks * 7)) * 0.06;

    // target order count for the day
    let target = base * weekdayMult * promo.demandMult * trend;
    target += gauss(rand, 0, target * 0.06); // noise
    target = Math.round(Math.max(80, Math.min(220, target)));

    const orders: Order[] = [];
    const itemQty: Record<string, number> = {};
    const cat: Record<Category, number> = {
      Pizza: 0,
      Side: 0,
      Drink: 0,
      Dessert: 0,
    };
    let revenue = 0;

    // Distribute orders across hours weighted by HOUR_PROFILE
    const hours = Object.keys(HOUR_PROFILE).map(Number);
    const hourWeights = hours.map((h) => ({ item: h, weight: HOUR_PROFILE[h] }));

    for (let n = 0; n < target; n++) {
      const hour = pickWeighted(rand, hourWeights);
      const minute = randInt(rand, 0, 59);
      const ts = new Date(date);
      ts.setHours(hour, minute, 0, 0);

      const lines = buildBasket(rand, promo);
      const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
      revenue += total;
      for (const l of lines) {
        itemQty[l.itemId] = (itemQty[l.itemId] ?? 0) + l.qty;
        const item = MENU.find((m) => m.id === l.itemId)!;
        cat[item.category] += l.qty;
      }
      orders.push({
        id: `O${date.toISOString().slice(0, 10)}-${(serial++).toString().padStart(5, "0")}`,
        ts,
        channel: pickWeighted(
          rand,
          CHANNELS.map((c) => ({ item: c.ch, weight: c.w })),
        ),
        lines,
        total,
        promo: promo.active ? promo.name : undefined,
      });
    }

    days.push({
      date,
      orders,
      revenue: Math.round(revenue * 100) / 100,
      itemQty,
      category: cat,
    });
  }

  return { startDate: start, endDate: end, days };
}

// ---- aggregations ----
export function totalsByDay(history: GeneratedHistory) {
  return history.days.map((d) => ({
    date: d.date,
    orders: d.orders.length,
    revenue: d.revenue,
  }));
}

export function totalsByItem(history: GeneratedHistory) {
  const out: Record<string, number> = {};
  for (const d of history.days) {
    for (const [k, v] of Object.entries(d.itemQty)) {
      out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}

export function ordersByHourForDate(history: GeneratedHistory, date: Date) {
  const day = history.days.find(
    (d) => d.date.toDateString() === date.toDateString(),
  );
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0 }));
  if (!day) return hours;
  for (const o of day.orders) hours[o.ts.getHours()].orders++;
  return hours;
}
