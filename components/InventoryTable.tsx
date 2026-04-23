"use client";

import { IngredientNeed } from "@/lib/forecast/inventory";
import { formatGBP, formatNumber } from "@/lib/utils";
import { Package, AlertTriangle, CheckCircle2 } from "lucide-react";

const RISK_TONE: Record<IngredientNeed["riskLevel"], string> = {
  high: "bg-ph-red/10 text-ph-red",
  med: "bg-ph-amber/15 text-ph-amber",
  low: "bg-ph-yellow/30 text-ph-black",
  ok: "bg-ph-green/10 text-ph-green",
};

export function InventoryTable({ rows }: { rows: IngredientNeed[] }) {
  return (
    <div className="ph-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ph-surface text-ph-muted">
            <tr className="text-left">
              <th className="px-4 py-2 font-semibold">Ingredient</th>
              <th className="px-3 py-2 font-semibold text-right">Required</th>
              <th className="px-3 py-2 font-semibold text-right">On hand</th>
              <th className="px-3 py-2 font-semibold text-right">Shortfall</th>
              <th className="px-3 py-2 font-semibold text-right">Order (packs)</th>
              <th className="px-3 py-2 font-semibold text-right">Est. cost</th>
              <th className="px-3 py-2 font-semibold">Cutoff</th>
              <th className="px-3 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-ph-line">
                <td className="px-4 py-2.5 font-semibold text-ph-black">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-ph-muted" />
                    {r.label}
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
                  {String(r.cutoffHour).padStart(2, "0")}:00 · LT {r.leadTimeHrs}h
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
                    {r.riskLevel === "ok" ? "Healthy" : `${r.riskLevel.toUpperCase()} risk`}
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
