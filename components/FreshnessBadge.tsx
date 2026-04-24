"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/useT";

export function FreshnessBadge({
  mins,
  className,
}: {
  mins: number;
  className?: string;
}) {
  const { t } = useT();
  const tone =
    mins <= 5
      ? "bg-ph-green/10 text-ph-green"
      : mins <= 15
        ? "bg-ph-amber/15 text-ph-amber"
        : "bg-ph-red/10 text-ph-red";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
        tone,
        className,
      )}
      title={t("common.updated_n_min_ago", { n: mins })}
    >
      <Clock className="h-3 w-3" />
      {t("common.min_short", { n: mins })}
    </span>
  );
}
