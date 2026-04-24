"use client";

import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/useT";

export function SeverityChip({
  severity,
  className,
}: {
  severity: "high" | "med" | "low";
  className?: string;
}) {
  const { t } = useT();
  const cfg = {
    high: {
      tone: "bg-ph-red/10 text-ph-red",
      Icon: AlertTriangle,
      label: t("severity.high"),
    },
    med: {
      tone: "bg-ph-amber/15 text-ph-amber",
      Icon: AlertCircle,
      label: t("severity.med"),
    },
    low: {
      tone: "bg-ph-green/10 text-ph-green",
      Icon: Info,
      label: t("severity.low"),
    },
  }[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide",
        cfg.tone,
        className,
      )}
    >
      <cfg.Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}
