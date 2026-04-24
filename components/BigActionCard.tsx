"use client";

import { Recommendation } from "@/lib/forecast/recommendations";
import { SeverityChip } from "./SeverityChip";
import {
  Clock4,
  MessageCircleQuestion,
  Package,
  Pizza,
  Sparkles,
  Target,
  Users,
  Utensils,
  TrendingDown,
  CheckCircle2,
  PlusCircle,
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

// Numbered, outsize "action card" used on Today's Plan to mirror the PDF's
// "Prepare 120 units of Item A (+25%)" style.
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
  const [showWhy, setShowWhy] = useState(false);
  const firstStep = rec.steps[0];
  const { t } = useT();

  return (
    <div className="ph-card p-5 md:p-6 flex flex-col gap-4 relative overflow-hidden">
      <div className="absolute -top-3 -left-3 h-16 w-16 rounded-full bg-ph-red text-white flex items-center justify-center font-extrabold text-[28px] shadow-pop">
        {index}
      </div>
      <div className="pl-12 flex items-start gap-3">
        <div className="rounded-xl bg-ph-red/10 text-ph-red p-2">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <SeverityChip severity={rec.severity} />
            <span className="ph-chip-muted">{t(`category.${rec.category}`)}</span>
            <span className="text-[11px] text-ph-muted ml-auto">
              {t("rec.confidence", { pct: Math.round(rec.confidence * 100) })}
            </span>
          </div>
          <h3 className="text-[17px] md:text-xl font-extrabold text-ph-black leading-tight">
            {rec.title}
          </h3>
          {firstStep && (
            <p className="text-sm text-ph-muted mt-1.5 flex items-center gap-1.5">
              <Clock4 className="h-3.5 w-3.5" />
              <span className="font-semibold text-ph-ink">
                {t("common.by_time", { time: firstStep.at })}
              </span>
              {" · "}
              {t("common.owner")} {t(`owner.${firstStep.owner ?? "Manager"}`)}
            </p>
          )}
        </div>
      </div>

      <div className="pl-12 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowWhy((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ph-red hover:underline"
        >
          <MessageCircleQuestion className="h-4 w-4" />
          {showWhy ? t("rec.hide_why") : t("rec.why")}
        </button>
        <button
          onClick={() => addTask(rec)}
          disabled={created}
          className={cn(
            "ph-btn-primary ml-auto",
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

      {showWhy && (
        <div className="pl-12 grid md:grid-cols-2 gap-3 border-t border-ph-line pt-3">
          <div>
            <div className="ph-label mb-1">{t("rec.why_matters")}</div>
            <p className="text-sm text-ph-ink">{rec.whyItMatters}</p>
          </div>
          <div>
            <div className="ph-label mb-1">{t("rec.drivers")}</div>
            <ul className="text-sm text-ph-ink space-y-1">
              {rec.drivers.slice(0, 4).map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-ph-red shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <div className="ph-label mb-1">{t("rec.plan")}</div>
            <ol className="space-y-1.5">
              {rec.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="bg-ph-black text-white font-bold text-[11px] rounded-md px-1.5 py-0.5 mt-0.5">
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
                    <span className="ph-chip-muted">{t(`owner.${s.owner}`)}</span>
                  )}
                </li>
              ))}
            </ol>
            <p className="text-xs text-ph-muted mt-2 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-ph-green" />
              <span className="font-semibold text-ph-green">{t("rec.impact")}</span>{" "}
              {rec.expectedImpact}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
