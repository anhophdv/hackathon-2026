"use client";

import { Recommendation } from "@/lib/forecast/recommendations";
import { SeverityChip } from "./SeverityChip";
import {
  Clock4,
  Package,
  Pizza,
  Sparkles,
  Target,
  Users,
  Utensils,
  TrendingDown,
  CheckCircle2,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertOctagon,
  ListChecks,
} from "lucide-react";
import { useAppStore } from "@/lib/state/store";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/useT";

const CATEGORY_ICON: Record<Recommendation["category"], any> = {
  Inventory: Package,
  Prep: Utensils,
  Labor: Users,
  Capacity: Pizza,
  Promo: Sparkles,
  Service: Target,
  Waste: TrendingDown,
};

// Numbered action card used on Today's Plan. Mirrors the PDF's
// "Prepare 120 units of Item A (+25%)" style — but keeps WHY, DRIVERS and
// EXPECTED IMPACT always visible so the manager can decide in one glance
// (no extra click to understand the reasoning).
export function BigActionCard({
  index,
  rec,
}: {
  index: number;
  rec: Recommendation;
}) {
  const Icon = CATEGORY_ICON[rec.category] ?? Sparkles;
  const addTask = useAppStore((s) => s.addTaskFromRec);
  const created = useAppStore((s) =>
    s.tasks.some((t) => t.source === rec.id && t.status !== "verified"),
  );
  const [showPlan, setShowPlan] = useState(false);
  const { t } = useT();

  const firstStep = rec.steps[0];
  const quickSteps = rec.steps.slice(0, 2);

  const severityAccent =
    rec.severity === "high"
      ? "border-l-ph-red"
      : rec.severity === "med"
      ? "border-l-ph-amber"
      : "border-l-ph-green";

  return (
    <div
      className={cn(
        "ph-card p-5 md:p-6 flex flex-col gap-4 relative overflow-hidden border-l-[6px]",
        severityAccent,
      )}
    >
      {/* ---------- Header: number + action title ---------- */}
      <div className="flex items-start gap-4">
        <div className="shrink-0 h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-ph-red text-white flex items-center justify-center font-extrabold text-[28px] md:text-[32px] shadow-pop">
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <SeverityChip severity={rec.severity} />
            <span className="ph-chip-muted">
              <Icon className="h-3.5 w-3.5" />
              {t(`category.${rec.category}`)}
            </span>
            <span className="text-[11px] text-ph-muted ml-auto">
              {t("rec.confidence", { pct: Math.round(rec.confidence * 100) })}
            </span>
          </div>
          <h3 className="text-[18px] md:text-[22px] font-extrabold text-ph-black leading-tight">
            {rec.title}
          </h3>
          {firstStep && (
            <p className="text-sm text-ph-muted mt-1.5 flex items-center gap-1.5 flex-wrap">
              <Clock4 className="h-3.5 w-3.5" />
              <span className="font-semibold text-ph-ink">
                {t("common.by_time", { time: firstStep.at })}
              </span>
              <span className="text-ph-line">·</span>
              <span>
                {t("common.owner")} {t(`owner.${firstStep.owner ?? "Manager"}`)}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* ---------- Why this action (always visible) ---------- */}
      <div className="rounded-xl bg-ph-red/5 border border-ph-red/15 p-3 md:p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <AlertOctagon className="h-3.5 w-3.5 text-ph-red" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-ph-red">
            {t("rec.why_matters")}
          </span>
        </div>
        <p className="text-sm md:text-[15px] text-ph-ink leading-relaxed">
          {rec.whyItMatters}
        </p>
      </div>

      {/* ---------- Based on + Expected impact (two columns, always visible) ---------- */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-ph-line p-3 md:p-4 bg-ph-surface/60">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-ph-amber" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-ph-ink">
              {t("rec.based_on")}
            </span>
          </div>
          <ul className="text-sm text-ph-ink space-y-1">
            {rec.drivers.slice(0, 3).map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-ph-red shrink-0" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-ph-green/30 p-3 md:p-4 bg-ph-green/5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target className="h-3.5 w-3.5 text-ph-green" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-ph-green">
              {t("rec.impact_if_act")}
            </span>
          </div>
          <p className="text-sm text-ph-ink leading-relaxed">
            {rec.expectedImpact}
          </p>
        </div>
      </div>

      {/* ---------- Quick plan preview (first 2 steps, always visible) ---------- */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <ListChecks className="h-3.5 w-3.5 text-ph-ink" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-ph-ink">
            {t("rec.what_to_do")}
          </span>
        </div>
        <ol className="space-y-1.5">
          {quickSteps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="bg-ph-black text-white font-bold text-[11px] rounded-md px-1.5 py-0.5 mt-0.5 shrink-0">
                {s.at}
              </span>
              <span className="flex-1 text-ph-ink">
                {s.do}
                {s.qty != null && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[11px] font-bold rounded bg-ph-yellow/40 text-ph-black">
                    {s.qty} {s.unit ?? ""}
                  </span>
                )}
              </span>
              {s.owner && (
                <span className="ph-chip-muted whitespace-nowrap">
                  {t(`owner.${s.owner}`)}
                </span>
              )}
            </li>
          ))}
        </ol>

        {rec.steps.length > 2 && (
          <button
            onClick={() => setShowPlan((v) => !v)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ph-red hover:underline"
          >
            {showPlan ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> {t("rec.hide_plan")}
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />{" "}
                {t("rec.show_plan", {
                  n: rec.steps.length - 2,
                  s: rec.steps.length - 2 === 1 ? "" : "s",
                })}
              </>
            )}
          </button>
        )}

        {showPlan && (
          <ol className="mt-3 space-y-1.5 border-t border-ph-line pt-3">
            {rec.steps.slice(2).map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="bg-ph-black text-white font-bold text-[11px] rounded-md px-1.5 py-0.5 mt-0.5 shrink-0">
                  {s.at}
                </span>
                <span className="flex-1 text-ph-ink">
                  {s.do}
                  {s.qty != null && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[11px] font-bold rounded bg-ph-yellow/40 text-ph-black">
                      {s.qty} {s.unit ?? ""}
                    </span>
                  )}
                </span>
                {s.owner && (
                  <span className="ph-chip-muted whitespace-nowrap">
                    {t(`owner.${s.owner}`)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* ---------- Assign CTA ---------- */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-ph-line">
        <button
          onClick={() => addTask(rec)}
          disabled={created}
          className={cn(
            "ph-btn-primary",
            created && "opacity-60 cursor-not-allowed",
          )}
        >
          {created ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> {t("rec.assigned")}
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" /> {t("rec.assign")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
