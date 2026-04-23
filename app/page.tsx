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

export default function HomePage() {
  const history = useHistory();
  const whatIf = useAppStore((s) => s.whatIf);
  const today = history.endDate;
  const tomorrow = addDays(today, 1);

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

  return (
    <>
      <PageHeader
        title="Store Health"
        subtitle="One operational view of today's performance and tomorrow's risks. All KPIs are time-stamped; act on what matters most, in the time you have."
        right={
          <>
            <span className="ph-chip-muted">
              <Clock4 className="h-3 w-3" /> Updated 2 min ago
            </span>
            <Link href="/recommendations" className="ph-btn-primary">
              See all recommendations <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KPICard
          label="Sales today"
          value={formatGBP(todayActual.revenue)}
          delta={revDelta}
          deltaSuffix="vs last week"
          freshnessMins={2}
          icon={<Banknote className="h-4 w-4" />}
        />
        <KPICard
          label="Orders today"
          value={formatNumber(todayActual.orders.length)}
          delta={ordersDelta}
          deltaSuffix="vs last week"
          freshnessMins={2}
          icon={<ShoppingBag className="h-4 w-4" />}
        />
        <KPICard
          label="Forecast tomorrow"
          value={formatNumber(Math.round(bundle.forecast.p50))}
          deltaSuffix={`${promo.active ? promo.name : "No promo"}`}
          freshnessMins={5}
          tone="default"
          icon={<Pizza className="h-4 w-4" />}
        />
        <KPICard
          label="Labour vs plan"
          value="-3.1%"
          delta={-3.1}
          deltaSuffix="under plan"
          tone="good"
          freshnessMins={6}
          icon={<Users className="h-4 w-4" />}
        />
        <KPICard
          label="On-shelf availability"
          value="94.6%"
          delta={1.2}
          deltaSuffix="vs target 95%"
          tone="warn"
          freshnessMins={5}
          icon={<Warehouse className="h-4 w-4" />}
        />
        <KPICard
          label="Avg ticket time"
          value="11m 38s"
          delta={-4.5}
          deltaSuffix="faster"
          tone="good"
          freshnessMins={3}
          icon={<ChefHat className="h-4 w-4" />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top 3 risks */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="ph-h2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-ph-red" />
              Top 3 risks for {ddmm(tomorrow)} ({tomorrow.toLocaleDateString("en-GB", { weekday: "long" })})
            </h2>
            <Link href="/recommendations" className="text-sm font-semibold text-ph-red hover:underline">
              View all {bundle.recs.length}
            </Link>
          </div>
          <div className="space-y-4">
            {top3.map((r) => (
              <RecommendationCard key={r.id} rec={r} />
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          {/* Hourly sales today */}
          <div className="ph-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="ph-h2">Today's hourly orders</h3>
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

          {/* Quick actions */}
          <div className="ph-card p-4">
            <h3 className="ph-h2 mb-3">Quick actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/predictions" className="ph-btn-ghost border border-ph-line">
                <Pizza className="h-4 w-4" /> Forecast
              </Link>
              <Link href="/what-if" className="ph-btn-ghost border border-ph-line">
                <Sparkles className="h-4 w-4" /> What-if
              </Link>
              <Link href="/accuracy" className="ph-btn-ghost border border-ph-line">
                <ChefHat className="h-4 w-4" /> Accuracy
              </Link>
              <Link href="/tasks" className="ph-btn-ghost border border-ph-line">
                <Truck className="h-4 w-4" /> Tasks
              </Link>
            </div>
          </div>

          <div className="ph-card p-4">
            <h3 className="ph-h2 mb-2">Daily briefing</h3>
            <p className="text-sm text-ph-ink leading-relaxed">
              Tomorrow is{" "}
              <strong>
                {tomorrow.toLocaleDateString("en-GB", { weekday: "long" })}
              </strong>
              . Forecast{" "}
              <strong>{Math.round(bundle.forecast.p50)} orders</strong> (
              {Math.round(bundle.forecast.p10)}–{Math.round(bundle.forecast.p90)} range),{" "}
              <strong>{formatGBP(bundle.forecast.revenue)}</strong> revenue.
              {promo.active && (
                <>
                  {" "}<span className="font-semibold text-ph-red">{promo.name}</span>{" "}
                  is active — expect uplift on Pepperoni Feast and Meat Feast.
                </>
              )}{" "}
              You have <strong>{bundle.recs.length}</strong> recommendations queued.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
