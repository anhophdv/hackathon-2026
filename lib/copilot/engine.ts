// Deterministic Byte answer engine.
// Matches store manager questions against intents, then produces grounded
// responses from the same forecast / recommendation / timeline engines that
// power the rest of the app. The manager stays in control — every answer cites
// drivers, confidence, and a suggested next action.
//
// In production this layer is where an LLM would generate the narrative, but
// the underlying decisions would still be deterministic (as the Q&A says:
// "deterministic core + LLM for interaction & explanation").

import { GeneratedHistory, promoForDate } from "../mock/orders";
import { addDays, formatGBP } from "../utils";
import { forecastDay, WhatIf, DEFAULT_WHATIF } from "../forecast/engine";
import { buildTimeline } from "../forecast/timeline";
import { buildRecommendations } from "../forecast/recommendations";
import { buildPrepPlan } from "../forecast/inventory";
import { translate } from "../i18n/messages";

export type CopilotRole = "user" | "copilot";

export type CopilotCitation = {
  label: string;
  href?: string;
};

export type CopilotCard =
  | { kind: "recommendation"; id: string; title: string; severity: "high" | "med" | "low" }
  | { kind: "stockout"; label: string; clock: string; severity: "high" | "med" | "low" }
  | { kind: "kpi"; label: string; value: string; tone?: "good" | "warn" | "bad" };

export type CopilotMessage = {
  id: string;
  role: CopilotRole;
  text: string;
  confidence?: number;
  citations?: CopilotCitation[];
  cards?: CopilotCard[];
  suggested?: string[];
  intent?: CopilotIntent;
};

export type CopilotIntent =
  | "why_demand"
  | "whatif_prep"
  | "whatif_promo"
  | "whatif_rain"
  | "biggest_risk"
  | "stockout_time"
  | "compare_last_week"
  | "todays_plan"
  | "prep_quantity"
  | "revenue_forecast"
  | "confidence"
  | "fallback";

const INTENT_PATTERNS: { intent: CopilotIntent; re: RegExp }[] = [
  { intent: "why_demand", re: /\b(why|reason|explain).*(higher|increase|up|demand|busy|forecast)/i },
  { intent: "why_demand", re: /\bwhy\??$/i },
  { intent: "whatif_prep", re: /what ?if.*(reduce|cut|less|lower).*(prep|dough|batch)|prep.*(by|-)?\s?-?\d+%/i },
  { intent: "whatif_prep", re: /what ?if.*(don.?t|no).*(increase|prep|prepare)/i },
  { intent: "whatif_promo", re: /what ?if.*(promo|discount|deal|offer)/i },
  { intent: "whatif_rain", re: /what ?if.*(rain|weather|sunny|cold|hot)/i },
  { intent: "biggest_risk", re: /\b(biggest|top|main).*(risk|problem|concern|issue)\b|what.*at risk/i },
  { intent: "stockout_time", re: /\b(when|what time).*(stock ?out|run ?out|shortage|empty)\b|will.*(run out|stock ?out)/i },
  { intent: "stockout_time", re: /\bstock ?out\b/i },
  { intent: "compare_last_week", re: /\b(last|previous) week|vs ?last|compare/i },
  { intent: "todays_plan", re: /\b(today.?s plan|plan for today|what should i (do|prep|prepare))\b/i },
  { intent: "prep_quantity", re: /\bhow (much|many).*(prep|prepare|dough|order|need)\b/i },
  { intent: "revenue_forecast", re: /\b(revenue|sales|take).*forecast|how much.*(sell|make|revenue)/i },
  { intent: "confidence", re: /\b(confiden|sure|accurate|trust|reliab)/i },
];

function matchIntent(text: string): CopilotIntent {
  for (const p of INTENT_PATTERNS) {
    if (p.re.test(text)) return p.intent;
  }
  return "fallback";
}

function pct(x: number, d = 0) {
  const v = x * 100;
  return `${v > 0 ? "+" : ""}${v.toFixed(d)}%`;
}

function rid() {
  return "m_" + Math.random().toString(36).slice(2, 9);
}

export type CopilotContext = {
  history: GeneratedHistory;
  targetDate: Date;
  whatIf: WhatIf;
};

const DATE_LOCALE = "en-GB";

