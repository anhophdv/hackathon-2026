"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/Shell";
import { useHistory } from "@/lib/data/useHistory";
import { buildRecommendations, Recommendation } from "@/lib/forecast/recommendations";
import { useAppStore } from "@/lib/state/store";
import { addDays, ddmm } from "@/lib/utils";
import { RecommendationCard } from "@/components/RecommendationCard";

const CATEGORIES: Recommendation["category"][] = [
  "Inventory",
  "Prep",
  "Labor",
  "Capacity",
  "Promo",
  "Service",
  "Waste",
];

export default function RecommendationsPage() {
  const history = useHistory();
  const whatIf = useAppStore((s) => s.whatIf);
  const [dayOffset, setDayOffset] = useState(1);
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set(CATEGORIES));
  const [activeSev, setActiveSev] = useState<Set<string>>(
    new Set(["high", "med", "low"]),
  );

  const target = addDays(history.endDate, dayOffset);
  const bundle = useMemo(
    () => buildRecommendations(history, target, whatIf),
    [history, target, whatIf],
  );

  const filtered = bundle.recs.filter(
    (r) => activeCats.has(r.category) && activeSev.has(r.severity),
  );

  const toggle = (set: Set<string>, key: string, setter: (v: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  return (
    <>
      <PageHeader
        title="Recommendations"
        subtitle="Each recommendation explains why it matters, the drivers behind it, and a concrete plan with owners, times and quantities. One click turns it into a tracked task."
        right={
          <div className="ph-card p-1 flex">
            {[0, 1, 2, 3].map((d) => (
              <button
                key={d}
                onClick={() => setDayOffset(d)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                  dayOffset === d ? "bg-ph-red text-white" : "text-ph-ink hover:bg-ph-line"
                }`}
              >
                {d === 0 ? "Today" : d === 1 ? "Tomorrow" : ddmm(addDays(history.endDate, d))}
              </button>
            ))}
          </div>
        }
      />

      <div className="ph-card p-3 mb-5 flex flex-wrap items-center gap-2">
        <span className="ph-label mr-1">Severity:</span>
        {(["high", "med", "low"] as const).map((s) => (
          <button
            key={s}
            onClick={() => toggle(activeSev, s, setActiveSev)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
              activeSev.has(s)
                ? s === "high"
                  ? "bg-ph-red text-white"
                  : s === "med"
                    ? "bg-ph-amber text-white"
                    : "bg-ph-green text-white"
                : "bg-ph-line text-ph-muted"
            }`}
          >
            {s}
          </button>
        ))}
        <span className="ph-label ml-4 mr-1">Category:</span>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => toggle(activeCats, c, setActiveCats)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
              activeCats.has(c)
                ? "bg-ph-black text-white"
                : "bg-ph-line text-ph-muted"
            }`}
          >
            {c}
          </button>
        ))}
        <span className="ml-auto text-xs text-ph-muted">
          Showing {filtered.length} of {bundle.recs.length}
        </span>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="ph-card p-10 text-center text-ph-muted">
            No recommendations match the current filters.
          </div>
        )}
        {filtered.map((r) => (
          <RecommendationCard key={r.id} rec={r} />
        ))}
      </div>
    </>
  );
}
