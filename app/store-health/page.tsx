"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  Banknote,
  ChefHat,
  Clock4,
  Pizza,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { PageHeader } from "@/components/Shell";
import { KPICard } from "@/components/KPICard";
import { RecommendationCard } from "@/components/RecommendationCard";
import { useHistory } from "@/lib/data/useHistory";
import { buildRecommendations } from "@/lib/forecast/recommendations";
import { addDays, formatGBP, formatNumber, ddmm } from "@/lib/utils";
import { promoForDate, ordersByHourForDate } from "@/lib/mock/orders";
import { CHART, PH } from "@/lib/theme/tokens";
import { useAppStore } from "@/lib/state/store";
import { useT } from "@/lib/i18n/useT";

export default function HomePage() {
  const history = useHistory();
  const whatIf = useAppStore((s) => s.whatIf);
  const today = history.endDate;
  const tomorrow = addDays(today, 1);
  const { t, longWeekday } = useT();

  const bundle = useMemo(
    () => buildRecommendations(history, tomorrow, whatIf),
    [history, tomorrow, whatIf],
  );

  const todayActual = history.days[history.days.length - 1];
  const lastWeekActual = history.days[history.days.length - 8];

  const ordersDelta =
    ((todayActual.orders.length - lastWeekActual.orders.length) /
      Math.max(1, lastWeekActual.orders.length)) * 100;
  const revDelta =
    ((todayActual.revenue - lastWeekActual.revenue) /
      Math.max(1, lastWeekActual.revenue)) * 100;

  const promo = promoForDate(tomorrow);
  const hourlyToday = ordersByHourForDate(history, today)
    .filter((h) => h.hour >= 10 && h.hour <= 23)
    .map((h) => ({
      hour: `${h.hour}:00`,
      orders: h.orders,
    }));

  const top3 = bundle.recs.slice(0, 3);
  const tomorrowWeekday = longWeekday(tomorrow);

  return (
    <>
      <PageHeader
        title={t("page.home.title")}
        subtitle={t("page.home.subtitle")}
        right={
          <>
            <span className="ph-chip-muted">
              <Clock4 className="h-3 w-3" /> {t("common.updated_n_min_ago", { n: 2 })}
            </span>
            <Link href="/today" className="ph-btn-primary">
              {t("page.home.cta_today")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/copilot" className="ph-btn-dark">
              {t("page.home.cta_copilot")}
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KPICard
          label={t("home.kpi.sales_today")}
          value={formatGBP(todayActual.revenue)}
          delta={revDelta}
          deltaSuffix={t("home.kpi.vs_last_week")}
          freshnessMins={2}
          icon={<Banknote className="h-4 w-4" />}
        />
        <KPICard
          label={t("home.kpi.orders_today")}
          value={formatNumber(todayActual.orders.length)}
          delta={ordersDelta}
          deltaSuffix={t("home.kpi.vs_last_week")}
          freshnessMins={2}
          icon={<ShoppingBag className="h-4 w-4" />}
        />
        <KPICard
          label={t("home.kpi.forecast_tomorrow")}
          value={formatNumber(Math.round(bundle.forecast.p50))}
          deltaSuffix={`${promo.active ? promo.name : t("home.kpi.no_promo")}`}
          freshnessMins={5}
          tone="default"
          icon={<Pizza className="h-4 w-4" />}
        />
        <KPICard
          label={t("home.kpi.labour")}
          value="-3.1%"
          delta={-3.1}
          deltaSuffix={t("home.kpi.under_plan")}
          tone="good"
          freshnessMins={6}
          icon={<Users className="h-4 w-4" />}
        />
        <KPICard
          label={t("home.kpi.availability")}
          value="94.6%"
          delta={1.2}
          deltaSuffix={t("home.kpi.vs_target_95")}
          tone="warn"
          freshnessMins={5}
          icon={<Warehouse className="h-4 w-4" />}
        />
        <KPICard
          label={t("home.kpi.tickettime")}
          value="11m 38s"
          delta={-4.5}
          deltaSuffix={t("home.kpi.faster")}
          tone="good"
          freshnessMins={3}
          icon={<ChefHat className="h-4 w-4" />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="ph-h2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-ph-red" />
              {t("home.top3_title", {
                date: ddmm(tomorrow),
                weekday: tomorrowWeekday,
              })}
            </h2>
            <Link href="/recommendations" className="text-sm font-semibold text-ph-red hover:underline">
              {t("home.top3_view_all", { n: bundle.recs.length })}
            </Link>
          </div>
          <div className="space-y-4">
            {top3.map((r) => (
              <RecommendationCard key={r.id} rec={r} />
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="ph-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="ph-h2">{t("home.hourly_today")}</h3>
              <span className="text-xs text-ph-muted">{ddmm(today)}</span>
            </div>
            <div className="h-44">
              <ResponsiveContainer>
                <AreaChart data={hourlyToday}>
                  <defs>
                    <linearGradient id="hourFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={PH.red} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={PH.red} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis
                    dataKey="hour"
                    fontSize={10}
                    stroke={CHART.axis}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    fontSize={10}
                    stroke={CHART.axis}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${CHART.grid}`,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke={PH.red}
                    strokeWidth={2}
                    fill="url(#hourFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ph-card p-4">
            <h3 className="ph-h2 mb-3">{t("home.quick_actions")}</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/predictions" className="ph-btn-ghost border border-ph-line">
                <Pizza className="h-4 w-4" /> {t("home.qa.forecast")}
              </Link>
              <Link href="/what-if" className="ph-btn-ghost border border-ph-line">
                <Sparkles className="h-4 w-4" /> {t("home.qa.whatif")}
              </Link>
              <Link href="/accuracy" className="ph-btn-ghost border border-ph-line">
                <ChefHat className="h-4 w-4" /> {t("home.qa.accuracy")}
              </Link>
              <Link href="/tasks" className="ph-btn-ghost border border-ph-line">
                <Truck className="h-4 w-4" /> {t("home.qa.tasks")}
              </Link>
            </div>
          </div>

          <div className="ph-card p-4">
            <h3 className="ph-h2 mb-2">{t("home.briefing")}</h3>
            <p
              className="text-sm text-ph-ink leading-relaxed"
              dangerouslySetInnerHTML={{
                __html:
                  t("home.briefing.body", {
                    weekday: tomorrowWeekday,
                    orders: Math.round(bundle.forecast.p50),
                    p10: Math.round(bundle.forecast.p10),
                    p90: Math.round(bundle.forecast.p90),
                    revenue: formatGBP(bundle.forecast.revenue),
                  }) +
                  (promo.active
                    ? t("home.briefing.promo", { name: promo.name })
                    : "") +
                  t("home.briefing.queued", { n: bundle.recs.length }),
              }}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
