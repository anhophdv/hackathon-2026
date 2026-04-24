"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/Shell";
import { WhatIfPanel } from "@/components/WhatIfPanel";
import { useHistory } from "@/lib/data/useHistory";
import { useAppStore } from "@/lib/state/store";
import { addDays, formatGBP, formatNumber, ddmm } from "@/lib/utils";
import { forecastDay, DEFAULT_WHATIF } from "@/lib/forecast/engine";
import { buildIngredientPlan } from "@/lib/forecast/inventory";
import { ForecastChart } from "@/components/ForecastChart";
import { KPICard } from "@/components/KPICard";
import { ArrowRight, ListChecks, Pizza, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useT } from "@/lib/i18n/useT";

export default function WhatIfPage() {
  const history = useHistory();
  const whatIf = useAppStore((s) => s.whatIf);
  const { t, shortWeekday } = useT();

  const targets = Array.from({ length: 7 }, (_, i) => addDays(history.endDate, i + 1));

  const baseline = useMemo(
    () =>
      targets.map((d) =>
        forecastDay({ history, date: d, whatIf: DEFAULT_WHATIF }),
      ),
    [history, targets],
  );
  const scenario = useMemo(
    () => targets.map((d) => forecastDay({ history, date: d, whatIf })),
    [history, targets, whatIf],
  );

  const baseTotalOrders = baseline.reduce((s, f) => s + f.p50, 0);
  const scenTotalOrders = scenario.reduce((s, f) => s + f.p50, 0);
  const baseTotalRev = baseline.reduce((s, f) => s + f.revenue, 0);
  const scenTotalRev = scenario.reduce((s, f) => s + f.revenue, 0);

  const orderUplift = ((scenTotalOrders - baseTotalOrders) / baseTotalOrders) * 100;
  const revUplift = ((scenTotalRev - baseTotalRev) / baseTotalRev) * 100;

  const chartRows = scenario.map((f, i) => ({
    label: `${shortWeekday(f.date)} ${ddmm(f.date)}`,
    predicted: Math.round(f.p50),
    p10: Math.round(f.p10),
    p90: Math.round(f.p90),
    actual: Math.round(baseline[i].p50),
  }));

  const ingredientPlan = useMemo(
    () => buildIngredientPlan(scenario).slice(0, 6),
    [scenario],
  );

  const driverHighlights = scenario[0]?.drivers.filter((d) => d.delta !== 0) ?? [];

  return (
    <>
      <PageHeader
        title={t("page.whatif.title")}
        subtitle={t("page.whatif.subtitle")}
      />

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <WhatIfPanel />

        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard
              label={t("page.whatif.kpi_orders")}
              value={formatNumber(Math.round(scenTotalOrders))}
              delta={orderUplift}
              deltaSuffix={t("page.whatif.kpi_vs_baseline")}
              icon={<Pizza className="h-4 w-4" />}
            />
            <KPICard
              label={t("page.whatif.kpi_revenue")}
              value={formatGBP(scenTotalRev)}
              delta={revUplift}
              deltaSuffix={t("page.whatif.kpi_vs_baseline")}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <KPICard
              label={t("page.whatif.kpi_peak")}
              value={formatNumber(Math.round(Math.max(...scenario.map((f) => f.p50))))}
              deltaSuffix={t("page.whatif.kpi_peak_sub")}
              icon={<Sparkles className="h-4 w-4" />}
              tone="warn"
            />
            <KPICard
              label={t("page.whatif.kpi_risk")}
              value={formatNumber(ingredientPlan.filter((i) => i.shortfall > 0).length)}
              deltaSuffix={t("page.whatif.kpi_risk_sub")}
              icon={<ListChecks className="h-4 w-4" />}
            />
          </div>

          <section className="ph-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="ph-h2">{t("page.whatif.scenario_title")}</h2>
              <Link href="/recommendations" className="text-sm font-semibold text-ph-red hover:underline inline-flex items-center gap-1">
                {t("page.whatif.scenario_link")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ForecastChart rows={chartRows} unit="orders" />
            <p className="text-xs text-ph-muted mt-2">
              {t("page.whatif.scenario_legend")}
            </p>
          </section>

          <section className="ph-card p-5">
            <h2 className="ph-h2 mb-3">{t("page.whatif.drivers_title")}</h2>
            {driverHighlights.length === 0 ? (
              <p className="text-sm text-ph-muted">
                {t("page.whatif.drivers_empty")}
              </p>
            ) : (
              <ul className="space-y-2">
                {driverHighlights.map((d, i) => (
                  <li key={i} className="flex items-center gap-3 bg-ph-surface rounded-xl px-3 py-2">
                    <span className="ph-chip-muted">{d.kind}</span>
                    <span className="text-sm flex-1">{d.label}</span>
                    <span
                      className={`font-bold text-sm ${d.delta > 0 ? "text-ph-green" : "text-ph-red"}`}
                    >
                      {d.delta > 0 ? "+" : ""}
                      {(d.delta * 100).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="ph-h2 mb-3">{t("page.whatif.ingredients_title")}</h2>
            <div className="ph-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-ph-surface text-ph-muted">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-semibold">
                      {t("page.whatif.col_ingredient")}
                    </th>
                    <th className="px-3 py-2 font-semibold text-right">
                      {t("page.whatif.col_required")}
                    </th>
                    <th className="px-3 py-2 font-semibold text-right">
                      {t("page.whatif.col_onhand")}
                    </th>
                    <th className="px-3 py-2 font-semibold text-right">
                      {t("page.whatif.col_packs")}
                    </th>
                    <th className="px-3 py-2 font-semibold text-right">
                      {t("page.whatif.col_cost")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ingredientPlan.map((r) => (
                    <tr key={r.id} className="border-t border-ph-line">
                      <td className="px-4 py-2.5 font-semibold">
                        {t(`ingredient.${r.id}`)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatNumber(r.requiredQty)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatNumber(r.onHand)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {r.packsToOrder > 0 ? r.packsToOrder : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {r.estCost > 0 ? formatGBP(r.estCost) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
