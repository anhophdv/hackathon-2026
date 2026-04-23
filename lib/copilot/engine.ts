// Deterministic Copilot answer engine.
// Matches store manager questions against intents, then produces grounded
// responses from the same forecast / recommendation / timeline engines that
// power the rest of the app. The manager stays in control — every answer cites
// drivers, confidence, and a suggested next action.
//
// In production this layer is where an LLM would generate the narrative, but
// the underlying decisions would still be deterministic (as the Q&A says:
// "deterministic core + LLM for interaction & explanation").

import { GeneratedHistory, promoForDate } from "../mock/orders";
import { addDays, formatGBP, formatNumber, ddmm } from "../utils";
import { forecastDay, WhatIf, DEFAULT_WHATIF } from "../forecast/engine";
import { buildTimeline } from "../forecast/timeline";
import { buildRecommendations } from "../forecast/recommendations";
import { buildIngredientPlan, buildPrepPlan } from "../forecast/inventory";

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
  text: string; // markdown-lite (bold with **)
  confidence?: number; // 0..1
  citations?: CopilotCitation[];
  cards?: CopilotCard[];
  suggested?: string[]; // follow-up prompts
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

export type CopilotContext = {
  history: GeneratedHistory;
  targetDate: Date; // usually "today" (last day of generated history)
  whatIf: WhatIf;
};

const SUGGESTIONS_DEFAULT = [
  "What's my biggest risk today?",
  "Why is demand higher than usual?",
  "What if I reduce prep by 20%?",
  "When will we run out of dough?",
  "Compare to last Friday",
];

// ---------- intent handlers ----------

function h_whyDemand(ctx: CopilotContext): CopilotMessage {
  const f = forecastDay({ history: ctx.history, date: ctx.targetDate, whatIf: ctx.whatIf });
  const lastWeek = ctx.history.days.find(
    (d) => d.date.getTime() === addDays(ctx.targetDate, -7).getTime(),
  );
  const lastWeekOrders = lastWeek?.orders.length ?? f.baseline;
  const delta = (f.p50 - lastWeekOrders) / Math.max(1, lastWeekOrders);
  const promo = promoForDate(ctx.targetDate);
  const weekday = ctx.targetDate.toLocaleDateString("en-GB", { weekday: "long" });
  const topDrivers = f.drivers.filter((d) => d.delta !== 0);

  const parts: string[] = [];
  parts.push(
    `Today is **${weekday}**. I'm forecasting **${Math.round(f.p50)} orders** ` +
    `(${Math.round(f.p10)}–${Math.round(f.p90)} range), which is **${pct(delta, 1)} vs last ${weekday}** ` +
    `(${lastWeekOrders} orders).`,
  );
  parts.push("");
  parts.push("**Why the shift?** Based on last 3 ${weekday}s + active signals:".replace("${weekday}", weekday));
  for (const d of topDrivers) {
    parts.push(`- ${d.label} → ${pct(d.delta, 1)}`);
  }
  if (!topDrivers.length) {
    parts.push("- Natural weekday pattern only — no active promos, weather or events are shifting demand.");
  }
  if (promo.active) {
    parts.push("");
    parts.push(
      `**Promo in play:** *${promo.name}* historically boosts Pepperoni Feast and Meat Feast share by ~15%.`,
    );
  }

  return {
    id: "m_" + Math.random().toString(36).slice(2, 9),
    role: "copilot",
    text: parts.join("\n"),
    confidence: 0.86,
    citations: [
      { label: `Same-weekday baseline (${f.baseline.toFixed(0)} orders)` },
      { label: `Last ${weekday} actual (${lastWeekOrders} orders)` },
    ],
    intent: "why_demand",
    suggested: [
      "What should I prepare?",
      "When will we run out of mozzarella?",
      "What if it rains?",
    ],
  };
}

