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

export default function AccuracyPage() {
  const history = useHistory();
  const [metric, setMetric] = useState<"orders" | "revenue">("orders");
  const [horizon, setHorizon] = useState<14 | 21>(21);

  const points = useMemo(
    () => walkForwardAccuracy(history, horizon),
    [history, horizon],
  );
  const kpis = useMemo(() => computeAccuracyKpis(points), [points]);
  const wow = useMemo(() => weekOverWeek(history), [history]);

  return (
    <>
      <PageHeader
        title="Prediction vs Actual"
        subtitle="Walk-forward back-test of the forecast against real store results, plus this-week vs last-week. Use this to build trust in the recommendations and tune thresholds."
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
                  {m === "orders" ? "Orders" : "Revenue"}
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
          label="MAPE"
          value={formatPct(kpis.mape, 1)}
          deltaSuffix="lower is better"
          tone={kpis.mape < 0.10 ? "good" : kpis.mape < 0.18 ? "warn" : "bad"}
          icon={<Target className="h-4 w-4" />}
        />
        <KPICard
          label="Bias"
          value={`${kpis.bias > 0 ? "+" : ""}${(kpis.bias * 100).toFixed(1)}%`}
          deltaSuffix={kpis.bias > 0 ? "over-forecast" : "under-forecast"}
          tone={Math.abs(kpis.bias) < 0.04 ? "good" : "warn"}
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <KPICard
          label="P10–P90 hit rate"
          value={formatPct(kpis.hitRate, 0)}
          deltaSuffix="actuals inside band"
          tone={kpis.hitRate > 0.7 ? "good" : "warn"}
          icon={<Trophy className="h-4 w-4" />}
        />
        <KPICard
          label="Stockouts prevented"
          value={formatNumber(kpis.stockoutsPrevented)}
          deltaSuffix="from order recs"
          tone="good"
          icon={<Pizza className="h-4 w-4" />}
        />
        <KPICard
          label="Waste saved"
          value={formatGBP(kpis.wasteSavedGBP)}
          deltaSuffix="from prep recs"
          tone="good"
          icon={<Banknote className="h-4 w-4" />}
        />
      </div>

      <section className="ph-card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="ph-h2">Predicted vs Actual ({metric})</h2>
          <span className="text-xs text-ph-muted">Last {horizon} days · walk-forward</span>
        </div>
        <AccuracyChart rows={points} metric={metric} />
      </section>

      <section className="ph-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="ph-h2">This week vs last week</h2>
          <span className="text-xs text-ph-muted">By weekday</span>
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
              <Bar dataKey="lastWeek" name="Last week" fill={PH.muted} radius={[4, 4, 0, 0]} />
              <Bar dataKey="thisWeek" name="This week" fill={PH.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
