"use client";

import { Task, TaskStatus, useAppStore } from "@/lib/state/store";
import { SeverityChip } from "./SeverityChip";
import {
  CheckCircle2,
  Circle,
  Clock,
  PauseCircle,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { useT } from "@/lib/i18n/useT";

const STATUS_OPTIONS: { v: TaskStatus; key: string; Icon: any; tone: string }[] = [
  { v: "new", key: "task.status.new", Icon: Circle, tone: "text-ph-muted" },
  {
    v: "in_progress",
    key: "task.status.in_progress",
    Icon: PlayCircle,
    tone: "text-ph-amber",
  },
  {
    v: "blocked",
    key: "task.status.blocked",
    Icon: PauseCircle,
    tone: "text-ph-red",
  },
  { v: "done", key: "task.status.done", Icon: CheckCircle2, tone: "text-ph-green" },
  {
    v: "verified",
    key: "task.status.verified",
    Icon: CheckCircle2,
    tone: "text-ph-green",
  },
];

export function TaskRow({ t: task }: { t: Task }) {
  const setStatus = useAppStore((s) => s.setTaskStatus);
  const remove = useAppStore((s) => s.removeTask);
  const status = STATUS_OPTIONS.find((s) => s.v === task.status)!;
  const { t } = useT();
  return (
    <div className="ph-card p-4 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <status.Icon className={`h-5 w-5 ${status.tone} shrink-0`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityChip severity={task.severity} />
            <span className="ph-chip-muted">{t(`category.${task.category}`)}</span>
            <span className="text-[11px] text-ph-muted">
              <Clock className="h-3 w-3 inline mr-0.5" />
              {t("task.due", { when: task.due })}
            </span>
          </div>
          <div className="font-semibold text-sm text-ph-black truncate mt-1">
            {task.title}
          </div>
          <div className="text-[11px] text-ph-muted mt-0.5">
            {t("task.owner", { name: t(`owner.${task.owner}`) })}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={task.status}
          onChange={(e) => setStatus(task.id, e.target.value as TaskStatus)}
          className="text-xs font-semibold border border-ph-line rounded-lg px-2 py-1.5 bg-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.v} value={o.v}>
              {t(o.key)}
            </option>
          ))}
        </select>
        <button
          onClick={() => remove(task.id)}
          className="p-1.5 rounded-lg hover:bg-ph-line text-ph-muted"
          title={t("common.remove")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
