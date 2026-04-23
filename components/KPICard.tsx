import { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FreshnessBadge } from "./FreshnessBadge";

export function KPICard({
  label,
  value,
  delta,
  deltaSuffix,
  sub,
  freshnessMins,
  tone = "default",
  icon,
}: {
  label: string;
  value: string | number;
  delta?: number; // positive or negative percentage
  deltaSuffix?: string; // e.g. "vs last week"
  sub?: string;
  freshnessMins?: number;
  tone?: "default" | "good" | "warn" | "bad";
  icon?: ReactNode;
}) {
  const deltaTone =
    delta == null
      ? "text-ph-muted"
      : delta > 0
        ? "text-ph-green"
        : delta < 0
          ? "text-ph-red"
          : "text-ph-muted";

  const valueTone = {
    default: "text-ph-black",
    good: "text-ph-green",
    warn: "text-ph-amber",
    bad: "text-ph-red",
  }[tone];

  return (
    <div className="ph-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <div className="text-ph-red">{icon}</div>}
          <div className="ph-label">{label}</div>
        </div>
        {freshnessMins != null && <FreshnessBadge mins={freshnessMins} />}
      </div>
      <div className={cn("text-2xl md:text-[28px] font-extrabold tracking-tight", valueTone)}>
        {value}
      </div>
      <div className="flex items-center gap-2 text-xs">
        {delta != null && (
          <span className={cn("inline-flex items-center font-semibold", deltaTone)}>
            {delta > 0 ? (
              <ArrowUp className="h-3 w-3" />
            ) : delta < 0 ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {(deltaSuffix || sub) && (
          <span className="text-ph-muted truncate">{deltaSuffix ?? sub}</span>
        )}
      </div>
    </div>
  );
}
