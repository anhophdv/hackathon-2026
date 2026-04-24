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

// Compact, horizontally-stacked action card used on Today's Plan.
// Collapsed by default so three cards fit side-by-side; click anywhere
// on the card (except the Assign button) to reveal the full reasoning:
// WHY · BASED ON · IMPACT IF YOU ACT · WHAT TO DO.
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
  const [expanded, setExpanded] = useState(false);
  const { t } = useT();

  const firstStep = rec.steps[0];

  const severityAccent =
    rec.severity === "high"
      ? "border-l-ph-red"
      : rec.severity === "med"
      ? "border-l-ph-amber"
      : "border-l-ph-green";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={() => setExpanded((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExpanded((v) => !v);
        }
      }}
      className={cn(
        "ph-card p-3 md:p-4 flex flex-col gap-2.5 relative border-l-[5px] cursor-pointer transition hover:shadow-pop focus:outline-none focus:ring-2 focus:ring-ph-red/40",
        severityAccent,
      )}
    >
      {/* ---------- Header row: number + severity + confidence ---------- */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 h-10 w-10 md:h-11 md:w-11 rounded-xl bg-ph-red text-white flex items-center justify-center font-extrabold text-[20px] md:text-[22px] shadow-pop">
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <SeverityChip severity={rec.severity} />
            <span className="ph-chip-muted">
              <Icon className="h-3 w-3" />
              {t(`category.${rec.category}`)}
            </span>
            <span className="text-[10px] text-ph-muted ml-auto whitespace-nowrap">
              {t("rec.confidence", { pct: Math.round(rec.confidence * 100) })}
            </span>
          </div>
          <h3 className="text-[15px] md:text-base font-extrabold text-ph-black leading-snug">
            {rec.title}
          </h3>
          {firstStep && (
            <p className="text-[12px] text-ph-muted mt-1 flex items-center gap-1 flex-wrap">
              <Clock4 className="h-3 w-3" />
              <span className="font-semibold text-ph-ink">
                {t("common.by_time", { time: firstStep.at })}
              </span>
              <span className="text-ph-line">·</span>
              <span>{t(`owner.${firstStep.owner ?? "Manager"}`)}</span>
            </p>
          )}
        </div>
      </div>

      {/* ---------- Short why (always visible, one-liner) ---------- */}
      {!expanded && (
        <p className="text-[13px] text-ph-ink/90 leading-snug line-clamp-2">
          <span className="font-semibold text-ph-red">
            {t("rec.why_short")}
          </span>{" "}
          {rec.whyItMatters}
        </p>
      )}

      {/* ---------- Expanded content ---------- */}
      {expanded && (
        <div className="flex flex-col gap-2.5">
          {/* WHY */}
          <div className="rounded-lg bg-ph-red/5 border border-ph-red/15 p-2.5">
            <div className="flex items-center gap-1 mb-1">
              <AlertOctagon className="h-3 w-3 text-ph-red" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-ph-red">
                {t("rec.why_matters")}
              </span>
            </div>
            <p className="text-[13px] text-ph-ink leading-snug">
              {rec.whyItMatters}
            </p>
          </div>

          {/* BASED ON */}
          <div className="rounded-lg border border-ph-line p-2.5 bg-ph-surface/60">
            <div className="flex items-center gap-1 mb-1">
              <Lightbulb className="h-3 w-3 text-ph-amber" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-ph-ink">
                {t("rec.based_on")}
              </span>
            </div>
            <ul className="text-[13px] text-ph-ink space-y-0.5">
              {rec.drivers.slice(0, 3).map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-ph-red shrink-0" />
                  <span className="leading-snug">{d}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* IMPACT IF YOU ACT */}
          <div className="rounded-lg border border-ph-green/30 p-2.5 bg-ph-green/5">
            <div className="flex items-center gap-1 mb-1">
              <Target className="h-3 w-3 text-ph-green" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-ph-green">
                {t("rec.impact_if_act")}
              </span>
            </div>
            <p className="text-[13px] text-ph-ink leading-snug">
              {rec.expectedImpact}
            </p>
          </div>

          {/* WHAT TO DO */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <ListChecks className="h-3 w-3 text-ph-ink" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-ph-ink">
                {t("rec.what_to_do")}
              </span>
            </div>
            <ol className="space-y-1">
              {rec.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px]">
                  <span className="bg-ph-black text-white font-bold text-[10px] rounded px-1 py-0.5 mt-0.5 shrink-0">
                    {s.at}
                  </span>
                  <span className="flex-1 text-ph-ink leading-snug">
                    {s.do}
                    {s.qty != null && (
                      <span className="ml-1.5 inline-flex items-center px-1 py-0.5 text-[10px] font-bold rounded bg-ph-yellow/40 text-ph-black">
                        {s.qty} {s.unit ?? ""}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* ---------- Footer: expand indicator + Assign ---------- */}
      <div className="flex items-center justify-between gap-2 pt-1.5 mt-auto border-t border-ph-line">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ph-red">
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> {t("rec.collapse")}
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> {t("rec.expand")}
            </>
          )}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!created) addTask(rec);
          }}
          disabled={created}
          className={cn(
            "ph-btn-primary !px-3 !py-1.5 text-xs",
            created && "opacity-60 cursor-not-allowed",
          )}
        >
          {created ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" /> {t("rec.assigned")}
            </>
          ) : (
            <>
              <PlusCircle className="h-3.5 w-3.5" /> {t("rec.assign")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
