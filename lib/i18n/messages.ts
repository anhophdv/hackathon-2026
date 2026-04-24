// Static message dictionary for the UI. Keys are dot-separated for readability.
// Values may contain {var} placeholders interpolated by useT().
// Dynamic, engine-generated strings (Byte responses, Recommendation titles,
// drivers, etc.) pull from this same dictionary — see lib/copilot and
// lib/forecast/recommendations.

export type Messages = Record<string, string>;

const en: Messages = {
  // ---------- Chrome ----------
  "brand.name": "Byte by Yum!",
  "brand.subtitle": "Pizza Hut UK · from data to timely, confident decisions",
  "brand.version": "v2",
  "topbar.search": "Search SKU, alert, task…",
  "topbar.user": "Mike — Manager",
  "topbar.tasks_open": "Open tasks",

  "sidenav.copilot_section": "Daily Ops",
  "sidenav.explore_section": "Explore",
  "sidenav.today": "Today's Plan",
  "sidenav.copilot": "Ask Byte",
  "sidenav.home": "Store Health",
  "sidenav.predictions": "Predictions",
  "sidenav.recommendations": "Recommendations",
  "sidenav.whatif": "What-if Planner",
  "sidenav.accuracy": "Accuracy (WoW)",
  "sidenav.tasks": "Tasks",
  "sidenav.alerts": "Alerts",
  "sidenav.store_label": "Store #4187 · Manchester Piccadilly",

  // ---------- Generic ----------
  "common.open": "Open",
  "common.close": "Close",
  "common.next": "Next",
  "common.back": "Back",
  "common.finish": "Finish",
  "common.all": "All",
  "common.loading": "Loading…",
  "common.no_data": "No data",
  "common.send": "Send",
  "common.save": "Save",
  "common.reset": "Reset",
  "common.remove": "Remove",
  "common.confidence": "Confidence",
  "common.min_ago": "{n} min ago",
  "common.min_short": "{n} min",
  "common.owner": "Owner",
  "common.by_time": "By {time}",
  "common.updated_n_min_ago": "Updated {n} min ago",
  "common.forecast_refreshed_n_min_ago": "Forecast refreshed {n} min ago",

  "severity.high": "High",
  "severity.med": "Medium",
  "severity.low": "Low",

  // ---------- Category labels ----------
  "category.Inventory": "Inventory",
  "category.Prep": "Prep",
  "category.Labor": "Labour",
  "category.Capacity": "Capacity",
  "category.Promo": "Promo",
  "category.Service": "Service",
  "category.Waste": "Waste",

  // ---------- Owners ----------
  "owner.Manager": "Manager",
  "owner.Shift Lead": "Shift Lead",
  "owner.Kitchen": "Kitchen",
  "owner.Front": "Front",
  "owner.Driver": "Driver",

  // ---------- Weekdays (long) used in generated text ----------
  "weekday.0": "Sunday",
  "weekday.1": "Monday",
  "weekday.2": "Tuesday",
  "weekday.3": "Wednesday",
  "weekday.4": "Thursday",
  "weekday.5": "Friday",
  "weekday.6": "Saturday",
  "weekday.short.0": "Sun",
  "weekday.short.1": "Mon",
  "weekday.short.2": "Tue",
  "weekday.short.3": "Wed",
  "weekday.short.4": "Thu",
  "weekday.short.5": "Fri",
  "weekday.short.6": "Sat",

  // ---------- Page headers ----------
  "page.home.title": "Store Health",
  "page.home.subtitle":
    "One operational view of today's performance and tomorrow's risks. All KPIs are time-stamped; act on what matters most, in the time you have.",
  "page.home.cta_today": "Today's Plan",
  "page.home.cta_copilot": "Ask Byte",

  "page.today.title": "Today's Plan · {weekday}",
  "page.today.subtitle":
    "Your single source of truth for the shift. Top 3 actions, specific-time risks, and a one-tap assign to the team.",
  "page.today.ask_copilot": "Ask Byte",
  "page.today.hero_label": "Today's forecast",
  "page.today.hero_headline":
    "Demand {pct} vs typical {weekday}",
  "page.today.hero_sub":
    "{orders} orders forecast · {revenue} revenue · confidence {band}",
  "page.today.stat_orders": "Orders (P50)",
  "page.today.stat_orders_sub": "{low}–{high} range",
  "page.today.stat_risks": "Risks at peak",
  "page.today.stat_risks_sub": "ingredient stockouts",
  "page.today.stat_tasks": "Tasks assigned",
  "page.today.stat_tasks_sub": "{remaining} of top 3 to go",
  "page.today.top3_title": "Top 3 actions for today",
  "page.today.top3_caption":
    "Each card shows what to do, why to do it, and the expected impact — no clicking to understand.",
  "page.today.before_after_title": "Before vs after",
  "page.today.before": "Before",
  "page.today.after": "After",
  "page.today.before_line1": "Guessing prep levels",
  "page.today.before_line2": "Firefighting at peak",
  "page.today.before_line3": "Stockouts @ lunch",
  "page.today.before_line4": "Late deliveries",
  "page.today.after_line1": "Forecast + drivers",
  "page.today.after_line2": "Top 3, assigned in 2 taps",
  "page.today.after_line3": "Risks with clock times",
  "page.today.after_line4": "Confident decision",
  "page.today.quote":
    "\"Managers don't need more data — they need better decisions, faster.\"",
  "page.today.trust_title": "Why trust this?",
  "page.today.trust_explain_bold": "Explainable:",
  "page.today.trust_explain":
    "every number cites its drivers (last 3 {weekday}s, active promo, weather).",
  "page.today.trust_sim_bold": "Simulate first:",
  "page.today.trust_sim": "try any change in Byte before acting.",
  "page.today.trust_human_bold": "Human in control:",
  "page.today.trust_human": "nothing is executed without you tapping assign.",
  "page.today.trust_see_accuracy": "See accuracy",
  "page.today.promo_active": "{name} in play",

  "page.copilot.title": "Byte by Yum!",
  "page.copilot.subtitle":
    "Ask anything about today: demand, risks, what-ifs. Every answer cites drivers and confidence. You stay in control.",
  "page.copilot.grounded_chip": "Grounded in today's forecast",
  "page.copilot.open_today": "Open Today's Plan",
  "page.copilot.online": "Online · deterministic engine",
  "page.copilot.session": "Session 1",
  "page.copilot.placeholder": "Ask Byte something like \"What if I reduce prep by 20%?\"",
  "page.copilot.sidepanel.positioning_title": "Core positioning",
  "page.copilot.sidepanel.positioning":
    "\"Byte isn't a dashboard — it's a system, powered by Yum!, that turns data into <strong>timely, confident decisions</strong>, enabling managers to operate proactively instead of reactively.\"",
  "page.copilot.sidepanel.try_these": "Try these",
  "page.copilot.sidepanel.grounded_title": "How this is grounded",
  "page.copilot.sidepanel.grounded_core": "Deterministic core:",
  "page.copilot.sidepanel.grounded_core_body":
    "decisions come from the same forecast + BOM + capacity engine as the rest of the app.",
  "page.copilot.sidepanel.grounded_llm": "LLM-style narrative:",
  "page.copilot.sidepanel.grounded_llm_body":
    "Byte explains, it doesn't override.",
  "page.copilot.sidepanel.grounded_human": "Human in control:",
  "page.copilot.sidepanel.grounded_human_body":
    "every action is opt-in, never auto-executed.",

  "page.predictions.title": "Predictions & Inventory",
  "page.predictions.subtitle":
    "Demand forecast for the next 7 days, exploded into a concrete prep plan and supplier order — every quantity tied to forecasted SKU mix.",
  "page.predictions.days": "{n} days",
  "page.predictions.kpi_orders": "{n}-day orders",
  "page.predictions.kpi_revenue": "{n}-day revenue",
  "page.predictions.kpi_peak": "Peak day",
  "page.predictions.kpi_peak_sub": "{n} orders",
  "page.predictions.kpi_promo": "Promo days in window",
  "page.predictions.kpi_promo_sub": "weekend + Tuesday",
  "page.predictions.kpi_suffix_forecast": "forecast",
  "page.predictions.chart_title": "Forecast — next {n} days",
  "page.predictions.chart_caption":
    "Predicted orders with P10–P90 confidence band",
  "page.predictions.top_skus": "Top SKUs in window",
  "page.predictions.col_item": "Menu item",
  "page.predictions.col_category": "Category",
  "page.predictions.col_qty": "Forecast qty",
  "page.predictions.col_revenue": "Est. revenue",
  "page.predictions.prep_title": "Tomorrow's prep plan",
  "page.predictions.prep_empty": "No pre-prep needed.",
  "page.predictions.supplier_title": "Recommended supplier order ({n} days)",
  "page.predictions.supplier_caption":
    "Includes 10% safety stock · sorted by stockout risk",

  "page.recs.title": "Recommendations",
  "page.recs.subtitle":
    "Each recommendation explains why it matters, the drivers behind it, and a concrete plan with owners, times and quantities. One click turns it into a tracked task.",
  "page.recs.filter_severity": "Severity:",
  "page.recs.filter_category": "Category:",
  "page.recs.showing": "Showing {n} of {total}",
  "page.recs.empty": "No recommendations match the current filters.",
  "page.recs.today": "Today",
  "page.recs.tomorrow": "Tomorrow",

  "page.whatif.title": "What-if Planner",
  "page.whatif.subtitle":
    "Move the levers to see how weather, events, promos, marketing pushes and price changes flow through to orders, revenue and the supplier order. Save scenarios to compare.",
  "page.whatif.kpi_orders": "7-day orders",
  "page.whatif.kpi_revenue": "7-day revenue",
  "page.whatif.kpi_peak": "Peak day forecast",
  "page.whatif.kpi_peak_sub": "orders",
  "page.whatif.kpi_risk": "At-risk ingredients",
  "page.whatif.kpi_risk_sub": "needing order",
  "page.whatif.kpi_vs_baseline": "vs baseline",
  "page.whatif.scenario_title": "Scenario vs baseline (orders)",
  "page.whatif.scenario_link": "See updated plan",
  "page.whatif.scenario_legend":
    "Bars = baseline forecast (no what-if). Red line = your scenario. Shaded = P10-P90 range.",
  "page.whatif.drivers_title": "Driver decomposition (tomorrow)",
  "page.whatif.drivers_empty":
    "Adjust a slider — drivers and their effect on tomorrow's forecast will appear here.",
  "page.whatif.ingredients_title": "Top ingredient impact under scenario",
  "page.whatif.col_ingredient": "Ingredient",
  "page.whatif.col_required": "Required (7d)",
  "page.whatif.col_onhand": "On hand",
  "page.whatif.col_packs": "Order packs",
  "page.whatif.col_cost": "Est. cost",

  "page.accuracy.title": "Prediction vs Actual",
  "page.accuracy.subtitle":
    "Walk-forward back-test of the forecast against real store results, plus this-week vs last-week. Use this to build trust in the recommendations and tune thresholds.",
  "page.accuracy.orders": "Orders",
  "page.accuracy.revenue": "Revenue",
  "page.accuracy.kpi_mape": "MAPE",
  "page.accuracy.kpi_mape_sub": "lower is better",
  "page.accuracy.kpi_bias": "Bias",
  "page.accuracy.kpi_bias_over": "over-forecast",
  "page.accuracy.kpi_bias_under": "under-forecast",
  "page.accuracy.kpi_hit": "P10–P90 hit rate",
  "page.accuracy.kpi_hit_sub": "actuals inside band",
  "page.accuracy.kpi_stockouts": "Stockouts prevented",
  "page.accuracy.kpi_stockouts_sub": "from order recs",
  "page.accuracy.kpi_waste": "Waste saved",
  "page.accuracy.kpi_waste_sub": "from prep recs",
  "page.accuracy.chart_title": "Predicted vs Actual ({metric})",
  "page.accuracy.chart_caption": "Last {n} days · walk-forward",
  "page.accuracy.wow_title": "This week vs last week",
  "page.accuracy.wow_caption": "By weekday",
  "page.accuracy.legend_last": "Last week",
  "page.accuracy.legend_this": "This week",

  "page.tasks.title": "Tasks",
  "page.tasks.subtitle":
    "Every recommendation can become a tracked task — assigned, status-managed, and verified by the manager. The audit trail lives here.",
  "page.tasks.browse": "Browse recommendations",
  "page.tasks.kpi_open": "Open",
  "page.tasks.kpi_open_sub": "not yet completed",
  "page.tasks.kpi_inprog": "In progress",
  "page.tasks.kpi_inprog_sub": "being worked on",
  "page.tasks.kpi_done": "Done / verified",
  "page.tasks.kpi_done_sub": "completed today",
  "page.tasks.kpi_blocked": "Blocked",
  "page.tasks.kpi_blocked_sub": "needs escalation",
  "page.tasks.filter.all": "All",
  "page.tasks.filter.new": "New",
  "page.tasks.filter.in_progress": "In progress",
  "page.tasks.filter.blocked": "Blocked",
  "page.tasks.filter.done": "Done",
  "page.tasks.filter.verified": "Verified",
  "page.tasks.empty_title": "No tasks yet",
  "page.tasks.empty_sub": "Add tasks from the {link} page to start tracking execution.",
  "page.tasks.empty_link": "Recommendations",

  "page.alerts.title": "Alerts",
  "page.alerts.subtitle":
    "Prioritised exception feed across the next 72 hours. Click an alert to open the full recommendation with drivers and executable plan.",
  "page.alerts.active": "{n} active",
  "page.alerts.empty": "No alerts at this severity.",
  "page.alerts.for_date": "For {date}",
  "page.alerts.conf": "{n}% conf.",

  // ---------- Home page extras ----------
  "home.kpi.sales_today": "Sales today",
  "home.kpi.orders_today": "Orders today",
  "home.kpi.forecast_tomorrow": "Forecast tomorrow",
  "home.kpi.labour": "Labour vs plan",
  "home.kpi.availability": "On-shelf availability",
  "home.kpi.tickettime": "Avg ticket time",
  "home.kpi.vs_last_week": "vs last week",
  "home.kpi.under_plan": "under plan",
  "home.kpi.vs_target_95": "vs target 95%",
  "home.kpi.faster": "faster",
  "home.kpi.no_promo": "No promo",
  "home.top3_title": "Top 3 risks for {date} ({weekday})",
  "home.top3_view_all": "View all {n}",
  "home.hourly_today": "Today's hourly orders",
  "home.quick_actions": "Quick actions",
  "home.qa.forecast": "Forecast",
  "home.qa.whatif": "What-if",
  "home.qa.accuracy": "Accuracy",
  "home.qa.tasks": "Tasks",
  "home.briefing": "Daily briefing",
  "home.briefing.body":
    "Tomorrow is <strong>{weekday}</strong>. Forecast <strong>{orders} orders</strong> ({p10}–{p90} range), <strong>{revenue}</strong> revenue.",
  "home.briefing.promo":
    " <strong>{name}</strong> is active — expect uplift on Pepperoni Feast and Meat Feast.",
  "home.briefing.queued":
    " You have <strong>{n}</strong> recommendations queued.",

  // ---------- BigActionCard / RecommendationCard ----------
  "rec.confidence": "Confidence {pct}%",
  "rec.why_matters": "Why take this action",
  "rec.drivers": "Drivers",
  "rec.based_on": "Based on",
  "rec.what_to_do": "What to do",
  "rec.plan": "Executable plan",
  "rec.impact": "Expected impact:",
  "rec.impact_if_act": "Impact if you act",
  "rec.assign": "Assign as task",
  "rec.assigned": "Assigned",
  "rec.task_created": "Task created",
  "rec.why": "Why?",
  "rec.hide_why": "Hide why",
  "rec.why_short": "Why:",
  "rec.expand": "Tap for full plan",
  "rec.collapse": "Collapse",
  "rec.show_plan": "Show full plan ({n} more step{s})",
  "rec.hide_plan": "Hide full plan",

  // ---------- Stockout timeline ----------
  "timeline.title": "Stockout timeline",
  "timeline.caption":
    "Hour-by-hour demand vs on-hand. Red bars mark the hour where an ingredient depletes.",
  "timeline.risk_count_one": "{n} projected risk",
  "timeline.risk_count_other": "{n} projected risks",
  "timeline.hour_label": "Hour {h}",
  "timeline.runs_out_at": "{label} runs out at",
  "timeline.detail":
    "On-hand {onHand} {unit} · burn {burn} {unit}/hr · impacts {impacts}",

  // ---------- Demo banner ----------
  "demo.banner_kicker": "Guided demo",
  "demo.banner_title": "Friday lunch rush · 5-step story",
  "demo.banner_sub": "Pain → Plan → Why → What-if → Outcome",
  "demo.active_kicker": "Guided demo · Friday lunch rush",
  "demo.step1.title": "1 · The pain",
  "demo.step1.body":
    "It's Friday. Mike usually guesses how much dough to prep, then firefights when lunch hits. Last Friday he ran out of mozzarella at 1:12 PM.",
  "demo.step2.title": "2 · The plan",
  "demo.step2.body":
    "Byte's forecast says **demand +30% vs typical Friday** because of the Family Deal. It surfaces **Top 3 actions** — extra dough, an extra make-line cover, and a depot order — each with owner and deadline.",
  "demo.step3.title": "3 · Ask \"why?\"",
  "demo.step3.body":
    "Mike taps **Why?** on the lead action. The system explains: \"Based on last 3 Fridays + active Friday Family Deal, pepperoni share boosts 15%.\" No jargon, just cited drivers.",
  "demo.step4.title": "4 · Simulate before acting",
  "demo.step4.body":
    "Mike opens Byte and asks *\"What if I reduce prep by 20%?\"* — instantly: **\"You run out of mozzarella at 12:50 PM, service delay +15%.\"** He undoes the cut.",
  "demo.step5.title": "5 · Confident decision",
  "demo.step5.body":
    "Mike assigns all 3 actions as tasks to the kitchen & shift lead. No firefighting. End of service: ticket time 11 min, zero stockouts.",

  // ---------- What-if panel ----------
  "whatif.weather": "Weather",
  "whatif.weather.sunny": "Sunny",
  "whatif.weather.cloudy": "Cloudy",
  "whatif.weather.rainy": "Rainy",
  "whatif.weather.cold": "Cold",
  "whatif.weather.hot": "Hot",
  "whatif.event": "Local event",
  "whatif.event.none": "No event",
  "whatif.event.match": "Football match",
  "whatif.event.holiday": "Bank holiday",
  "whatif.event.school_break": "School break",
  "whatif.promo_uplift": "Promo uplift",
  "whatif.marketing_push": "Marketing push",
  "whatif.price_change": "Price change",
  "whatif.scenario_placeholder": "Scenario name e.g. 'Sat + match'",
  "whatif.saved_scenarios": "Saved scenarios",

  // ---------- Inventory / ingredients tables ----------
  "inv.col_ingredient": "Ingredient",
  "inv.col_required": "Required",
  "inv.col_onhand": "On hand",
  "inv.col_shortfall": "Shortfall",
  "inv.col_packs": "Order (packs)",
  "inv.col_cost": "Est. cost",
  "inv.col_cutoff": "Cutoff",
  "inv.col_status": "Status",
  "inv.status_healthy": "Healthy",
  "inv.status_risk": "{level} risk",
  "inv.cutoff_line": "{hour}:00 · LT {lead}h",

  // ---------- Tasks ----------
  "task.status.new": "New",
  "task.status.in_progress": "In progress",
  "task.status.blocked": "Blocked",
  "task.status.done": "Done",
  "task.status.verified": "Verified",
  "task.due": "Due {when}",
  "task.owner": "Owner: {name}",

  // ---------- Forecast engine drivers ----------
  "driver.baseline": "Same-weekday baseline ({n} orders)",
  "driver.promo_active": "Promotion active",
  "driver.promo_uplift": "Promo uplift {sign}{pct}%",
  "driver.weather": "Weather: {w}",
  "driver.event": "Local event: {e}",
  "driver.marketing": "Marketing push +{pct}%",
  "driver.price": "Price {sign}{pct}%",

  // ---------- Recommendation titles / bodies ----------
  "rec.inv.title": "Order {packs} pack{s} of {item} ({cost})",
  "rec.inv.why":
    "Forecasted requirement {required} {unit}, on-hand only {onHand} {unit}. Shortfall {shortfall} {unit}.",
  "rec.inv.driver_lt": "Lead time {lead}h, supplier cutoff {hour}:00",
  "rec.inv.step1": "Place purchase order with depot for {packs} × {size} {unit}",
  "rec.inv.step2": "Confirm cutoff acknowledgement from depot",
  "rec.inv.unit_packs": "packs",
  "rec.inv.impact": "Prevents stockout of {item}; protects ~{n} at-risk orders",

  "rec.prep.title":
    "Pre-prep batch for tonight's peak (forecast {p50} orders, {sign}{pct}% vs last week)",
  "rec.prep.why":
    "Peak window 18:00–21:00 expected to deliver ~{n} orders. Make-line throughput must be primed.",
  "rec.prep.impact":
    "Reduces ticket time by ~25%, prevents 8–12 dough stockouts at peak",

  "rec.labor.title":
    "Add 1 Make-Line cover {from}:00–{to}:00 (projected {demand} orders vs {cap} capacity)",
  "rec.labor.why":
    "Without extra cover, ticket time at {hour}:00 will exceed 18 min and customer satisfaction will drop.",
  "rec.labor.driver_forecast": "Forecast {p50} orders today (+{pct}% WoW)",
  "rec.labor.step1": "Move Sam from Front to Make-Line",
  "rec.labor.step2": "Pre-heat secondary oven",
  "rec.labor.step3": "Stagger 15-min breaks; no breaks in peak window",
  "rec.labor.impact":
    "Adds ~22 pizza/hr capacity, holds ticket time ≤ 12 min, protects ~£{gbp} revenue",

  "rec.driver.title": "Call in 1 extra driver 18:00–21:30",
  "rec.driver.why":
    "Projected {deliv} delivery orders/hr at 19:00 vs {cap} driver capacity.",
  "rec.driver.driver_share": "Delivery share 55%",
  "rec.driver.step1": "Phone Hugo for additional 18:00–21:30 cover",
  "rec.driver.step2": "Brief on delivery zones A–C",
  "rec.driver.impact":
    "Holds delivery promise time at 30 min; protects ~12 late-delivery refunds",

  "rec.promo.title":
    "Activate \"{name}\" assets across in-store, online and social",
  "rec.promo.why":
    "Today is a promo day. Historical uplift +{pct}% on order count and +{boost}% on Pepperoni / Meat Feast share.",
  "rec.promo.driver_weekday": "Weekday: {weekday}",
  "rec.promo.driver_recurring": "Recurring promotion",
  "rec.promo.step1": "Refresh in-store screens with promo creative",
  "rec.promo.step2": "Push social reminder + WhatsApp broadcast",
  "rec.promo.step3": "Refresh signage for evening footfall",
  "rec.promo.impact": "+{pct}% orders, ~{gbp} incremental revenue",

  "rec.waste.title":
    "Reduce dough prep by ~{pct}% vs last {weekday}",
  "rec.waste.why":
    "Forecast is {delta}% below last week — over-prep would mean dough waste at end of shelf life.",
  "rec.waste.step1": "Re-balance dough prep batch downward",
  "rec.waste.step2": "Re-forecast on actuals; adjust closing-shift prep",
  "rec.waste.impact": "Saves ~{gbp} waste",

  // ---------- Prep tasks ----------
  "prep.dough_large": "Prep large dough balls",
  "prep.dough_medium": "Prep medium dough balls",
  "prep.cheese": "Pre-shred mozzarella",
  "prep.wings": "Marinate wings",
  "prep.unit_balls": "balls",
  "prep.unit_kg": "kg",
  "prep.unit_pcs": "pcs",
  "prep.reason_dough": "Cold-proof needs 2–3h before evening peak (18:00–21:00)",
  "prep.reason_dough_m": "Cold-proof needs 2–3h before evening peak",
  "prep.reason_cheese": "Make-line consumes ~22 pizzas/staff/hour at peak",
  "prep.reason_wings": "30 min marinade + holding",
  "prep.before": "before {time}",

  // ---------- Copilot ----------
  "copilot.sugg.biggest_risk": "What's my biggest risk today?",
  "copilot.sugg.why_demand": "Why is demand higher than usual?",
  "copilot.sugg.whatif_prep": "What if I reduce prep by 20%?",
  "copilot.sugg.when_dough": "When will we run out of dough?",
  "copilot.sugg.compare_friday": "Compare to last Friday",
  "copilot.sugg.what_prepare": "What should I prepare?",
  "copilot.sugg.when_mozzarella": "When will we run out of mozzarella?",
  "copilot.sugg.whatif_rain": "What if it rains tonight?",
  "copilot.sugg.show_prep_plan": "Show me the full prep plan",
  "copilot.sugg.skip_action": "What if I skip this action?",
  "copilot.sugg.top3": "Show me the top 3 actions",
  "copilot.sugg.drivers_enough": "Do I have enough drivers?",
  "copilot.sugg.staff_enough": "Do I have enough staff?",
  "copilot.sugg.why_shift": "Why the shift?",
  "copilot.sugg.accuracy_history": "Show me the accuracy history",
  "copilot.sugg.order_stock": "Order the missing stock now",
  "copilot.sugg.prep_more": "What if I prep more dough?",

  "copilot.greeting":
    "Hi Mike — I'm **Byte**, your Smart Planning assistant by Yum!.\n\nFor **{day}, {date}** I'm forecasting **{orders} orders** ({revenue} revenue, P10–P90 {p10}–{p90}). I've prioritised **{n} actions** with the biggest impact.",
  "copilot.citation.open_today": "Open Today's Plan",
  "copilot.citation.baseline": "Same-weekday baseline ({n} orders)",
  "copilot.citation.last_actual": "Last {day} actual ({n} orders)",
  "copilot.citation.recs_n": "{n} recommendations",
  "copilot.citation.forecast_bom": "Forecast + BOM consumption",
  "copilot.citation.full_plan": "Full plan",
  "copilot.citation.accuracy": "See accuracy history",

  "copilot.why_demand.headline":
    "Today is **{day}**. I'm forecasting **{orders} orders** ({p10}–{p90} range), which is **{deltaPct} vs last {day}** ({lastWeekOrders} orders).",
  "copilot.why_demand.why_shift":
    "**Why the shift?** Based on last 3 {day}s + active signals:",
  "copilot.why_demand.no_drivers":
    "- Natural weekday pattern only — no active promos, weather or events are shifting demand.",
  "copilot.why_demand.promo":
    "**Promo in play:** *{name}* historically boosts Pepperoni Feast and Meat Feast share by ~15%.",

  "copilot.whatif_prep.headline": "**Simulating: cut prep by {pct}%**",
  "copilot.whatif_prep.stockout":
    "- **Stockout risk:** you will run out of **{item}** at approximately **{clock}**.",
  "copilot.whatif_prep.impact": "- Impacted items: {items}.",
  "copilot.whatif_prep.no_stockouts":
    "- No new stockouts — you have slack on today's forecast.",
  "copilot.whatif_prep.delay":
    "- Estimated **service delay +{pct}%** during the peak window — ticket time could breach 15 min.",
  "copilot.whatif_prep.revenue":
    "- Revenue at risk: **{gbp}** if stockouts force item swaps or cancellations.",
  "copilot.whatif_prep.recommendation":
    "**Recommendation:** hold today's prep at the forecast level. If you want to save labour, defer the cut to the **{alt}** low window instead.",
  "copilot.whatif_prep.alt_tuesday": "Tuesday",
  "copilot.whatif_prep.alt_other": "next weekday",

  "copilot.whatif_promo.body":
    "**Simulating: +20% promo push**\n\n- Orders rise to **{orders}** ({deltaPct} vs baseline).\n- Revenue **+{gbp}**, mostly on Pepperoni Feast & Meat Feast.\n- Additional prep: **+{pizzas} large pepperoni pizzas** worth of dough + mozzarella.\n- Risk: you'd tighten mozzarella cover — recommend an **extra 2 packs (2 kg)** from the depot before 16:00 cutoff.",

  "copilot.whatif_rain.body":
    "**Simulating: rainy evening**\n\n- Delivery share jumps (people stay in). Forecast rises to **{orders} orders** ({deltaPct}).\n- Biggest lever is **driver capacity** — call in 1 extra driver for 18:00–21:30.\n- Dine-in cover can drop by 1 — redeploy to the make line.\n- Expect wait-time complaints above 30 min if no action is taken.",

  "copilot.biggest_risk.none":
    "No significant risks for today. The plan is on track — focus on the routine checklist.",
  "copilot.biggest_risk.body":
    "**Your biggest risk:** {title}\n\n**Why it matters:** {why}\n\n**{driverWord}:**\n{drivers}\n\n**What I'd do:**\n{steps}\n\n**Expected impact:** {impact}.",
  "copilot.biggest_risk.driver_one": "Driver",
  "copilot.biggest_risk.driver_many": "Drivers",

  "copilot.stockout.none":
    "Good news — no ingredients are projected to run out today on current on-hand. I'll alert you the moment any hourly burn exceeds cover.",
  "copilot.stockout.body":
    "At current prep + on-hand, projected stockouts for today:\n\n{list}\n\nOrdering from the depot now (before 16:00 cutoff) prevents all of the above.",
  "copilot.stockout.item":
    "- **{label}** around **{clock}** — impacts {items}.",

  "copilot.compare.none": "I don't have last-week data to compare.",
  "copilot.compare.body":
    "**vs last {day} ({date}):**\n\n- Orders: **{orders}** (forecast) vs **{lastOrders}** (actual) — {ordersDelta}.\n- Revenue: **{rev}** vs **{lastRev}** — {revDelta}.\n- Last {day}'s peak hour saw ~{peak} orders in the 7 PM slot. Today's plan has more cover in that window.",

  "copilot.today.body":
    "Here's your **top 3 actions for today** (forecast {orders} orders, {rev} revenue):\n\n{list}\n\nEvery recommendation has a \"why\" and an executable plan. Open the Today's Plan page to assign them.",

  "copilot.prep_qty.none":
    "No pre-prep batches are needed beyond the standing routine.",
  "copilot.prep_qty.body":
    "**Today's prep quantities** (driven by forecast {orders} orders):\n\n{list}",
  "copilot.prep_qty.row": "- **{qty} {unit}** of {label} — {doBy}. _Why:_ {reason}",

  "copilot.revenue.body":
    "Today's revenue forecast: **{rev}** on ~**{orders} orders**. Range: {low} – {high} (P10–P90).",

  "copilot.confidence.body":
    "I optimise for **better decisions under uncertainty, not perfect prediction.**\n\n- Every forecast has a P10–P90 range.\n- Every recommendation has a confidence score (60–95% typical).\n- If confidence is low, I surface the risk instead of auto-actioning.\n- Our last 21 days hit the P10–P90 band on ~72% of days, MAPE ~11%.\n\nYou stay in control — I augment, I don't replace.",

  "copilot.fallback":
    "I'm Byte — I can help with planning, risks and what-if questions. Try one of the suggested prompts below, or ask me things like *\"What's my biggest risk today?\"* or *\"What if I reduce prep by 20%?\"*",

  // ---------- Ingredient labels ----------
  "ingredient.dough_large": "Dough balls (large)",
  "ingredient.dough_medium": "Dough balls (medium)",
  "ingredient.tomato_sauce_ml": "Tomato sauce (ml)",
  "ingredient.mozzarella_g": "Mozzarella (g)",
  "ingredient.pepperoni_g": "Pepperoni (g)",
  "ingredient.ham_g": "Ham (g)",
  "ingredient.chicken_g": "Chicken (g)",
  "ingredient.beef_g": "Beef (g)",
  "ingredient.sausage_g": "Sausage (g)",
  "ingredient.bbq_sauce_ml": "BBQ sauce (ml)",
  "ingredient.onion_g": "Onion (g)",
  "ingredient.pepper_g": "Peppers (g)",
  "ingredient.mushroom_g": "Mushroom (g)",
  "ingredient.sweetcorn_g": "Sweetcorn (g)",
  "ingredient.pineapple_g": "Pineapple (g)",
  "ingredient.jalapeno_g": "Jalapeño (g)",
  "ingredient.garlic_butter_ml": "Garlic butter (ml)",
  "ingredient.wing_pieces": "Wings (pieces)",
  "ingredient.potato_g": "Potato (g)",
  "ingredient.cookie_dough_g": "Cookie dough (g)",
  "ingredient.ice_cream_g": "Ice cream (g)",
  "ingredient.soda_ml": "Soda (ml)",
  "ingredient.juice_ml": "Juice (ml)",
  "ingredient.water_ml": "Water (ml)",
};

export const MESSAGES: Messages = en;

export function lookup(key: string): string {
  return MESSAGES[key] ?? key;
}

export function interp(
  template: string,
  vars?: Record<string, string | number | undefined | null>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v == null ? "" : String(v);
  });
}

export function translate(
  key: string,
  vars?: Record<string, string | number | undefined | null>,
): string {
  return interp(lookup(key), vars);
}