function h_whatifPrep(userText: string, ctx: CopilotContext): CopilotMessage {
  const m = userText.match(/-?\s?(\d{1,3})\s?%/);
  const raw = m ? parseInt(m[1], 10) : 20;
  const reduction = Math.min(60, Math.max(5, Math.abs(raw))) / 100;

  const f = forecastDay({ history: ctx.history, date: ctx.targetDate, whatIf: ctx.whatIf });
  const normalTimeline = buildTimeline({ forecast: f });
  // Simulate: prep cut => 1-reduction of normal prep delivered
  const prepPlan = buildPrepPlan(f);
  const reducedOnHand: Record<string, number> = {};
  // approximate effect: the prep cut removes (reduction * dailyNeed) from dough stocks
  const cutTimeline = buildTimeline({
    forecast: f,
    onHand: prepPlan.reduce((acc, t) => {
      // Treat prep as adding to onHand for the critical fresh items
      // Only dough/cheese/wings — the cut lowers the expected prep
      if (t.id.startsWith("prep_dough_l")) {
        acc["dough_large"] = -Math.round((f.perSku["pz_pepperoni_l"] ?? 0) * reduction);
      }
      if (t.id.startsWith("prep_dough_m")) {
        acc["dough_medium"] = -Math.round((f.perSku["pz_create_m"] ?? 0) * reduction);
      }
      return acc;
    }, reducedOnHand),
  });

  // Find the earliest NEW stockout introduced by the cut
  const baseIds = new Set(normalTimeline.stockouts.map((s) => s.id));
  const extras = cutTimeline.stockouts.filter((s) => !baseIds.has(s.id));
  const earliest = (extras[0] ?? cutTimeline.stockouts[0]) ?? null;

  const parts: string[] = [];
  parts.push(`**Simulating: cut prep by ${Math.round(reduction * 100)}%**`);
  parts.push("");
  if (earliest) {
    parts.push(
      `- **Stockout risk:** you will run out of **${earliest.label}** at approximately **${earliest.clock}**.`,
    );
    parts.push(
      `- Impacted items: ${earliest.impactedSkus.map((s) => s.name).join(", ")}.`,
    );
  } else {
    parts.push(`- No new stockouts — you have slack on today's forecast.`);
  }
  parts.push(
    `- Estimated **service delay +${Math.round(reduction * 70)}%** during the peak window — ticket time could breach 15 min.`,
  );
  parts.push(
    `- Revenue at risk: **${formatGBP(f.revenue * reduction * 0.28)}** if stockouts force item swaps or cancellations.`,
  );
  parts.push("");
  parts.push(
    `**Recommendation:** hold today's prep at the forecast level. If you want to save labour, defer the cut to the **${ctx.targetDate.getDay() === 5 ? "Tuesday" : "next weekday"}** low window instead.`,
  );

  return {
    id: "m_" + Math.random().toString(36).slice(2, 9),
    role: "copilot",
    text: parts.join("\n"),
    confidence: 0.79,
    intent: "whatif_prep",
    cards: earliest
      ? [{ kind: "stockout", label: earliest.label, clock: earliest.clock, severity: "high" }]
      : [],
    citations: [{ label: "Forecast + BOM consumption", href: "/predictions" }],
    suggested: [
      "What if it rains tonight?",
      "Show me the full prep plan",
      "What's my biggest risk today?",
    ],
  };
}

function h_whatifPromo(ctx: CopilotContext): CopilotMessage {
  const base = forecastDay({ history: ctx.history, date: ctx.targetDate, whatIf: DEFAULT_WHATIF });
  const boosted = forecastDay({
    history: ctx.history,
    date: ctx.targetDate,
    whatIf: { ...ctx.whatIf, promoUpliftPct: 20 },
  });
  const uplift = (boosted.p50 - base.p50) / base.p50;
  const revUp = boosted.revenue - base.revenue;

  return {
    id: "m_" + Math.random().toString(36).slice(2, 9),
    role: "copilot",
    text:
      `**Simulating: +20% promo push**\n\n` +
      `- Orders rise to **${Math.round(boosted.p50)}** (${pct(uplift, 1)} vs baseline).\n` +
      `- Revenue **+${formatGBP(revUp)}**, mostly on Pepperoni Feast & Meat Feast.\n` +
      `- Additional prep: **+${Math.round((boosted.perSku["pz_pepperoni_l"] ?? 0) - (base.perSku["pz_pepperoni_l"] ?? 0))} large pepperoni pizzas** worth of dough + mozzarella.\n` +
      `- Risk: you'd tighten mozzarella cover — recommend an **extra 2 packs (2 kg)** from the depot before 16:00 cutoff.`,
    confidence: 0.81,
    intent: "whatif_promo",
    suggested: ["Do I have enough drivers?", "Show me the top 3 actions"],
  };
}

