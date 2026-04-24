"use client";

import { StockoutEvent, TimelineBucket } from "@/lib/forecast/timeline";
import { CHART, PH } from "@/lib/theme/tokens";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { AlertTriangle, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/useT";

// Hour-by-hour demand with stockout markers — makes "Risk at 12:45 PM" tangible.
export function StockoutTimeline({
  buckets,
  stockouts,
  defaultExpanded = true,
}: {
  buckets: TimelineBucket[];
  stockouts: StockoutEvent[];
  defaultExpanded?: boolean;
}) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const data = buckets.map((b) => ({
    hour: b.clock.replace(":00 ", " "),
    raw: b.hour,
    orders: Math.round(b.orders),
    stockout: b.stockouts.length > 0 ? Math.round(b.orders) : 0,
  }));

  return (
    <div className="ph-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={t(
          expanded ? "timeline.collapse" : "timeline.expand",
        )}
        className="w-full text-left p-4 pr-12 flex items-center justify-between flex-wrap gap-2 hover:bg-ph-surface/50 transition relative"
      >
        <div>
          <h3 className="ph-h2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-ph-red" />
            {t("timeline.title")}
          </h3>
          <p className="text-xs text-ph-muted mt-0.5">
            {t("timeline.caption")}
          </p>
        </div>
        <span className="ph-chip-muted">
          {t(
            stockouts.length === 1
              ? "timeline.risk_count_one"
              : "timeline.risk_count_other",
            { n: stockouts.length },
          )}
        </span>
        <span
          aria-hidden="true"
          className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-ph-line bg-white text-ph-ink shadow-sm"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-ph-line pt-3">
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={data} barCategoryGap={4}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis
                  dataKey="hour"
                  fontSize={10}
                  stroke={CHART.axis}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis
                  fontSize={10}
                  stroke={CHART.axis}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: `1px solid ${CHART.grid}`,
                    fontSize: 12,
                  }}
                  labelFormatter={(l) => t("timeline.hour_label", { h: l })}
                />
                <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.stockout > 0 ? PH.red : PH.ink} />
                  ))}
                </Bar>
                {stockouts.map((s) => (
                  <ReferenceLine
                    key={s.id}
                    x={data.find((d) => d.raw === s.atHour)?.hour}
                    stroke={PH.red}
                    strokeDasharray="3 3"
                    label={{
                      value: `↓ ${s.label.split(" ")[0]} ${s.clock}`,
                      position: "top",
                      fill: PH.red,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {stockouts.length > 0 && (
            <div className="mt-3 space-y-2">
              {stockouts.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-ph-red/5 border border-ph-red/20"
                >
                  <AlertTriangle className="h-4 w-4 text-ph-red mt-0.5 shrink-0" />
                  <div className="flex-1 text-sm">
                    <div className="font-bold text-ph-black">
                      {t("timeline.runs_out_at", { label: s.label })}{" "}
                      <span className="text-ph-red">{s.clock}</span>
                    </div>
                    <div className="text-xs text-ph-muted mt-0.5">
                      {t("timeline.detail", {
                        onHand: s.onHand,
                        unit: s.unit,
                        burn: s.hourlyBurn,
                        impacts: s.impactedSkus
                          .map((x) => x.name)
                          .slice(0, 2)
                          .join(", "),
                      })}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "ph-chip",
                      s.severity === "high"
                        ? "bg-ph-red text-white"
                        : s.severity === "med"
                          ? "bg-ph-amber/30 text-ph-amber"
                          : "bg-ph-green/10 text-ph-green",
                    )}
                  >
                    {t(`severity.${s.severity}`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
