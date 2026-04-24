"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock4,
  Flame,
  MinusCircle,
  PlusCircle,
  Sparkles,
  Truck,
  Users,
  Wand2,
} from "lucide-react";
import { useState } from "react";

import { Role } from "@/lib/mock/labor";
import {
  BOARD_ROLES,
  OPEN_HOURS,
  ShiftAdjustment,
  ShiftCell,
  ShiftMove,
  ShiftPlan,
  StationSummary,
} from "@/lib/forecast/shifts";
import { cn, formatGBP } from "@/lib/utils";
import { useT } from "@/lib/i18n/useT";

const ROLE_ICON: Record<Role, any> = {
  Manager: ClipboardCheck,
  "Shift Lead": ClipboardCheck,
  "Make Line": ChefHat,
  Oven: Flame,
  Driver: Truck,
  Front: Users,
};

const HEADCOUNT_ROLES: Role[] = ["Shift Lead", "Front", "Manager"];

// "5:00 PM" style labels for clarity in reasons and card chips.
function clockLabel(h: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hh}:00 ${period}`;
}

// Two-line label for the compact heatmap column header, e.g.
// { top: "5:00", period: "PM" }. Keeps the grid readable.
function clockParts(h: number): { top: string; period: string } {
  const period = h >= 12 ? "PM" : "AM";
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { top: `${hh}:00`, period };
}

function timeRangeLabel(from: number, to: number): string {
  return `${clockLabel(from)} – ${clockLabel(to)}`;
}

export function ShiftBoard({
  plan,
  weekday,
  defaultExpanded = false,
}: {
  plan: ShiftPlan;
  weekday: string;
  defaultExpanded?: boolean;
}) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { cells, adjustments, moves, stations, totals } = plan;

  const cellByKey = new Map(
    cells.map((c) => [`${c.role}_${c.hour}`, c] as const),
  );
  const inServiceCount = cells.filter((c) => c.fit !== "off").length;
  const matchCount = cells.filter((c) => c.fit === "match").length;
  const highSevCount = adjustments.filter((a) => a.severity === "high").length;

  return (
    <div className="ph-card overflow-hidden">
      {/* ---------- Header (always visible, click to toggle) ---------- */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={t(
          expanded
            ? "page.today.shifts.collapse"
            : "page.today.shifts.expand",
        )}
        className="w-full text-left p-4 md:p-6 pr-12 md:pr-14 flex items-start justify-between gap-3 flex-wrap hover:bg-ph-surface/50 transition relative"
      >
        <div>
          <h3 className="ph-h2 flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-ph-red" />
            {t("page.today.shifts.title")}
          </h3>
          <p className="text-xs text-ph-muted mt-0.5 max-w-xl">
            {t("page.today.shifts.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="ph-chip-red">
            <Sparkles className="h-3 w-3" />
            {t("page.today.shifts.chip_forecast")}
          </span>
          <span className="ph-chip-muted">
            <Clock4 className="h-3 w-3" />
            {t("page.today.shifts.chip_history", { weekday })}
          </span>
        </div>
        <span
          aria-hidden="true"
          className="absolute top-3 right-3 md:top-4 md:right-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-ph-line bg-white text-ph-ink shadow-sm"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </button>

      {/* ---------- Collapsed summary bar ---------- */}
      {!expanded && (
        <div className="px-4 md:px-6 pb-4 md:pb-5 flex flex-wrap items-center gap-2 border-t border-ph-line pt-3">
          <MiniStat
            tone={totals.alignmentPct >= 80 ? "green" : "amber"}
            label={t("page.today.shifts.mini_alignment")}
            value={`${totals.alignmentPct}%`}
          />
          <MiniStat
            tone={totals.shortHours > 0 ? "red" : "muted"}
            label={t("page.today.shifts.mini_short")}
            value={`${totals.shortHours}h`}
          />
          <MiniStat
            tone={totals.overHours > 0 ? "amber" : "muted"}
            label={t("page.today.shifts.mini_over")}
            value={`${totals.overHours}h`}
          />
          <MiniStat
            tone="green"
            label={t("page.today.shifts.mini_savings")}
            value={formatGBP(totals.savingsEstimate)}
          />
          <MiniStat
            tone={highSevCount > 0 ? "red" : "muted"}
            label={t("page.today.shifts.mini_adjustments")}
            value={`${adjustments.length}`}
          />
          <span className="text-[11px] text-ph-muted ml-auto italic">
            {t("page.today.shifts.mini_hint")}
          </span>
        </div>
      )}

      {/* ---------- Expanded body ---------- */}
      {expanded && (
        <div className="px-4 md:px-6 pb-4 md:pb-6 border-t border-ph-line pt-4">

      {/* ---------- Summary pills ---------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <SummaryPill
          icon={<CheckCircle2 className="h-4 w-4" />}
          label={t("page.today.shifts.summary_alignment")}
          value={`${totals.alignmentPct}%`}
          sub={t("page.today.shifts.summary_alignment_sub", {
            matches: matchCount,
            total: inServiceCount,
          })}
          tone={totals.alignmentPct >= 80 ? "green" : "amber"}
        />
        <SummaryPill
          icon={<PlusCircle className="h-4 w-4" />}
          label={t("page.today.shifts.summary_short")}
          value={`${totals.shortHours}h`}
          sub={t("page.today.shifts.summary_short_sub")}
          tone={totals.shortHours > 0 ? "red" : "default"}
        />
        <SummaryPill
          icon={<MinusCircle className="h-4 w-4" />}
          label={t("page.today.shifts.summary_over")}
          value={`${totals.overHours}h`}
          sub={t("page.today.shifts.summary_over_sub")}
          tone={totals.overHours > 0 ? "amber" : "default"}
        />
        <SummaryPill
          icon={<Flame className="h-4 w-4" />}
          label={t("page.today.shifts.summary_savings")}
          value={formatGBP(totals.savingsEstimate)}
          sub={t("page.today.shifts.summary_savings_sub")}
          tone="green"
        />
      </div>

      {/* ---------- Heatmap ---------- */}
      <div className="mb-2 flex items-end justify-between flex-wrap gap-2">
        <div>
          <div className="ph-label">
            {t("page.today.shifts.heatmap_title")}
          </div>
          <p className="text-xs text-ph-muted mt-0.5 max-w-xl">
            {t("page.today.shifts.heatmap_caption")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] flex-wrap">
          <LegendDot tone="match" />
          <span className="text-ph-muted">
            {t("page.today.shifts.legend_match")}
          </span>
          <LegendDot tone="short" />
          <span className="text-ph-muted">
            {t("page.today.shifts.legend_short")}
          </span>
          <LegendDot tone="critical" />
          <span className="text-ph-muted">
            {t("page.today.shifts.legend_critical")}
          </span>
          <LegendDot tone="over" />
          <span className="text-ph-muted">
            {t("page.today.shifts.legend_over")}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div
          className="min-w-[680px]"
          style={{
            display: "grid",
            gridTemplateColumns: `130px repeat(${OPEN_HOURS.length}, minmax(0,1fr))`,
            gap: 4,
          }}
        >
          <div />
          {OPEN_HOURS.map((h) => {
            const { top, period } = clockParts(h);
            return (
              <div
                key={`h_${h}`}
                className="flex flex-col items-center justify-end leading-none pb-1"
              >
                <span className="text-[11px] font-bold text-ph-ink">
                  {top}
                </span>
                <span className="text-[9px] font-semibold text-ph-muted">
                  {period}
                </span>
              </div>
            );
          })}

          {BOARD_ROLES.map((role) => {
            const Icon = ROLE_ICON[role] ?? Users;
            return (
              <Row
                key={role}
                role={role}
                Icon={Icon}
                cellByKey={cellByKey}
              />
            );
          })}
        </div>
      </div>

      {/* ---------- Stations hours summary ---------- */}
      <div className="mt-5 pt-4 border-t border-ph-line">
        <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="font-bold text-ph-black">
              {t("page.today.shifts.stations_title")}
            </h4>
            <p className="text-xs text-ph-muted mt-0.5">
              {t("page.today.shifts.stations_caption")}
            </p>
          </div>
        </div>
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {stations.map((s) => (
            <StationRow key={s.role} summary={s} />
          ))}
        </div>
      </div>

      {/* ---------- Adjustments (primary recommendations) ---------- */}
      <div className="mt-5 pt-4 border-t border-ph-line">
        <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="font-bold text-ph-black flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-ph-red" />
              {t("page.today.shifts.adjustments_title")}
            </h4>
            <p className="text-xs text-ph-muted mt-0.5 max-w-xl">
              {t("page.today.shifts.adjustments_caption")}
            </p>
          </div>
        </div>

        {adjustments.length === 0 ? (
          <div className="rounded-xl bg-ph-green/5 border border-ph-green/20 p-3 text-sm text-ph-ink">
            {t("page.today.shifts.adjustments_empty")}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {adjustments.slice(0, 6).map((a) => (
              <AdjustmentCard key={a.id} adj={a} />
            ))}
          </div>
        )}
      </div>

      {/* ---------- Moves (how to realise) ---------- */}
      {moves.length > 0 && (
        <div className="mt-5 pt-4 border-t border-ph-line">
          <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
            <div>
              <h4 className="font-bold text-ph-black flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-ph-red" />
                {t("page.today.shifts.moves_title")}
              </h4>
              <p className="text-xs text-ph-muted mt-0.5 max-w-xl">
                {t("page.today.shifts.moves_caption")}
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {moves.map((m) => (
              <MoveCard key={m.id} move={m} />
            ))}
          </div>
        </div>
      )}

      {/* ---------- Trust ---------- */}
      <p className="mt-4 text-[11px] text-ph-muted italic">
        {t("page.today.shifts.trust")}
      </p>
        </div>
      )}
    </div>
  );
}

// ---------- internals ----------

function Row({
  role,
  Icon,
  cellByKey,
}: {
  role: Role;
  Icon: any;
  cellByKey: Map<string, ShiftCell>;
}) {
  const { t } = useT();
  return (
    <>
      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ph-ink pr-2">
        <Icon className="h-3.5 w-3.5 text-ph-muted" />
        <span className="truncate">{t(`owner.${role}`)}</span>
      </div>
      {OPEN_HOURS.map((h) => {
        const c = cellByKey.get(`${role}_${h}`);
        if (!c) return <div key={`${role}_${h}`} />;
        return <Cell key={`${role}_${h}`} cell={c} />;
      })}
    </>
  );
}

function Cell({ cell }: { cell: ShiftCell }) {
  const { t } = useT();
  const isHeadcount = HEADCOUNT_ROLES.includes(cell.role);
  const pct = cell.capacity
    ? Math.round((cell.demand / cell.capacity) * 100)
    : 0;

  const clock = clockLabel(cell.hour);
  const title =
    cell.fit === "off"
      ? t("page.today.shifts.cell_title_off", {
          role: t(`owner.${cell.role}`),
          hour: clock,
        })
      : isHeadcount
        ? t("page.today.shifts.cell_title_headcount", {
            role: t(`owner.${cell.role}`),
            hour: clock,
            rec: cell.recommendedStaff,
            actual: cell.actualStaff,
          })
        : t("page.today.shifts.cell_title", {
            role: t(`owner.${cell.role}`),
            hour: clock,
            rec: cell.recommendedStaff,
            actual: cell.actualStaff,
            demand: Math.round(cell.demand),
            pct,
          });

  const tone =
    cell.fit === "critical"
      ? "bg-ph-red/15 text-ph-red border-ph-red/40"
      : cell.fit === "short"
        ? "bg-ph-amber/15 text-ph-amber border-ph-amber/40"
        : cell.fit === "over"
          ? "bg-ph-yellow/25 text-ph-ink border-ph-yellow"
          : cell.fit === "match"
            ? "bg-ph-green/10 text-ph-green border-ph-green/25"
            : "bg-ph-surface text-ph-muted/60 border-ph-line";

  const delta = cell.recommendedStaff - cell.actualStaff;
  const deltaLabel =
    cell.fit === "off" || delta === 0
      ? null
      : delta > 0
        ? `+${delta}`
        : `${delta}`;

  return (
    <div
      title={title}
      className={cn(
        "h-[46px] rounded-md border flex flex-col items-center justify-center leading-none select-none px-0.5",
        tone,
      )}
    >
      <span className="text-[14px] font-extrabold">
        {cell.fit === "off" ? "–" : cell.recommendedStaff}
      </span>
      <span className="text-[9px] font-semibold opacity-80 mt-0.5">
        {cell.fit === "off" ? (
          ""
        ) : (
          <>
            {cell.actualStaff}
            {deltaLabel ? (
              <span
                className={cn(
                  "ml-0.5",
                  delta > 0 ? "text-ph-red" : "text-ph-ink",
                )}
              >
                ({deltaLabel})
              </span>
            ) : null}
          </>
        )}
      </span>
    </div>
  );
}

function SummaryPill({
  icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "green" | "red" | "amber";
}) {
  const chip =
    tone === "green"
      ? "bg-ph-green/10 text-ph-green"
      : tone === "red"
        ? "bg-ph-red/10 text-ph-red"
        : tone === "amber"
          ? "bg-ph-amber/15 text-ph-amber"
          : "bg-ph-line text-ph-ink";
  return (
    <div className="rounded-xl border border-ph-line bg-ph-surface/80 p-3">
      <div className={cn("ph-chip", chip)}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-extrabold text-ph-black mt-1">{value}</div>
      {sub && <div className="text-[11px] text-ph-muted">{sub}</div>}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "red" | "amber" | "muted";
}) {
  const cls =
    tone === "green"
      ? "bg-ph-green/10 text-ph-green border-ph-green/30"
      : tone === "red"
        ? "bg-ph-red/10 text-ph-red border-ph-red/30"
        : tone === "amber"
          ? "bg-ph-amber/15 text-ph-amber border-ph-amber/40"
          : "bg-ph-line text-ph-ink border-ph-line";
  return (
    <div
      className={cn(
        "rounded-full border px-2.5 py-1 flex items-center gap-1.5 text-[11px]",
        cls,
      )}
    >
      <span className="font-bold">{value}</span>
      <span className="opacity-75">{label}</span>
    </div>
  );
}

function LegendDot({
  tone,
}: {
  tone: "match" | "short" | "critical" | "over" | "off";
}) {
  const color =
    tone === "critical"
      ? "bg-ph-red"
      : tone === "short"
        ? "bg-ph-amber"
        : tone === "over"
          ? "bg-ph-yellow"
          : tone === "match"
            ? "bg-ph-green"
            : "bg-ph-line";
  return <span className={cn("inline-block h-2.5 w-2.5 rounded-sm", color)} />;
}

function StationRow({ summary }: { summary: StationSummary }) {
  const { t } = useT();
  const Icon = ROLE_ICON[summary.role] ?? Users;
  const delta = summary.deltaHours;
  const tag =
    delta === 0
      ? {
          label: t("page.today.shifts.station_delta_match"),
          cls: "bg-ph-green/10 text-ph-green",
        }
      : delta > 0
        ? {
            label: t("page.today.shifts.station_delta_add", { n: delta }),
            cls: "bg-ph-red/10 text-ph-red",
          }
        : {
            label: t("page.today.shifts.station_delta_cut", { n: -delta }),
            cls: "bg-ph-yellow/30 text-ph-ink",
          };
  // Progress relative to the recommended (plan) level. When the schedule
  // is under the plan, the fill shows coverage; when over, we render a
  // secondary overlay on top of a full neutral bar so the over-fill is
  // visually distinct and never exceeds the track.
  const isOver = delta < 0;
  const coverPct =
    summary.recommendedHours > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (summary.scheduledHours / summary.recommendedHours) * 100,
            ),
          ),
        )
      : 0;
  const overPct =
    isOver && summary.recommendedHours > 0
      ? Math.min(
          100,
          Math.round(
            ((summary.scheduledHours - summary.recommendedHours) /
              summary.recommendedHours) *
              100,
          ),
        )
      : 0;
  const scheduledTone =
    delta > 0
      ? "text-ph-red"
      : delta < 0
        ? "text-ph-amber"
        : "text-ph-green";
  return (
    <div className="rounded-xl border border-ph-line bg-ph-surface/60 p-3 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-ph-black min-w-0">
          <Icon className="h-3.5 w-3.5 text-ph-muted shrink-0" />
          <span className="truncate">{t(`owner.${summary.role}`)}</span>
        </div>
        <span
          className={cn(
            "ph-chip shrink-0 whitespace-nowrap text-[10px] px-1.5 py-0.5",
            tag.cls,
          )}
        >
          {tag.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <div className="min-w-0">
          <div className="text-[10px] text-ph-muted uppercase tracking-wide">
            {t("page.today.shifts.station_scheduled")}
          </div>
          <div
            className={cn(
              "font-extrabold text-base leading-none mt-0.5",
              scheduledTone,
            )}
          >
            {summary.scheduledHours}
            <span className="text-[11px] font-bold opacity-70">h</span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-ph-muted uppercase tracking-wide">
            {t("page.today.shifts.station_recommended")}
          </div>
          <div className="font-extrabold text-ph-black text-base leading-none mt-0.5">
            {summary.recommendedHours}
            <span className="text-[11px] font-bold opacity-70">h</span>
          </div>
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-ph-line relative overflow-hidden">
        {/* Base fill up to 100% of the plan. Red when under, green when
            hitting or above plan. */}
        <div
          className={cn(
            "absolute inset-y-0 left-0",
            delta > 0 ? "bg-ph-red" : "bg-ph-green",
          )}
          style={{ width: `${isOver ? 100 : coverPct}%` }}
        />
        {/* When over-scheduled, a yellow overlay shows the overage
            proportion on top of the full green base. */}
        {isOver && overPct > 0 && (
          <div
            className="absolute inset-y-0 right-0 bg-ph-yellow"
            style={{ width: `${Math.min(100, overPct)}%` }}
          />
        )}
      </div>
    </div>
  );
}

function AdjustmentCard({ adj }: { adj: ShiftAdjustment }) {
  const { t } = useT();
  const isAdd = adj.delta > 0;
  const n = Math.abs(adj.delta);
  const roleLabel = t(`owner.${adj.role}`);
  const borderAccent =
    adj.severity === "high"
      ? "border-l-ph-red"
      : adj.severity === "med"
        ? "border-l-ph-amber"
        : "border-l-ph-green";

  return (
    <div
      className={cn(
        "ph-card p-3 border-l-[4px] flex flex-col gap-2",
        borderAccent,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("ph-chip", isAdd ? "ph-chip-red" : "bg-ph-yellow/30 text-ph-ink")}>
          {isAdd ? (
            <PlusCircle className="h-3 w-3" />
          ) : (
            <MinusCircle className="h-3 w-3" />
          )}
          {timeRangeLabel(adj.fromHour, adj.toHour)}
        </span>
        <span className="text-[10px] text-ph-muted">
          {t("page.today.shifts.adj_confidence", {
            pct: Math.round(adj.confidence * 100),
          })}
        </span>
      </div>

      <div className="text-[14px] font-extrabold text-ph-black leading-snug">
        {t(
          isAdd
            ? "page.today.shifts.adj_add"
            : "page.today.shifts.adj_cut",
          {
            n,
            role: roleLabel,
            fromHour: clockLabel(adj.fromHour),
            toHour: clockLabel(adj.toHour),
          },
        )}
      </div>

      <ul className="text-[12px] text-ph-ink space-y-0.5">
        {adj.reason.slice(0, 3).map((r, i) => (
          <li key={i} className="flex items-start gap-1.5 leading-snug">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-ph-red shrink-0" />
            <span>{r}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2 border-t border-ph-line flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-[11px] font-semibold leading-snug",
            isAdd ? "text-ph-green" : "text-ph-ink",
          )}
        >
          {t(
            isAdd
              ? "page.today.shifts.adj_impact_add"
              : "page.today.shifts.adj_impact_cut",
            {
              orders: adj.expectedOrders,
              gbp: formatGBP(adj.expectedGBP),
            },
          )}
        </span>
        <button
          type="button"
          disabled
          className="ph-btn-ghost border border-ph-line !px-2.5 !py-1 text-[11px] opacity-70 cursor-not-allowed"
          title={t("page.today.shifts.adj_cta")}
        >
          <PlusCircle className="h-3 w-3" />
          {t("page.today.shifts.adj_cta")}
        </button>
      </div>
    </div>
  );
}

function MoveCard({ move }: { move: ShiftMove }) {
  const { t } = useT();
  const fromLabel = t(`owner.${move.fromRole}`);
  const toLabel = t(`owner.${move.toRole}`);
  return (
    <div className="ph-card p-3 border-l-[4px] border-l-ph-red flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="ph-chip-red">
          <Wand2 className="h-3 w-3" />
          {timeRangeLabel(move.fromHour, move.toHour)}
        </span>
        <span className="text-[10px] text-ph-muted">
          {t("page.today.shifts.move_confidence", {
            pct: Math.round(move.confidence * 100),
          })}
        </span>
      </div>

      <div className="text-[14px] font-extrabold text-ph-black leading-snug">
        {t("page.today.shifts.move_template", {
          name: move.staffName,
          from: fromLabel,
          to: toLabel,
          fromHour: clockLabel(move.fromHour),
          toHour: clockLabel(move.toHour),
        })}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
        <span className="ph-chip-muted">{fromLabel}</span>
        <ArrowRight className="h-3 w-3 text-ph-muted" />
        <span className="ph-chip-red">{toLabel}</span>
      </div>

      <ul className="text-[12px] text-ph-ink space-y-0.5">
        {move.why.slice(0, 3).map((w, i) => (
          <li key={i} className="flex items-start gap-1.5 leading-snug">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-ph-red shrink-0" />
            <span>{w}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2 border-t border-ph-line flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-ph-green leading-snug">
          {t("page.today.shifts.move_impact", {
            orders: move.expectedOrders,
            gbp: formatGBP(move.expectedGBP),
          })}
        </span>
        <button
          type="button"
          disabled
          className="ph-btn-ghost border border-ph-line !px-2.5 !py-1 text-[11px] opacity-70 cursor-not-allowed"
          title={t("page.today.shifts.move_cta")}
        >
          <PlusCircle className="h-3 w-3" />
          {t("page.today.shifts.move_cta")}
        </button>
      </div>
    </div>
  );
}
