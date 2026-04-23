# Pizza Hut UK · Smart Planning Copilot

> *"We're not building a dashboard — we're building a system that turns data
> into **timely, confident decisions**, enabling managers to operate proactively
> instead of reactively."*

A demo web app that turns 4 weeks of mocked Pizza Hut UK order data into
**predictive insights → explainable recommendations → executable plans**, with
a **conversational Copilot** on top. Built for the *Hackathon Team 6 — Store
Operations Command Center for Store Managers* PRD.

Version history:

- **v1.0-demo** (`git tag v1.0-demo`) — the original 7-page Store Operations
  Command Center.
- **v2.0-copilot** (this version) — adds the two PDF demo use cases:
  **UC1 "Today's Plan"** (single-screen manager view with top-3 actions and
  hour-by-hour stockout risks) and **UC2 What-if Simulation** as a natural-language
  **Smart Planning Copilot** chat.

---

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Zustand,
lucide-react.

---

## What the demo shows

Nine manager pages, all powered by the same in-browser, deterministic engines
— no backend required.

| # | Page | What it does |
|---|---|---|
| ★ | **Today's Plan** (`/today`) | **UC1.** Single-screen manager view: big headline ("Demand +30% vs typical Friday"), **top-3 action cards** with qty/%/owner/deadline, **hour-by-hour stockout timeline** with specific clock times ("Mozzarella runs out at 12:45 PM"), before/after story, 5-step guided demo banner. |
| ★ | **Copilot** (`/copilot`) | **UC2.** Conversational Smart Planning Copilot. Ask *"What if I reduce prep by 20%?"*, *"Why is demand higher?"*, *"When will we run out of dough?"*. Every answer cites drivers + confidence, shows inline action cards, and leaves the manager in control. |
| 1 | **Store Health** (`/`) | Today's KPIs (sales, orders, labour, availability, ticket time), top 3 risks for tomorrow, hourly orders chart, daily briefing. |
| 2 | **Predictions** (`/predictions`) | 7-/14-day demand forecast with P10–P90 confidence band, top SKUs, tomorrow's prep plan, recommended supplier order with quantities, packs, cost and cutoff. |
| 3 | **Recommendations** (`/recommendations`) | Explainable cards: *why it matters → drivers → executable plan steps with owner, time, qty → expected impact → confidence*. One-click "Assign as task". |
| 4 | **What-if Planner** (`/what-if`) | Sliders for weather, local event, promo uplift, marketing push, price. Live re-forecast and re-derived inventory plan. Save/load named scenarios. |
| 5 | **Accuracy (WoW)** (`/accuracy`) | Walk-forward back-test of predicted vs actual, MAPE, bias, P10–P90 hit rate, this-week vs last-week bar chart. |
| 6 | **Tasks** (`/tasks`) | Created from recommendations, assignable, status (new/in-progress/blocked/done/verified). Persisted in `localStorage`. |
| 7 | **Alerts** (`/alerts`) | Prioritised feed across the next 72h with severity, freshness, confidence. |

### How v2 maps to the demo PDF

| PDF moment | Where to show it |
|---|---|
| "Demand will increase by 30% today" | Today's Plan hero headline |
| "Prepare 120 units of Item A (+25%)" | Today's Plan top-3 action cards (numbered 1/2/3) |
| "Risk: Ingredient shortage at 1 PM" | Today's Plan stockout timeline + red-bordered risk list |
| Manager: *"Why?"* | Copilot prompt → grounded answer citing last 3 weekdays + active promo |
| Manager: *"What if I don't increase prep?"* | Copilot prompt → "You run out of mozzarella at 12:50 PM" |
| Step-by-step demo story | Guided 5-step banner at top of Today's Plan |

---

## Mock data model

Generator: `lib/mock/orders.ts`. Seeded `mulberry32` PRNG so the demo is
reproducible.

- **4 weeks** of order history, **100–200 orders / day** (clamped), with
  - Hourly profile peaking at 12–14h and 18–21h
  - Weekday multipliers (Sat 1.65, Fri 1.35, Tue 1.05 with promo, etc.)
  - Weekend "Family Weekend Deal" + "2 for Tuesday" promotions, which boost
    Pepperoni Feast and Meat Feast share
  - Channel mix: 55% delivery, 30% collection, 15% dine-in