function defaultSuggestions(): string[] {
  return [
    translate("copilot.sugg.biggest_risk"),
    translate("copilot.sugg.why_demand"),
    translate("copilot.sugg.whatif_prep"),
    translate("copilot.sugg.when_dough"),
    translate("copilot.sugg.compare_friday"),
  ];
}

function longWeekday(d: Date) {
  return translate(`weekday.${d.getDay()}`);
}

function shortDate(d: Date) {
  return d.toLocaleDateString(DATE_LOCALE, {
    day: "2-digit",
    month: "short",
  });
}

const tr = (
  k: string,
  v?: Record<string, string | number | undefined | null>,
) => translate(k, v);

// ---------- intent handlers ----------

function h_whyDemand(ctx: CopilotContext): CopilotMessage {
  const f = forecastDay({
    history: ctx.history,
    date: ctx.targetDate,
    whatIf: ctx.whatIf,
  });
  const lastWeek = ctx.history.days.find(
    (d) => d.date.getTime() === addDays(ctx.targetDate, -7).getTime(),
  );
  const lastWeekOrders = lastWeek?.orders.length ?? f.baseline;
  const delta = (f.p50 - lastWeekOrders) / Math.max(1, lastWeekOrders);
  const promo = promoForDate(ctx.targetDate);
  const day = longWeekday(ctx.targetDate);
  const topDrivers = f.drivers.filter((d) => d.delta !== 0);

  const parts: string[] = [];
  parts.push(
    tr("copilot.why_demand.headline", {
      day,
      orders: Math.round(f.p50),
      p10: Math.round(f.p10),
      p90: Math.round(f.p90),
      deltaPct: pct(delta, 1),
      lastWeekOrders,
    }),
  );
  parts.push("");
  parts.push(tr("copilot.why_demand.why_shift", { day }));
  for (const d of topDrivers) {
    parts.push(`- ${d.label} → ${pct(d.delta, 1)}`);
  }
  if (!topDrivers.length) {
    parts.push(tr("copilot.why_demand.no_drivers"));
  }
  if (promo.active) {
    parts.push("");
    parts.push(tr("copilot.why_demand.promo", { name: promo.name }));
  }

  return {
    id: rid(),
    role: "copilot",
    text: parts.join("\n"),
    confidence: 0.86,
    citations: [
      { label: tr("copilot.citation.baseline", { n: f.baseline.toFixed(0) }) },
      {
        label: tr("copilot.citation.last_actual", {
          day,
          n: lastWeekOrders,
        }),
      },
    ],
    intent: "why_demand",
    suggested: [
      tr("copilot.sugg.what_prepare"),
      tr("copilot.sugg.when_mozzarella"),
      tr("copilot.sugg.whatif_rain"),
    ],
  };
}

function h_whatifPrep(userText: string, ctx: CopilotContext): CopilotMessage {
  const m = userText.match(/-?\s?(\d{1,3})\s?%/);
  const raw = m ? parseInt(m[1], 10) : 20;
  const reduction = Math.min(60, Math.max(5, Math.abs(raw))) / 100;

  const f = forecastDay({
    history: ctx.history,
    date: ctx.targetDate,
    whatIf: ctx.whatIf,
  });
  const normalTimeline = buildTimeline({ forecast: f });
  const prepPlan = buildPrepPlan(f);
  const reducedOnHand: Record<string, number> = {};
  const cutTimeline = buildTimeline({
    forecast: f,
    onHand: prepPlan.reduce((acc, t) => {
      if (t.id.startsWith("prep_dough_l")) {
        acc["dough_large"] = -Math.round(
          (f.perSku["pz_pepperoni_l"] ?? 0) * reduction,
        );
      }
      if (t.id.startsWith("prep_dough_m")) {
        acc["dough_medium"] = -Math.round(
          (f.perSku["pz_create_m"] ?? 0) * reduction,
        );
      }
      return acc;
    }, reducedOnHand),
  });

  const baseIds = new Set(normalTimeline.stockouts.map((s) => s.id));
  const extras = cutTimeline.stockouts.filter((s) => !baseIds.has(s.id));
  const earliest = (extras[0] ?? cutTimeline.stockouts[0]) ?? null;

  const parts: string[] = [];
  parts.push(tr("copilot.whatif_prep.headline", { pct: Math.round(reduction * 100) }));
  parts.push("");
  if (earliest) {
    parts.push(
      tr("copilot.whatif_prep.stockout", {
        item: earliest.label,
        clock: earliest.clock,
      }),
    );
    parts.push(
      tr("copilot.whatif_prep.impact", {
        items: earliest.impactedSkus.map((s) => s.name).join(", "),
      }),
    );
  } else {
    parts.push(tr("copilot.whatif_prep.no_stockouts"));
  }
  parts.push(tr("copilot.whatif_prep.delay", { pct: Math.round(reduction * 70) }));
  parts.push(
    tr("copilot.whatif_prep.revenue", {
      gbp: formatGBP(f.revenue * reduction * 0.28),
    }),
  );
  parts.push("");
  parts.push(
    tr("copilot.whatif_prep.recommendation", {
      alt: tr(
        ctx.targetDate.getDay() === 5
          ? "copilot.whatif_prep.alt_tuesday"
          : "copilot.whatif_prep.alt_other",
      ),
    }),
  );

  return {
    id: rid(),
    role: "copilot",
    text: parts.join("\n"),
    confidence: 0.79,
    intent: "whatif_prep",
    cards: earliest
      ? [
          {
            kind: "stockout",
            label: earliest.label,
            clock: earliest.clock,
            severity: "high",
          },
        ]
      : [],
    citations: [
      { label: tr("copilot.citation.forecast_bom"), href: "/predictions" },
    ],
    suggested: [
      tr("copilot.sugg.whatif_rain"),
      tr("copilot.sugg.show_prep_plan"),
      tr("copilot.sugg.biggest_risk"),
    ],
  };
}

