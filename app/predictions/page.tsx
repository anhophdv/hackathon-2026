"use client";

import { useMemo, useState } from "react";
import { Calendar, Pizza, Sparkles, Utensils } from "lucide-react";
import { PageHeader } from "@/components/Shell";
import { useHistory } from "@/lib/data/useHistory";
import { forecastNDays } from "@/lib/forecast/engine";
import { buildIngredientPlan, buildPrepPlan } from "@/lib/forecast/inventory";
import { addDays, formatGBP, formatNumber, ddmm } from "@/lib/utils";
import { ForecastChart } from "@/components/ForecastChart";
import { InventoryTable } from "@/components/InventoryTable";
import { KPICard } from "@/components/KPICard";
import { useAppStore } from "@/lib/state/store";
import { promoForDate } from "@/lib/mock/orders";
import { MENU } from "@/lib/mock/menu";
import { useT } from "@/lib/i18n/useT";

export default function PredictionsPage() {
  const history = useHistory();
  const whatIf = useAppStore((s) => s.whatIf);
  const [horizon, setHorizon] = useState<7 | 14>(7);
  const { t, shortWeekday, dateLocale } = useT();

  const start = addDays(history.endDate, 1);

  const forecasts = useMemo(
    () => forecastNDays(history, start, horizon, whatIf),
    [history, start, horizon, whatIf],
  );

  const ingredientPlan = useMemo(
    () => buildIngredientPlan(forecasts),
    [forecasts],
  );

  const prepPlanTomorrow = useMemo(
    () => buildPrepPlan(forecasts[0]),
    [forecasts],
  );

  const totalOrders = forecasts.reduce((s, f) => s + f.p50, 0);
  const totalRevenue = forecasts.reduce((s, f) => s + f.revenue, 0);
  const peakDay = forecasts.reduce((a, b) => (a.p50 > b.p50 ? a : b));

  const chartRows = forecasts.map((f) => ({
    label: `${shortWeekday(f.date)} ${ddmm(f.date)}`,
    predicted: Math.round(f.p50),
    p10: Math.round(f.p10),
    p90: Math.round(f.p90),
    actual: null,
  }));

  const skuTotals: Record<string, number> = {};
  for (const f of forecasts) {
    for (const [k, v] of Object.entries(f.perSku)) {
      skuTotals[k] = (skuTotals[k] ?? 0) + v;
    }
  }
  const topSkus = Object.entries(skuTotals)
    .map(([id, q]) => ({ item: MENU.find((m) => m.id === id)!, q }))
    .filter((r) => r.item)
    .sort((a, b) => b.q - a.q)
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title={t("page.predictions.title")}
        subtitle={t("page.predictions.subtitle")}
        right={
          <div className="ph-card p-1 flex">
            {[7, 14].map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h as 7 | 14)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                  horizon === h
                    ? "bg-ph-red text-white"
                    : "text-ph-ink hover:bg-ph-line"
                }`}
              >
                {t("page.predictions.days", { n: h })}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard
          label={t("page.predictions.kpi_orders", { n: horizon })}
          value={formatNumber(Math.round(totalOrders))}
          deltaSuffix={t("page.predictions.kpi_suffix_forecast")}
          icon={<Pizza className="h-4 w-4" />}
        />
        <KPICard
          label={t("page.predictions.kpi_revenue", { n: horizon })}
          value={formatGBP(totalRevenue)}
          deltaSuffix={t("page.predictions.kpi_suffix_forecast")}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <KPICard
          label={t("page.predictions.kpi_peak")}
          value={peakDay.date.toLocaleDateString(dateLocale, {
            weekday: "short",
            day: "2-digit",
            month: "short",
          })}
          deltaSuffix={t("page.predictions.kpi_peak_sub", {
            n: Math.round(peakDay.p50),
          })}
          tone="warn"
          icon={<Calendar className="h-4 w-4" />}
        />
        <KPICard
          label={t("page.predictions.kpi_promo")}
          value={formatNumber(
            forecasts.filter((f) => promoForDate(f.date).active).length,
          )}
          deltaSuffix={t("page.predictions.kpi_promo_sub")}
          icon={<Sparkles className="h-4 w-4" />}
        />
      </div>

      <section className="ph-card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="ph-h2">
            {t("page.predictions.chart_title", { n: horizon })}
          </h2>
          <span className="text-xs text-ph-muted">
            {t("page.predictions.chart_caption")}
          </span>
        </div>
        <ForecastChart rows={chartRows} unit="orders" showActual={false} height={300} />
      </section>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <section className="lg:col-span-2">
          <h2 className="ph-h2 mb-3">{t("page.predictions.top_skus")}</h2>
          <div className="ph-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ph-surface text-ph-muted">
                <tr className="text-left">
                  <th className="px-4 py-2 font-semibold">
                    {t("page.predictions.col_item")}
                  </th>
                  <th className="px-3 py-2 font-semibold">
                    {t("page.predictions.col_category")}
                  </th>
                  <th className="px-3 py-2 font-semibold text-right">
                    {t("page.predictions.col_qty")}
                  </th>
                  <th className="px-3 py-2 font-semibold text-right">
                    {t("page.predictions.col_revenue")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {topSkus.map((r) => (
                  <tr key={r.item.id} className="border-t border-ph-line">
                    <td className="px-4 py-2.5 font-semibold">{r.item.name}</td>
                    <td className="px-3 py-2.5 text-ph-muted">{r.item.category}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                      {formatNumber(Math.round(r.q))}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatGBP(r.q * r.item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside>
          <h2 className="ph-h2 mb-3">{t("page.predictions.prep_title")}</h2>
          <div className="ph-card p-4 space-y-3">
            {prepPlanTomorrow.length === 0 && (
              <p className="text-sm text-ph-muted">
                {t("page.predictions.prep_empty")}
              </p>
            )}
            {prepPlanTomorrow.map((task) => (
              <div key={task.id} className="flex items-start gap-3">
                <span className="bg-ph-yellow/40 text-ph-black font-bold text-[11px] rounded-md px-1.5 py-0.5 mt-0.5 whitespace-nowrap">
                  {task.at}
                </span>
                <div className="text-sm">
                  <div className="font-semibold flex items-center gap-2">
                    <Utensils className="h-3.5 w-3.5 text-ph-red" />
                    {task.label}
                    <span className="ph-chip-muted">{task.qty} {task.unit}</span>
                  </div>
                  <div className="text-ph-muted text-xs mt-0.5">{task.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="ph-h2">
            {t("page.predictions.supplier_title", { n: horizon })}
          </h2>
          <span className="text-xs text-ph-muted">
            {t("page.predictions.supplier_caption")}
          </span>
        </div>
        <InventoryTable rows={ingredientPlan} />
      </section>
    </>
  );
}
