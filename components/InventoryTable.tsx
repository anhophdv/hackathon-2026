"use client";

import { IngredientNeed } from "@/lib/forecast/inventory";
import { formatGBP, formatNumber } from "@/lib/utils";
import { Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n/useT";

const RISK_TONE: Record<IngredientNeed["riskLevel"], string> = {
  high: "bg-ph-red/10 text-ph-red",
  med: "bg-ph-amber/15 text-ph-amber",
  low: "bg-ph-yellow/30 text-ph-black",
  ok: "bg-ph-green/10 text-ph-green",
};

export function InventoryTable({ rows }: { rows: IngredientNeed[] }) {
  const { t } = useT();
  return (
    <div className="ph-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ph-surface text-ph-muted">
            <tr className="text-left">
              <th className="px-4 py-2 font-semibold">{t("inv.col_ingredient")}</th>
              <th className="px-3 py-2 font-semibold text-right">{t("inv.col_required")}</th>
              <th className="px-3 py-2 font-semibold text-right">{t("inv.col_onhand")}</th>
              <th className="px-3 py-2 font-semibold text-right">{t("inv.col_shortfall")}</th>
              <th className="px-3 py-2 font-semibold text-right">{t("inv.col_packs")}</th>
              <th className="px-3 py-2 font-semibold text-right">{t("inv.col_cost")}</th>
              <th className="px-3 py-2 font-semibold">{t("inv.col_cutoff")}</th>
              <th className="px-3 py-2 font-semibold">{t("inv.col_status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-ph-line">
                <td className="px-4 py-2.5 font-semibold text-ph-black">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-ph-muted" />
                    {t(`ingredient.${r.id}`)}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {formatNumber(r.requiredQty)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {formatNumber(r.onHand)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                  {r.shortfall > 0 ? (
                    <span className="text-ph-red">{formatNumber(r.shortfall)}</span>
                  ) : (
                    <span className="text-ph-muted">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {r.packsToOrder > 0
                    ? `${r.packsToOrder} × ${r.packSize} ${r.unit}`
                    : "—"}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {r.estCost > 0 ? formatGBP(r.estCost) : "—"}
                </td>
                <td className="px-3 py-2.5 text-ph-ink">
                  {t("inv.cutoff_line", {
                    hour: String(r.cutoffHour).padStart(2, "0"),
                    lead: r.leadTimeHrs,
                  })}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${RISK_TONE[r.riskLevel]}`}
                  >
                    {r.riskLevel === "ok" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {r.riskLevel === "ok"
                      ? t("inv.status_healthy")
                      : t("inv.status_risk", {
                          level: t(`severity.${r.riskLevel}`),
                        })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