function h_whatifPromo(ctx: CopilotContext): CopilotMessage {
  const base = forecastDay({
    history: ctx.history,
    date: ctx.targetDate,
    whatIf: DEFAULT_WHATIF,
  });
  const boosted = forecastDay({
    history: ctx.history,
    date: ctx.targetDate,
    whatIf: { ...ctx.whatIf, promoUpliftPct: 20 },
  });
  const uplift = (boosted.p50 - base.p50) / base.p50;
  const revUp = boosted.revenue - base.revenue;

  return {
    id: rid(),
    role: "copilot",
    text: tr("copilot.whatif_promo.body", {
      orders: Math.round(boosted.p50),
      deltaPct: pct(uplift, 1),
      gbp: formatGBP(revUp),
      pizzas: Math.round(
        (boosted.perSku["pz_pepperoni_l"] ?? 0) -
          (base.perSku["pz_pepperoni_l"] ?? 0),
      ),
    }),
    confidence: 0.81,
    intent: "whatif_promo",
    suggested: [tr("copilot.sugg.drivers_enough"), tr("copilot.sugg.top3")],
  };
}

function h_whatifRain(ctx: CopilotContext): CopilotMessage {
  const base = forecastDay({
    history: ctx.history,
    date: ctx.targetDate,
    whatIf: DEFAULT_WHATIF,
  });
  const rainy = forecastDay({
    history: ctx.history,
    date: ctx.targetDate,
    whatIf: { ...ctx.whatIf, weather: "rainy" },
  });
  const delta = (rainy.p50 - base.p50) / base.p50;
  return {
    id: rid(),
    role: "copilot",
    text: tr("copilot.whatif_rain.body", {
      orders: Math.round(rainy.p50),
      deltaPct: pct(delta, 1),
    }),
    confidence: 0.77,
    intent: "whatif_rain",
  };
}

function h_biggestRisk(ctx: CopilotContext): CopilotMessage {
  const bundle = buildRecommendations(ctx.history, ctx.targetDate, ctx.whatIf);
  const top = bundle.recs[0];
  if (!top) {
    return {
      id: rid(),
      role: "copilot",
      text: tr("copilot.biggest_risk.none"),
      confidence: 0.9,
      intent: "biggest_risk",
    };
  }
  const drivers = top.drivers
    .slice(0, 3)
    .map((d) => `- ${d}`)
    .join("\n");
  const steps = top.steps
    .map(
      (s) =>
        `- **${s.at}** ${s.do}${s.qty ? ` (${s.qty} ${s.unit ?? ""})` : ""}` +
        (s.owner ? ` — ${translate(`owner.${s.owner}`)}` : ""),
    )
    .join("\n");
  return {
    id: rid(),
    role: "copilot",
    text: tr("copilot.biggest_risk.body", {
      title: top.title,
      why: top.whyItMatters,
      driverWord: tr(
        top.drivers.length > 1
          ? "copilot.biggest_risk.driver_many"
          : "copilot.biggest_risk.driver_one",
      ),
      drivers,
      steps,
      impact: top.expectedImpact,
    }),
    confidence: top.confidence,
    intent: "biggest_risk",
    cards: [
      {
        kind: "recommendation",
        id: top.id,
        title: top.title,
        severity: top.severity,
      },
    ],
    citations: [
      {
        label: tr("copilot.citation.recs_n", { n: bundle.recs.length }),
        href: "/recommendations",
      },
    ],
    suggested: [tr("copilot.sugg.skip_action"), tr("copilot.sugg.top3")],
  };
}

