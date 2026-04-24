"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/Shell";
import { useHistory } from "@/lib/data/useHistory";
import {
  walkForwardAccuracy,
  computeAccuracyKpis,
  weekOverWeek,
} from "@/lib/forecast/accuracy";
import { AccuracyChart } from "@/components/AccuracyChart";
import { KPICard } from "@/components/KPICard";
import { CHART, PH } from "@/lib/theme/tokens";
import { formatGBP, formatNumber, formatPct } from "@/lib/utils";
import { Banknote, Pizza, Target, TrendingDown, Trophy } from "lucide-react";
import { useT } from "@/lib/i18n/useT";

export default function AccuracyPage() {
  const history = useHistory();
  const [metric, setMetric] = useState<"orders" | "revenue">("orders");
  const [horizon, setHorizon] = useState<14 | 21>(21);
  const { t } = useT();

  const points = useMemo(
    () => walkForwardAccuracy(history, horizon),
    [history, horizon],
  );
  const kpis = useMemo(() => computeAccuracyKpis(points), [points]);
  const wow = useMemo(() => weekOverWeek(history), [history]);

  const metricLabel = metric === "orders"
    ? t("page.accuracy.orders")
    : t("page.accuracy.revenue");

  return (
    <>
      <PageHeader
        title={t("page.accuracy.title")}
        subtitle={t("page.accuracy.subtitle")}
        right={
          <>
            <div className="ph-card p-1 flex">
              {(["orders", "revenue"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                    metric === m ? "bg-ph-red text-white" : "text-ph-ink hover:bg-ph-line"
                  }`}
                >
                  {m === "orders"
                    ? t("page.accuracy.orders")
                    : t("page.accuracy.revenue")}
                </button>
              ))}
            </div>
            <div className="ph-card p-1 flex">
              {[14, 21].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h as 14 | 21)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                    horizon === h ? "bg-ph-black text-white" : "text-ph-ink hover:bg-ph-line"
                  }`}
                >
                  {h}d
                </button>
              ))}
            </div>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KPICard
          label={t("page.accuracy.kpi_mape")}
          value={formatPct(kpis.mape, 1)}
          deltaSuffix={t("page.accuracy.kpi_mape_sub")}
          tone={kpis.mape < 0.10 ? "good" : kpis.mape < 0.18 ? "warn" : "bad"}
          icon={<Target className="h-4 w-4" />}
        />
        <KPICard
          label={t("page.accuracy.kpi_bias")}
          value={`${kpis.bias > 0 ? "+" : ""}${(kpis.bias * 100).toFixed(1)}%`}
          deltaSuffix={
            kpis.bias > 0
              ? t("page.accuracy.kpi_bias_over")
              : t("page.accuracy.kpi_bias_under")
          }
          tone={Math.abs(kpis.bias) < 0.04 ? "good" : "warn"}
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <KPICard
          label={t("page.accuracy.kpi_hit")}
          value={formatPct(kpis.hitRate, 0)}
          deltaSuffix={t("page.accuracy.kpi_hit_sub")}
          tone={kpis.hitRate > 0.7 ? "good" : "warn"}
          icon={<Trophy className="h-4 w-4" />}
        />
        <KPICard
          label={t("page.accuracy.kpi_stockouts")}
          value={formatNumber(kpis.stockoutsPrevented)}
          deltaSuffix={t("page.accuracy.kpi_stockouts_sub")}
          tone="good"
          icon={<Pizza className="h-4 w-4" />}
        />
        <KPICard
          label={t("page.accuracy.kpi_waste")}
          value={formatGBP(kpis.wasteSavedGBP)}
          deltaSuffix={t("page.accuracy.kpi_waste_sub")}
          tone="good"
          icon={<Banknote className="h-4 w-4" />}
        />
      </div>

      <section className="ph-card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="ph-h2">
            {t("page.accuracy.chart_title", { metric: metricLabel })}
          </h2>
          <span className="text-xs text-ph-muted">
            {t("page.accuracy.chart_caption", { n: horizon })}
          </span>
        </div>
        <AccuracyChart rows={points} metric={metric} />
      </section>

      <section className="ph-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="ph-h2">{t("page.accuracy.wow_title")}</h2>
          <span className="text-xs text-ph-muted">
            {t("page.accuracy.wow_caption")}
          </span>
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={wow}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="label" fontSize={11} stroke={CHART.axis} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} stroke={CHART.axis} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.grid}`, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="lastWeek"
                name={t("page.accuracy.legend_last")}
                fill={PH.muted}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="thisWeek"
                name={t("page.accuracy.legend_this")}
                fill={PH.red}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