function h_whatifRain(ctx: CopilotContext): CopilotMessage {
  const base = forecastDay({ history: ctx.history, date: ctx.targetDate, whatIf: DEFAULT_WHATIF });
  const rainy = forecastDay({
    history: ctx.history,
    date: ctx.targetDate,
    whatIf: { ...ctx.whatIf, weather: "rainy" },
  });
  const delta = (rainy.p50 - base.p50) / base.p50;
  return {
    id: "m_" + Math.random().toString(36).slice(2, 9),
    role: "copilot",
    text:
      `**Simulating: rainy evening**\n\n` +
      `- Delivery share jumps (people stay in). Forecast rises to **${Math.round(rainy.p50)} orders** (${pct(delta, 1)}).\n` +
      `- Biggest lever is **driver capacity** — call in 1 extra driver for 18:00-21:30.\n` +
      `- Dine-in cover can drop by 1 — redeploy to the make line.\n` +
      `- Expect wait-time complaints above 30 min if no action is taken.`,
    confidence: 0.77,
    intent: "whatif_rain",
  };
}

function h_biggestRisk(ctx: CopilotContext): CopilotMessage {
  const bundle = buildRecommendations(ctx.history, ctx.targetDate, ctx.whatIf);
  const top = bundle.recs[0];
  if (!top) {
    return {
      id: "m_" + Math.random().toString(36).slice(2, 9),
      role: "copilot",
      text: "No significant risks for today. The plan is on track — focus on the routine checklist.",
      confidence: 0.9,
      intent: "biggest_risk",
    };
  }
  return {
    id: "m_" + Math.random().toString(36).slice(2, 9),
    role: "copilot",
    text:
      `**Your biggest risk:** ${top.title}\n\n` +
      `**Why it matters:** ${top.whyItMatters}\n\n` +
      `**Driver${top.drivers.length > 1 ? "s" : ""}:**\n` +
      top.drivers.slice(0, 3).map((d) => `- ${d}`).join("\n") +
      `\n\n**What I'd do:**\n` +
      top.steps.map((s) => `- **${s.at}** ${s.do}${s.qty ? ` (${s.qty} ${s.unit ?? ""})` : ""} — ${s.owner ?? ""}`).join("\n") +
      `\n\n**Expected impact:** ${top.expectedImpact}.`,
    confidence: top.confidence,
    intent: "biggest_risk",
    cards: [{ kind: "recommendation", id: top.id, title: top.title, severity: top.severity }],
    citations: [
      { label: `${bundle.recs.length} recommendations`, href: "/recommendations" },
    ],
    suggested: ["What if I skip this action?", "Show me the top 3 actions"],
  };
}

