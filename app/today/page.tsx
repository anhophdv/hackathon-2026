"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Users,
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
import { useT } from "@/lib/i18n/useT";

export default function TodayPlanPage() {
  const history = useHistory();
  const whatIf = useAppStore((s) => s.whatIf);
  const tasks = useAppStore((s) => s.tasks);
  const { t, longWeekday } = useT();

  const today = history.endDate;
  const lastWeek = addDays(today, -7);
  const weekday = longWeekday(today);

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
  const remaining = Math.min(3, bundle.recs.length) - Math.min(assigned, 3);
  const confidenceBand = `${Math.round((bundle.forecast.p10 / bundle.forecast.p50) * 100)}–${Math.round((bundle.forecast.p90 / bundle.forecast.p50) * 100)}%`;

  return (
    <>
      <PageHeader
        title={t("page.today.title", { weekday })}
        subtitle={t("page.today.subtitle")}
        right={
          <>
            <span className="ph-chip-muted">
              <Clock4 className="h-3 w-3" />{" "}
              {t("common.forecast_refreshed_n_min_ago", { n: 2 })}
            </span>
            <Link href="/copilot" className="ph-btn-primary">
              {t("page.today.ask_copilot")} <MessageCircle className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <DemoBanner />

      <section className="ph-card p-6 md:p-8 mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-ph-red/5" />
        <div className="absolute right-10 bottom-0 h-32 w-32 rounded-full bg-ph-yellow/10" />
        <div className="relative grid md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <div className="ph-label flex items-center gap-1.5 text-ph-red">
              <Flame className="h-3.5 w-3.5" /> {t("page.today.hero_label")}
            </div>
            <h2 className="text-[40px] md:text-[56px] leading-[1.05] font-extrabold text-ph-black mt-1">
              {t("page.today.hero_headline", { pct: pctText, weekday })
                .split(pctText)
                .flatMap((part, i, arr) =>
                  i < arr.length - 1
                    ? [part, <span key={i} className="text-ph-red">{pctText}</span>]
                    : [part],
                )}
            </h2>
            <p className="text-ph-muted mt-2 text-base md:text-lg">
              {t("page.today.hero_sub", {
                orders: Math.round(bundle.forecast.p50),
                revenue: formatGBP(bundle.forecast.revenue),
                band: confidenceBand,
              })}
              {promo.active && (
                <>
                  {" · "}
                  <span className="font-semibold text-ph-red">
                    {t("page.today.promo_active", { name: promo.name })}
                  </span>
                </>
              )}
              .
            </p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
            <StatPill
              icon={<TrendingUp className="h-4 w-4" />}
              label={t("page.today.stat_orders")}
              value={formatNumber(Math.round(bundle.forecast.p50))}
              sub={t("page.today.stat_orders_sub", {
                low: Math.round(bundle.forecast.p10),
                high: Math.round(bundle.forecast.p90),
              })}
              tone="red"
            />
            <StatPill
              icon={<AlertTriangle className="h-4 w-4" />}
              label={t("page.today.stat_risks")}
              value={`${timeline.stockouts.length}`}
              sub={t("page.today.stat_risks_sub")}
              tone={timeline.stockouts.length ? "amber" : "green"}
            />
            <StatPill
              icon={<Users className="h-4 w-4" />}
              label={t("page.today.stat_tasks")}
              value={`${assigned}`}
              sub={t("page.today.stat_tasks_sub", { remaining })}
              tone="default"
            />
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="ph-h2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-ph-red" />
            {t("page.today.top3_title")}
          </h2>
          <span className="text-xs text-ph-muted">
            {t("page.today.top3_caption")}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {top3.map((r, i) => (
            <BigActionCard key={r.id} index={i + 1} rec={r} />
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StockoutTimeline
            buckets={timeline.buckets}
            stockouts={timeline.stockouts}
          />
        </div>

        <aside className="space-y-4">
          <BeforeAfterCard />
          <div className="ph-card p-4">
            <h3 className="ph-h2 mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-ph-green" />{" "}
              {t("page.today.trust_title")}
            </h3>
            <ul className="text-sm text-ph-ink space-y-2">
              <li>
                <span className="font-bold">
                  {t("page.today.trust_explain_bold")}
                </span>{" "}
                {t("page.today.trust_explain", { weekday })}
              </li>
              <li>
                <span className="font-bold">
                  {t("page.today.trust_sim_bold")}
                </span>{" "}
                {t("page.today.trust_sim")}
              </li>
              <li>
                <span className="font-bold">
                  {t("page.today.trust_human_bold")}
                </span>{" "}
                {t("page.today.trust_human")}
              </li>
            </ul>
            <div className="mt-3 flex gap-2">
              <Link href="/copilot" className="ph-btn-primary">
                {t("page.today.ask_copilot")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/accuracy" className="ph-btn-ghost border border-ph-line">
                {t("page.today.trust_see_accuracy")}
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
  const { t } = useT();
  return (
    <div className="ph-card p-4">
      <h3 className="ph-h2 mb-3">{t("page.today.before_after_title")}</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl border border-ph-line p-3 bg-ph-surface">
          <div className="ph-chip-muted mb-1.5">{t("page.today.before")}</div>
          <ul className="space-y-1 text-ph-ink">
            <li>• {t("page.today.before_line1")}</li>
            <li>• {t("page.today.before_line2")}</li>
            <li>• {t("page.today.before_line3")}</li>
            <li>• {t("page.today.before_line4")}</li>
          </ul>
        </div>
        <div className="rounded-xl border border-ph-red/30 p-3 bg-ph-red/5">
          <div className="ph-chip-red mb-1.5">{t("page.today.after")}</div>
          <ul className="space-y-1 text-ph-ink">
            <li>• {t("page.today.after_line1")}</li>
            <li>• {t("page.today.after_line2")}</li>
            <li>• {t("page.today.after_line3")}</li>
            <li>• {t("page.today.after_line4")}</li>
          </ul>
        </div>
      </div>
      <p className="text-[11px] text-ph-muted mt-3 italic">
        {t("page.today.quote")}
      </p>
    </div>
  );
}