function h_stockoutTime(userText: string, ctx: CopilotContext): CopilotMessage {
  const f = forecastDay({
    history: ctx.history,
    date: ctx.targetDate,
    whatIf: ctx.whatIf,
  });
  const tl = buildTimeline({ forecast: f });
  const q = userText.toLowerCase();
  const matches = tl.stockouts.filter((s) =>
    q.includes(s.label.toLowerCase().split(" ")[0]),
  );
  const list = matches.length ? matches : tl.stockouts.slice(0, 3);
  if (!list.length) {
    return {
      id: rid(),
      role: "copilot",
      text: tr("copilot.stockout.none"),
      confidence: 0.88,
      intent: "stockout_time",
    };
  }
  const listText = list
    .map((s) =>
      tr("copilot.stockout.item", {
        label: s.label,
        clock: s.clock,
        items: s.impactedSkus.map((x) => x.name).join(", "),
      }),
    )
    .join("\n");
  return {
    id: rid(),
    role: "copilot",
    text: tr("copilot.stockout.body", { list: listText }),
    confidence: 0.83,
    intent: "stockout_time",
    cards: list.map((s) => ({
      kind: "stockout" as const,
      label: s.label,
      clock: s.clock,
      severity: s.severity,
    })),
    suggested: [tr("copilot.sugg.order_stock"), tr("copilot.sugg.prep_more")],
  };
}

function h_compareLastWeek(ctx: CopilotContext): CopilotMessage {
  const f = forecastDay({
    history: ctx.history,
    date: ctx.targetDate,
    whatIf: ctx.whatIf,
  });
  const lastWeek = ctx.history.days.find(
    (d) => d.date.getTime() === addDays(ctx.targetDate, -7).getTime(),
  );
  if (!lastWeek) {
    return {
      id: rid(),
      role: "copilot",
      text: tr("copilot.compare.none"),
      confidence: 0.5,
      intent: "compare_last_week",
    };
  }
  const orderDelta = (f.p50 - lastWeek.orders.length) / Math.max(1, lastWeek.orders.length);
  const revDelta = (f.revenue - lastWeek.revenue) / Math.max(1, lastWeek.revenue);
  const day = longWeekday(ctx.targetDate);
  return {
    id: rid(),
    role: "copilot",
    text: tr("copilot.compare.body", {
      day,
      date: shortDate(lastWeek.date),
      orders: Math.round(f.p50),
      lastOrders: lastWeek.orders.length,
      ordersDelta: pct(orderDelta, 1),
      rev: formatGBP(f.revenue),
      lastRev: formatGBP(lastWeek.revenue),
      revDelta: pct(revDelta, 1),
      peak: Math.round(lastWeek.orders.length * 0.18),
    }),
    confidence: 0.88,
    intent: "compare_last_week",
    suggested: [tr("copilot.sugg.why_shift"), tr("copilot.sugg.accuracy_history")],
  };
}

function h_todaysPlan(ctx: CopilotContext): CopilotMessage {
  const bundle = buildRecommendations(ctx.history, ctx.targetDate, ctx.whatIf);
  const top = bundle.recs.slice(0, 3);
  const list = top
    .map((r, i) => `${i + 1}. **${r.title}** — ${r.whyItMatters}`)
    .join("\n");
  return {
    id: rid(),
    role: "copilot",
    text: tr("copilot.today.body", {
      orders: Math.round(bundle.forecast.p50),
      rev: formatGBP(bundle.forecast.revenue),
      list,
    }),
    confidence: 0.85,
    intent: "todays_plan",
    cards: top.map((r) => ({
      kind: "recommendation" as const,
      id: r.id,
      title: r.title,
      severity: r.severity,
    })),
    citations: [{ label: tr("copilot.citation.full_plan"), href: "/today" }],
  };
}