function h_stockoutTime(userText: string, ctx: CopilotContext): CopilotMessage {
  const f = forecastDay({ history: ctx.history, date: ctx.targetDate, whatIf: ctx.whatIf });
  const tl = buildTimeline({ forecast: f });
  // Try to match a specific ingredient in the text
  const q = userText.toLowerCase();
  const matches = tl.stockouts.filter((s) => q.includes(s.label.toLowerCase().split(" ")[0]));
  const list = matches.length ? matches : tl.stockouts.slice(0, 3);
  if (!list.length) {
    return {
      id: "m_" + Math.random().toString(36).slice(2, 9),
      role: "copilot",
      text:
        "Good news — no ingredients are projected to run out today on current on-hand. " +
        "I'll alert you the moment any hourly burn exceeds cover.",
      confidence: 0.88,
      intent: "stockout_time",
    };
  }
  return {
    id: "m_" + Math.random().toString(36).slice(2, 9),
    role: "copilot",
    text:
      `At current prep + on-hand, projected stockouts for today:\n\n` +
      list.map((s) =>
        `- **${s.label}** around **${s.clock}** — impacts ${s.impactedSkus.map((x) => x.name).join(", ")}.`,
      ).join("\n") +
      `\n\nOrdering from the depot now (before 16:00 cutoff) prevents all of the above.`,
    confidence: 0.83,
    intent: "stockout_time",
    cards: list.map((s) => ({
      kind: "stockout" as const,
      label: s.label,
      clock: s.clock,
      severity: s.severity,
    })),
    suggested: ["Order the missing stock now", "What if I prep more dough?"],
  };
}

function h_compareLastWeek(ctx: CopilotContext): CopilotMessage {
  const f = forecastDay({ history: ctx.history, date: ctx.targetDate, whatIf: ctx.whatIf });
  const lastWeek = ctx.history.days.find(
    (d) => d.date.getTime() === addDays(ctx.targetDate, -7).getTime(),
  );
  if (!lastWeek) {
    return {
      id: "m_" + Math.random().toString(36).slice(2, 9),
      role: "copilot",
      text: "I don't have last-week data to compare.",
      confidence: 0.5,
      intent: "compare_last_week",
    };
  }
  const orderDelta = (f.p50 - lastWeek.orders.length) / Math.max(1, lastWeek.orders.length);
  const revDelta = (f.revenue - lastWeek.revenue) / Math.max(1, lastWeek.revenue);
  const day = ctx.targetDate.toLocaleDateString("en-GB", { weekday: "long" });
  return {
    id: "m_" + Math.random().toString(36).slice(2, 9),
    role: "copilot",
    text:
      `**vs last ${day} (${ddmm(lastWeek.date)}):**\n\n` +
      `- Orders: **${Math.round(f.p50)}** (forecast) vs **${lastWeek.orders.length}** (actual) — ${pct(orderDelta, 1)}.\n` +
      `- Revenue: **${formatGBP(f.revenue)}** vs **${formatGBP(lastWeek.revenue)}** — ${pct(revDelta, 1)}.\n` +
      `- Last ${day}'s peak hour saw ~${Math.round(lastWeek.orders.length * 0.18)} orders in the 7 PM slot. Today's plan has more cover in that window.`,
    confidence: 0.88,
    intent: "compare_last_week",
    suggested: ["Why the shift?", "Show me the accuracy history"],
  };
}

function h_todaysPlan(ctx: CopilotContext): CopilotMessage {
  const bundle = buildRecommendations(ctx.history, ctx.targetDate, ctx.whatIf);
  const top = bundle.recs.slice(0, 3);
  return {
    id: "m_" + Math.random().toString(36).slice(2, 9),
    role: "copilot",
    text:
      `Here's your **top 3 actions for today** (forecast ${Math.round(bundle.forecast.p50)} orders, ` +
      `${formatGBP(bundle.forecast.revenue)} revenue):\n\n` +
      top.map((r, i) => `${i + 1}. **${r.title}** — ${r.whyItMatters}`).join("\n") +
      `\n\nEvery recommendation has a "why" and an executable plan. Open the Today's Plan page to assign them.`,
    confidence: 0.85,
    intent: "todays_plan",
    cards: top.map((r) => ({ kind: "recommendation" as const, id: r.id, title: r.title, severity: r.severity })),
    citations: [{ label: "Full plan", href: "/today" }],
  };
}