- **Menu** (`lib/mock/menu.ts`) — 22 items inspired by [pizzahut.co.uk](https://www.pizzahut.co.uk/) (pizzas, sides, drinks, desserts) with a per-item ingredient bill of materials.
- **Inventory** (`lib/mock/inventory.ts`) — on-hand, par, shelf life, supplier lead time, cutoff hour, pack size, unit cost.
- **Labor** (`lib/mock/labor.ts`) — shift plan and per-hour throughput per role (make-line, oven, driver, front).

## Forecast engine

`lib/forecast/engine.ts`. Transparent, no heavy ML — explainability matters
more than accuracy here.

```
p50  =  same-weekday-trimmed-mean
       × natural promo multiplier (Tue / Fri / Sat / Sun)
       × what-if (weather × event × marketing × price-elasticity × user-promo)
P10/P90  =  p50 ± 1.28σ  (σ ≈ 10% of p50)
```

Per-SKU mix comes from the historical share for that weekday, perturbed by
each item's `promoBoost` weight.

## Recommendations

`lib/forecast/recommendations.ts` produces seven categories of recommendation —
**Inventory**, **Prep**, **Labor**, **Capacity**, **Promo**, **Service**,
**Waste** — each as:

```ts
{
  severity, category, title,
  whyItMatters,                                  // human prose
  drivers: ["Weekend Family Deal", "+18% WoW"], // attributable factors
  steps: [{ at: "16:00", do: "Order 12 packs mozzarella", owner: "Manager", qty }],
  expectedImpact: "Prevents stockout of mozzarella …",
  confidence: 0.92,
  freshnessMins: 5,
}
```

## Theme

Pizza Hut UK colours from [pizzahut.co.uk](https://www.pizzahut.co.uk/):

- Primary red `#EE3124`
- Yellow accent `#FFCE00`
- Black `#0F0F10`
- Surface `#F7F5F2`
- Open Sans display font

Centralised in `tailwind.config.ts`, `app/globals.css` and
`lib/theme/tokens.ts`. Custom branded mark in `components/Brand.tsx`.

---

## 90-second demo script

1. **Home** — point out KPIs with freshness badges and the *Top 3 risks for
   tomorrow*. The Saturday Family Weekend Deal triggers a Pepperoni / Meat
   Feast uplift.
2. Open the top inventory recommendation. Show **why it matters → drivers →
   the executable plan** (specific quantities, owners and times).
3. Click **"Assign as task"** → flip to **/tasks** to show the audit trail.
4. **/predictions** — show the 7-day forecast chart with P10–P90 band and the
   recommended supplier order broken down by ingredient, packs, cost and
   cutoff.
5. **/what-if** — set Weather: *Rainy*, Event: *Football match*, Promo uplift
   +20%. Watch the chart and the supplier order recompute live. Save the
   scenario as "Sat + match".
6. **/accuracy** — show MAPE, bias, hit rate and the predicted-vs-actual chart
   to build trust in the recommendations.

---

## Suggested enhancements (post-MVP)

- **Real weather & local-event feed** auto-shifting forecasts and surfacing
  *why demand changed*.
- **Food-waste tracker** — compare prepped vs sold per SKU.
- **Driver / delivery ETA optimiser** — re-route when queue depth spikes.
- **Staff wellbeing signal** — consecutive shifts, break compliance.
- **Gamified task completion** — streaks for shift leads, district leaderboard.
- **Natural-language "Ask the store"** — LLM-powered explanation of any KPI.
- **Voice-activated quick actions** for peak hours.
- **Cross-store benchmarking** — percentile vs similar-format stores.
- **Auto-generated end-of-day briefing** (PDF).
- **Shrink / void anomaly** module on POS exception stream.
- **Energy optimiser** — pre-heat oven on forecast, not on a fixed clock.
- **Confidence-gated automation** — auto-create supplier orders above 90%
  confidence.

---

## File map

```
app/
  layout.tsx · globals.css · page.tsx          // shell + Store Health
  predictions/page.tsx · recommendations/page.tsx
  what-if/page.tsx · accuracy/page.tsx
  tasks/page.tsx · alerts/page.tsx
components/
  Shell · TopBar · SideNav · Brand
  KPICard · RecommendationCard · ForecastChart
  AccuracyChart · InventoryTable · WhatIfPanel
  TaskList · FreshnessBadge · SeverityChip
lib/
  mock/{rng,menu,orders,inventory,labor}.ts
  forecast/{engine,inventory,recommendations,accuracy}.ts
  state/store.ts            // Zustand + localStorage persistence
  data/useHistory.ts        // memoised generator
  theme/tokens.ts · utils.ts
```
