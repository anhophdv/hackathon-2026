"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/Shell";
import { useHistory } from "@/lib/data/useHistory";
import { buildRecommendations } from "@/lib/forecast/recommendations";
import { useAppStore } from "@/lib/state/store";
import { addDays, ddmm } from "@/lib/utils";
import { SeverityChip } from "@/components/SeverityChip";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { AlertTriangle, ChevronRight, Bell } from "lucide-react";
import Link from "next/link";
import { useT } from "@/lib/i18n/useT";

export default function AlertsPage() {
  const history = useHistory();
  const whatIf = useAppStore((s) => s.whatIf);
  const [sev, setSev] = useState<"all" | "high" | "med" | "low">("all");
  const { t } = useT();

  const allRecs = useMemo(() => {
    const out: Array<{
      date: Date;
      r: ReturnType<typeof buildRecommendations>["recs"][number];
    }> = [];
    for (let d = 0; d < 3; d++) {
      const target = addDays(history.endDate, d);
      const b = buildRecommendations(history, target, whatIf);
      for (const r of b.recs) out.push({ date: target, r });
    }
    return out;
  }, [history, whatIf]);

  const filtered = sev === "all" ? allRecs : allRecs.filter((x) => x.r.severity === sev);

  const labelFor = (key: "all" | "high" | "med" | "low") =>
    key === "all" ? t("common.all") : t(`severity.${key}`);

  return (
    <>
      <PageHeader
        title={t("page.alerts.title")}
        subtitle={t("page.alerts.subtitle")}
        right={
          <span className="ph-chip-muted">
            <Bell className="h-3 w-3" />{" "}
            {t("page.alerts.active", { n: allRecs.length })}
          </span>
        }
      />

      <div className="ph-card p-3 mb-5 flex flex-wrap gap-2">
        {(["all", "high", "med", "low"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSev(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase ${
              sev === s
                ? s === "high"
                  ? "bg-ph-red text-white"
                  : s === "med"
                    ? "bg-ph-amber text-white"
                    : s === "low"
                      ? "bg-ph-green text-white"
                      : "bg-ph-black text-white"
                : "bg-ph-line text-ph-ink"
            }`}
          >
            {labelFor(s)} (
            {s === "all"
              ? allRecs.length
              : allRecs.filter((x) => x.r.severity === s).length}
            )
          </button>
        ))}
      </div>

      <div className="ph-card overflow-hidden">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-ph-muted">
            {t("page.alerts.empty")}
          </div>
        )}
        {filtered.map(({ date, r }) => (
          <Link
            key={`${date.toISOString()}_${r.id}`}
            href="/recommendations"
            className="flex items-center gap-3 px-4 py-3 border-b border-ph-line hover:bg-ph-surface transition group"
          >
            <AlertTriangle
              className={`h-5 w-5 shrink-0 ${
                r.severity === "high"
                  ? "text-ph-red"
                  : r.severity === "med"
                    ? "text-ph-amber"
                    : "text-ph-green"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <SeverityChip severity={r.severity} />
                <span className="ph-chip-muted">{t(`category.${r.category}`)}</span>
                <FreshnessBadge mins={r.freshnessMins} />
                <span className="text-[11px] text-ph-muted">
                  {t("page.alerts.for_date", { date: ddmm(date) })}
                </span>
              </div>
              <div className="font-semibold text-sm text-ph-black truncate">
                {r.title}
              </div>
              <div className="text-xs text-ph-muted truncate">{r.whyItMatters}</div>
            </div>
            <span className="text-[11px] text-ph-muted hidden md:block">
              {t("page.alerts.conf", { n: Math.round(r.confidence * 100) })}
            </span>
            <ChevronRight className="h-4 w-4 text-ph-muted group-hover:text-ph-red" />
          </Link>
        ))}
      </div>
    </>
  );
}
