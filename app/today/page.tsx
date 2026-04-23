"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock4,
  Flame,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/Shell";
import { BigActionCard } from "@/components/BigActionCard";
import { DemoBanner } from "@/components/DemoBanner";
import { StockoutTimeline } from "@/components/StockoutTimeline";
import { useHistory } from "@/lib/data/useHistory";
import { buildRecommendations } from "@/lib/forecast/recommendations";
import { buildTimeline } from "@/lib/forecast/timeline";
import { addDays, formatGBP, formatNumber } from "@/lib/utils";
import { promoForDate } from "@/lib/mock/orders";
import { useAppStore } from "@/lib/state/store";

// Today's Plan — the manager's single-screen answer to "what do I do today?"
// Mirrors UC1 from the demo PDF: big headline, top-3 action cards with qty/%,
// specific-time risk list, plus a before/after story banner.
export default function TodayPlanPage() {
  const history = useHistory();
  const whatIf = useAppStore((s) => s.whatIf);
  const tasks = useAppStore((s) => s.tasks);

  // Target "today" = the most recent day in the mock history.
  const today = history.endDate;
  const lastWeek = addDays(today, -7);
  const weekday = today.toLocaleDateString("en-GB", { weekday: "long" });

  const bundle = useMemo(
    () => buildRecommendations(history, today, whatIf),
    [history, today, whatIf],
  );

  const timeline = useMemo(
    () => buildTimeline({ forecast: bundle.forecast }),
    [bundle.forecast],
  );

  const lastWeekDay = history.days.find(
    (d) => d.date.toDateString() === lastWeek.toDateString(),
  );
  const lastWeekOrders = lastWeekDay?.orders.length ?? bundle.forecast.baseline;
  const orderDelta =
    (bundle.forecast.p50 - lastWeekOrders) / Math.max(1, lastWeekOrders);
  const pctText = `${orderDelta > 0 ? "+" : ""}${(orderDelta * 100).toFixed(0)}%`;
  const promo = promoForDate(today);

  const top3 = bundle.recs.slice(0, 3);
  const assigned = tasks.filter((t) => t.status !== "verified").length;

  return (
    <>
      <PageHeader
        title={`Today's Plan · ${weekday}`}
        subtitle="Your single source of truth for the shift. Top 3 actions, specific-time risks, and a one-tap assign to the team."
        right={
          <>
            <span className="ph-chip-muted">
              <Clock4 className="h-3 w-3" /> Forecast refreshed 2 min ago
            </span>
            <Link href="/copilot" className="ph-btn-primary">
              Ask Copilot <MessageCircle className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <DemoBanner />

      {/* HERO — the headline */}
      <section className="ph-card p-6 md:p-8 mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-ph-red/5" />
        <div className="absolute right-10 bottom-0 h-32 w-32 rounded-full bg-ph-yellow/10" />
        <div className="relative grid md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <div className="ph-label flex items-center gap-1.5 text-ph-red">
              <Flame className="h-3.5 w-3.5" /> Today's forecast
            </div>
            <h2 className="text-[40px] md:text-[56px] leading-[1.05] font-extrabold text-ph-black mt-1">
              Demand{" "}
              <span className="text-ph-red">
                {pctText}
              </span>{" "}
              vs typical {weekday}
            </h2>
            <p className="text-ph-muted mt-2 text-base md:text-lg">
              {Math.round(bundle.forecast.p50)} orders forecast · {formatGBP(bundle.forecast.revenue)} revenue ·{" "}
              <span className="font-semibold text-ph-ink">
                confidence {Math.round((bundle.forecast.p10 / bundle.forecast.p50) * 100)}–{Math.round((bundle.forecast.p90 / bundle.forecast.p50) * 100)}%
              </span>
              {promo.active && (
                <>
                  {" · "}
                  <span className="font-semibold text-ph-red">{promo.name}</span> in play
                </>
              )}
              .
            </p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
            <StatPill
              icon={<TrendingUp className="h-4 w-4" />}
              label="Orders (P50)"
              value={formatNumber(Math.round(bundle.forecast.p50))}
              sub={`${Math.round(bundle.forecast.p10)}–${Math.round(bundle.forecast.p90)} range`}
              tone="red"
            />
            <StatPill
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Risks at peak"
              value={`${timeline.stockouts.length}`}
              sub="ingredient stockouts"
              tone={timeline.stockouts.length ? "amber" : "green"}
            />
            <StatPill
              icon={<Users className="h-4 w-4" />}
              label="Tasks assigned"
              value={`${assigned}`}
              sub={`${Math.min(3, bundle.recs.length) - Math.min(assigned, 3)} of top 3 to go`}
              tone="default"
            />
          </div>
        </div>
      </section>

      {/* TOP 3 ACTIONS — UC1 "Prepare 120 units of Item A (+25%)" style */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="ph-h2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-ph-red" />
            Top 3 actions for today
          </h2>
          <span className="text-xs text-ph-muted">
            Prioritised by impact × confidence · signal over noise
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {top3.map((r, i) => (
            <BigActionCard key={r.id} index={i + 1} rec={r} />
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Specific-time risk feed */}
        <div className="lg:col-span-2">
          <StockoutTimeline
            buckets={timeline.buckets}
            stockouts={timeline.stockouts}
          />
        </div>

        {/* Before / After callout */}
        <aside className="space-y-4">
          <BeforeAfterCard />
          <div className="ph-card p-4">
            <h3 className="ph-h2 mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-ph-green" /> Why trust this?
            </h3>
            <ul className="text-sm text-ph-ink space-y-2">
              <li>
                <span className="font-bold">Explainable:</span> every number cites its drivers (last 3 {weekday}s, active promo, weather).
              </li>
              <li>
                <span className="font-bold">Simulate first:</span> try any change in the Copilot before acting.
              </li>
              <li>
                <span className="font-bold">Human in control:</span> nothing is executed without you tapping assign.
              </li>
            </ul>
            <div className="mt-3 flex gap-2">
              <Link href="/copilot" className="ph-btn-primary">
                Ask the Copilot <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/accuracy" className="ph-btn-ghost border border-ph-line">
                See accuracy
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function StatPill({
  icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "red" | "amber" | "green" | "default";
}) {
  const bg =
    tone === "red"
      ? "bg-ph-red/10 text-ph-red"
      : tone === "amber"
      ? "bg-ph-amber/15 text-ph-amber"
      : tone === "green"
      ? "bg-ph-green/10 text-ph-green"
      : "bg-ph-line text-ph-ink";
  return (
    <div className="rounded-xl bg-ph-surface/80 border border-ph-line p-3">
      <div className={`inline-flex items-center gap-1.5 ph-chip ${bg}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-extrabold text-ph-black mt-1">{value}</div>
      {sub && <div className="text-[11px] text-ph-muted">{sub}</div>}
    </div>
  );
}

function BeforeAfterCard() {
  return (
    <div className="ph-card p-4">
      <h3 className="ph-h2 mb-3">Before vs after</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl border border-ph-line p-3 bg-ph-surface">
          <div className="ph-chip-muted mb-1.5">Before</div>
          <ul className="space-y-1 text-ph-ink">
            <li>• Guessing prep levels</li>
            <li>• Firefighting at peak</li>
            <li>• Stockouts @ lunch</li>
            <li>• Late deliveries</li>
          </ul>
        </div>
        <div className="rounded-xl border border-ph-red/30 p-3 bg-ph-red/5">
          <div className="ph-chip-red mb-1.5">After</div>
          <ul className="space-y-1 text-ph-ink">
            <li>• Forecast + drivers</li>
            <li>• Top 3, assigned in 2 taps</li>
            <li>• Risks with clock times</li>
            <li>• Confident decision</li>
          </ul>
        </div>
      </div>
      <p className="text-[11px] text-ph-muted mt-3 italic">
        "Managers don't need more data — they need better decisions, faster."
      </p>
    </div>
  );
}