function h_prepQuantity(ctx: CopilotContext): CopilotMessage {
  const f = forecastDay({
    history: ctx.history,
    date: ctx.targetDate,
    whatIf: ctx.whatIf,
  });
  const prep = buildPrepPlan(f);
  if (!prep.length) {
    return {
      id: rid(),
      role: "copilot",
      text: tr("copilot.prep_qty.none"),
      confidence: 0.85,
      intent: "prep_quantity",
    };
  }
  const list = prep
    .map((t) =>
      tr("copilot.prep_qty.row", {
        qty: t.qty,
        unit: t.unit,
        label: t.label,
        doBy: t.doBy,
        reason: t.reason,
      }),
    )
    .join("\n");
  return {
    id: rid(),
    role: "copilot",
    text: tr("copilot.prep_qty.body", {
      orders: Math.round(f.p50),
      list,
    }),
    confidence: 0.88,
    intent: "prep_quantity",
    suggested: [tr("copilot.sugg.whatif_prep"), tr("copilot.sugg.staff_enough")],
  };
}

function h_revenueForecast(ctx: CopilotContext): CopilotMessage {
  const f = forecastDay({
    history: ctx.history,
    date: ctx.targetDate,
    whatIf: ctx.whatIf,
  });
  return {
    id: rid(),
    role: "copilot",
    text: tr("copilot.revenue.body", {
      rev: formatGBP(f.revenue),
      orders: Math.round(f.p50),
      low: formatGBP(f.revenue * (f.p10 / f.p50)),
      high: formatGBP(f.revenue * (f.p90 / f.p50)),
    }),
    confidence: 0.84,
    intent: "revenue_forecast",
  };
}

function h_confidence(_ctx: CopilotContext): CopilotMessage {
  return {
    id: rid(),
    role: "copilot",
    text: tr("copilot.confidence.body"),
    confidence: 0.95,
    intent: "confidence",
    citations: [{ label: tr("copilot.citation.accuracy"), href: "/accuracy" }],
  };
}

function h_fallback(_ctx: CopilotContext): CopilotMessage {
  return {
    id: rid(),
    role: "copilot",
    text: translate("copilot.fallback"),
    confidence: 0.5,
    intent: "fallback",
    suggested: defaultSuggestions(),
  };
}

// ---------- public api ----------

export function initialCopilotMessages(ctx: CopilotContext): CopilotMessage[] {
  const f = forecastDay({
    history: ctx.history,
    date: ctx.targetDate,
    whatIf: ctx.whatIf,
  });
  const bundle = buildRecommendations(ctx.history, ctx.targetDate, ctx.whatIf);
  const day = longWeekday(ctx.targetDate);
  return [
    {
      id: "m_greeting",
      role: "copilot",
      text: tr("copilot.greeting", {
        day,
        date: shortDate(ctx.targetDate),
        orders: Math.round(f.p50),
        revenue: formatGBP(f.revenue),
        p10: Math.round(f.p10),
        p90: Math.round(f.p90),
        n: Math.min(3, bundle.recs.length),
      }),
      confidence: 0.85,
      suggested: defaultSuggestions(),
      citations: [{ label: tr("copilot.citation.open_today"), href: "/today" }],
    },
  ];
}

export function answer(text: string, ctx: CopilotContext): CopilotMessage {
  const intent = matchIntent(text);
  switch (intent) {
    case "why_demand":
      return h_whyDemand(ctx);
    case "whatif_prep":
      return h_whatifPrep(text, ctx);
    case "whatif_promo":
      return h_whatifPromo(ctx);
    case "whatif_rain":
      return h_whatifRain(ctx);
    case "biggest_risk":
      return h_biggestRisk(ctx);
    case "stockout_time":
      return h_stockoutTime(text, ctx);
    case "compare_last_week":
      return h_compareLastWeek(ctx);
    case "todays_plan":
      return h_todaysPlan(ctx);
    case "prep_quantity":
      return h_prepQuantity(ctx);
    case "revenue_forecast":
      return h_revenueForecast(ctx);
    case "confidence":
      return h_confidence(ctx);
    default:
      return h_fallback(ctx);
  }
}

export function defaultSuggestionsFor(): string[] {
  return defaultSuggestions();
}

export const SUGGESTIONS_DEFAULT = defaultSuggestions();
