"use client";

import { Task, TaskStatus, useAppStore } from "@/lib/state/store";
import { SeverityChip } from "./SeverityChip";
import { CheckCircle2, Circle, Clock, PauseCircle, PlayCircle, Trash2 } from "lucide-react";

const STATUS_OPTIONS: { v: TaskStatus; label: string; Icon: any; tone: string }[] = [
  { v: "new", label: "New", Icon: Circle, tone: "text-ph-muted" },
  { v: "in_progress", label: "In progress", Icon: PlayCircle, tone: "text-ph-amber" },
  { v: "blocked", label: "Blocked", Icon: PauseCircle, tone: "text-ph-red" },
  { v: "done", label: "Done", Icon: CheckCircle2, tone: "text-ph-green" },
  { v: "verified", label: "Verified", Icon: CheckCircle2, tone: "text-ph-green" },
];

export function TaskRow({ t }: { t: Task }) {
  const setStatus = useAppStore((s) => s.setTaskStatus);
  const remove = useAppStore((s) => s.removeTask);
  const status = STATUS_OPTIONS.find((s) => s.v === t.status)!;
  return (
    <div className="ph-card p-4 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <status.Icon className={`h-5 w-5 ${status.tone} shrink-0`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityChip severity={t.severity} />
            <span className="ph-chip-muted">{t.category}</span>
            <span className="text-[11px] text-ph-muted">
              <Clock className="h-3 w-3 inline mr-0.5" />
              Due {t.due}
            </span>
          </div>
          <div className="font-semibold text-sm text-ph-black truncate mt-1">
            {t.title}
          </div>
          <div className="text-[11px] text-ph-muted mt-0.5">Owner: {t.owner}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={t.status}
          onChange={(e) => setStatus(t.id, e.target.value as TaskStatus)}
          className="text-xs font-semibold border border-ph-line rounded-lg px-2 py-1.5 bg-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.v} value={o.v}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => remove(t.id)}
          className="p-1.5 rounded-lg hover:bg-ph-line text-ph-muted"
          title="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
