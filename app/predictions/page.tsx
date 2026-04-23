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

export default function PredictionsPage() {
  const history = useHistory();
  const whatIf = useAppStore((s) => s.whatIf);
  const [horizon, setHorizon] = useState<7 | 14>(7);

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

  const chartRows = forecasts.map((f, i) => {
    // attempt to overlay actual if a future day already exists in history (won't, but kept for symmetry)
    return {
      label: `${f.date.toLocaleDateString("en-GB", { weekday: "short" })} ${ddmm(f.date)}`,
      predicted: Math.round(f.p50),
      p10: Math.round(f.p10),
      p90: Math.round(f.p90),
      actual: null,
    };
  });

  // Top SKUs by forecast quantity for the horizon
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
        title="Predictions & Inventory"
        subtitle="Demand forecast for the next 7 days, exploded into a concrete prep plan and supplier order — every quantity tied to forecasted SKU mix."
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
                {h} days
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard
          label={`${horizon}-day orders`}
          value={formatNumber(Math.round(totalOrders))}
          deltaSuffix="forecast"
          icon={<Pizza className="h-4 w-4" />}
        />
        <KPICard
          label={`${horizon}-day revenue`}
          value={formatGBP(totalRevenue)}
          deltaSuffix="forecast"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <KPICard
          label="Peak day"
          value={peakDay.date.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}
          deltaSuffix={`${Math.round(peakDay.p50)} orders`}
          tone="warn"
          icon={<Calendar className="h-4 w-4" />}
        />
        <KPICard
          label="Promo days in window"
          value={formatNumber(forecasts.filter((f) => promoForDate(f.date).active).length)}
          deltaSuffix="weekend + Tuesday"
          icon={<Sparkles className="h-4 w-4" />}
        />
      </div>

      <section className="ph-card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="ph-h2">Forecast — next {horizon} days</h2>
          <span className="text-xs text-ph-muted">Predicted orders with P10–P90 confidence band</span>
        </div>
        <ForecastChart rows={chartRows} unit="orders" showActual={false} height={300} />
      </section>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <section className="lg:col-span-2">
          <h2 className="ph-h2 mb-3">Top SKUs in window</h2>
          <div className="ph-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ph-surface text-ph-muted">
                <tr className="text-left">
                  <th className="px-4 py-2 font-semibold">Menu item</th>
                  <th className="px-3 py-2 font-semibold">Category</th>
                  <th className="px-3 py-2 font-semibold text-right">Forecast qty</th>
                  <th className="px-3 py-2 font-semibold text-right">Est. revenue</th>
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
          <h2 className="ph-h2 mb-3">Tomorrow's prep plan</h2>
          <div className="ph-card p-4 space-y-3">
            {prepPlanTomorrow.length === 0 && (
              <p className="text-sm text-ph-muted">No pre-prep needed.</p>
            )}
            {prepPlanTomorrow.map((t) => (
              <div key={t.id} className="flex items-start gap-3">
                <span className="bg-ph-yellow/40 text-ph-black font-bold text-[11px] rounded-md px-1.5 py-0.5 mt-0.5 whitespace-nowrap">
                  {t.doBy.replace("before ", "")}
                </span>
                <div className="text-sm">
                  <div className="font-semibold flex items-center gap-2">
                    <Utensils className="h-3.5 w-3.5 text-ph-red" />
                    {t.label}
                    <span className="ph-chip-muted">{t.qty} {t.unit}</span>
                  </div>
                  <div className="text-ph-muted text-xs mt-0.5">{t.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="ph-h2">Recommended supplier order ({horizon} days)</h2>
          <span className="text-xs text-ph-muted">
            Includes 10% safety stock · sorted by stockout risk
          </span>
        </div>
        <InventoryTable rows={ingredientPlan} />
      </section>
    </>
  );
}