function h_prepQuantity(ctx: CopilotContext): CopilotMessage {
  const f = forecastDay({ history: ctx.history, date: ctx.targetDate, whatIf: ctx.whatIf });
  const prep = buildPrepPlan(f);
  if (!prep.length) {
    return {
      id: "m_" + Math.random().toString(36).slice(2, 9),
      role: "copilot",
      text: "No pre-prep batches are needed beyond the standing routine.",
      confidence: 0.85,
      intent: "prep_quantity",
    };
  }
  return {
    id: "m_" + Math.random().toString(36).slice(2, 9),
    role: "copilot",
    text:
      `**Today's prep quantities** (driven by forecast ${Math.round(f.p50)} orders):\n\n` +
      prep.map((t) => `- **${t.qty} ${t.unit}** of ${t.label} — ${t.doBy}. _Why:_ ${t.reason}`).join("\n"),
    confidence: 0.88,
    intent: "prep_quantity",
    suggested: ["What if I reduce prep by 20%?", "Do I have enough staff?"],
  };
}

function h_revenueForecast(ctx: CopilotContext): CopilotMessage {
  const f = forecastDay({ history: ctx.history, date: ctx.targetDate, whatIf: ctx.whatIf });
  return {
    id: "m_" + Math.random().toString(36).slice(2, 9),
    role: "copilot",
    text:
      `Today's revenue forecast: **${formatGBP(f.revenue)}** on ~**${Math.round(f.p50)} orders**. ` +
      `Range: ${formatGBP(f.revenue * (f.p10 / f.p50))} – ${formatGBP(f.revenue * (f.p90 / f.p50))} (P10-P90).`,
    confidence: 0.84,
    intent: "revenue_forecast",
  };
}

function h_confidence(ctx: CopilotContext): CopilotMessage {
  return {
    id: "m_" + Math.random().toString(36).slice(2, 9),
    role: "copilot",
    text:
      `I optimise for **better decisions under uncertainty, not perfect prediction.**\n\n` +
      `- Every forecast has a P10–P90 range.\n` +
      `- Every recommendation has a confidence score (60-95% typical).\n` +
      `- If confidence is low, I surface the risk instead of auto-actioning.\n` +
      `- Our last 21 days hit the P10–P90 band on ~72% of days, MAPE ~11%.\n\n` +
      `You stay in control — I augment, I don't replace.`,
    confidence: 0.95,
    intent: "confidence",
    citations: [{ label: "See accuracy history", href: "/accuracy" }],
  };
}

function h_fallback(ctx: CopilotContext): CopilotMessage {
  return {
    id: "m_" + Math.random().toString(36).slice(2, 9),
    role: "copilot",
    text:
      "I can help with planning, risks and what-if questions. Try one of the suggested prompts below, " +
      "or ask me things like *'What's my biggest risk today?'* or *'What if I reduce prep by 20%?'*",
    confidence: 0.5,
    intent: "fallback",
    suggested: SUGGESTIONS_DEFAULT,
  };
}

// ---------- public api ----------

export function initialCopilotMessages(ctx: CopilotContext): CopilotMessage[] {
  const f = forecastDay({ history: ctx.history, date: ctx.targetDate, whatIf: ctx.whatIf });
  const bundle = buildRecommendations(ctx.history, ctx.targetDate, ctx.whatIf);
  const day = ctx.targetDate.toLocaleDateString("en-GB", { weekday: "long" });
  return [
    {
      id: "m_greeting",
      role: "copilot",
      text:
        `Hi Mike — I'm your **Smart Planning Copilot**.\n\n` +
        `For **${day}, ${ddmm(ctx.targetDate)}** I'm forecasting **${Math.round(f.p50)} orders** ` +
        `(${formatGBP(f.revenue)} revenue, P10–P90 ${Math.round(f.p10)}–${Math.round(f.p90)}). ` +
        `I've prioritised **${Math.min(3, bundle.recs.length)} actions** with the biggest impact.`,
      confidence: 0.85,
      suggested: SUGGESTIONS_DEFAULT,
      citations: [{ label: "Open Today's Plan", href: "/today" }],
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

export { SUGGESTIONS_DEFAULT };
