"use client";

import { Recommendation } from "@/lib/forecast/recommendations";
import { SeverityChip } from "./SeverityChip";
import { FreshnessBadge } from "./FreshnessBadge";
import {
  CheckCircle2,
  Clock4,
  Lightbulb,
  Package,
  Pizza,
  Sparkles,
  Target,
  Users,
  Utensils,
  Truck,
  TrendingDown,
  PlusCircle,
} from "lucide-react";
import { useAppStore } from "@/lib/state/store";
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

export function RecommendationCard({
  rec,
  compact = false,
}: {
  rec: Recommendation;
  compact?: boolean;
}) {
  const Icon = CATEGORY_ICON[rec.category] ?? Lightbulb;
  const addTask = useAppStore((s) => s.addTaskFromRec);
  const created = useAppStore((s) =>
    s.tasks.some((t) => t.source === rec.id && t.status !== "verified"),
  );
  const { t } = useT();

  return (
    <div className="ph-card p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-ph-red/10 text-ph-red p-2">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <SeverityChip severity={rec.severity} />
            <span className="ph-chip-muted">{t(`category.${rec.category}`)}</span>
            <FreshnessBadge mins={rec.freshnessMins} />
            <span className="text-[11px] text-ph-muted ml-auto">
              {t("rec.confidence", { pct: Math.round(rec.confidence * 100) })}
            </span>
          </div>
          <h3 className="font-bold text-[15px] text-ph-black leading-snug">
            {rec.title}
          </h3>
        </div>
      </div>

      {!compact && (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="ph-label mb-1.5">{t("rec.why_matters")}</div>
              <p className="text-sm text-ph-ink">{rec.whyItMatters}</p>
            </div>
            <div>
              <div className="ph-label mb-1.5">{t("rec.drivers")}</div>
              <ul className="text-sm text-ph-ink space-y-1">
                {rec.drivers.slice(0, 5).map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-ph-red shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <div className="ph-label mb-1.5">{t("rec.plan")}</div>
            <ol className="space-y-2">
              {rec.steps.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 bg-ph-surface rounded-xl px-3 py-2.5"
                >
                  <span className="bg-ph-black text-white font-bold text-[11px] rounded-md px-1.5 py-0.5 mt-0.5">
                    {s.at}
                  </span>
                  <div className="flex-1 text-sm text-ph-ink">
                    {s.do}
                    {s.qty != null && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[11px] font-bold rounded bg-ph-yellow/40 text-ph-black">
                        {s.qty} {s.unit ?? ""}
                      </span>
                    )}
                  </div>
                  {s.owner && (
                    <span className="ph-chip-muted whitespace-nowrap">
                      {t(`owner.${s.owner}`)}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-ph-line">
            <div className="flex items-center gap-2 text-sm text-ph-ink">
              <Target className="h-4 w-4 text-ph-green" />
              <span className="font-semibold">{t("rec.impact")}</span>
              <span>{rec.expectedImpact}</span>
            </div>
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
                  <CheckCircle2 className="h-4 w-4" /> {t("rec.task_created")}
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" /> {t("rec.assign")}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
