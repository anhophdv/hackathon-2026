"use client";

import { useState } from "react";
import Link from "next/link";
import { ListChecks, ArrowRight, Inbox } from "lucide-react";
import { PageHeader } from "@/components/Shell";
import { useAppStore, TaskStatus } from "@/lib/state/store";
import { TaskRow } from "@/components/TaskList";
import { KPICard } from "@/components/KPICard";

const FILTERS: { v: "all" | TaskStatus; label: string }[] = [
  { v: "all", label: "All" },
  { v: "new", label: "New" },
  { v: "in_progress", label: "In progress" },
  { v: "blocked", label: "Blocked" },
  { v: "done", label: "Done" },
  { v: "verified", label: "Verified" },
];

export default function TasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");

  const filtered =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const stats = {
    open: tasks.filter((t) => !["done", "verified"].includes(t.status)).length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => ["done", "verified"].includes(t.status)).length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Every recommendation can become a tracked task — assigned, status-managed, and verified by the manager. The audit trail lives here."
        right={
          <Link href="/recommendations" className="ph-btn-primary">
            <ListChecks className="h-4 w-4" /> Browse recommendations
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard label="Open" value={stats.open} sub="not yet completed" />
        <KPICard label="In progress" value={stats.inProgress} tone="warn" sub="being worked on" />
        <KPICard label="Done / verified" value={stats.done} tone="good" sub="completed today" />
        <KPICard label="Blocked" value={stats.blocked} tone="bad" sub="needs escalation" />
      </div>

      <div className="ph-card p-3 mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              filter === f.v ? "bg-ph-red text-white" : "bg-ph-line text-ph-ink hover:bg-ph-yellow/30"
            }`}
          >
            {f.label} ({f.v === "all" ? tasks.length : tasks.filter((t) => t.status === f.v).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="ph-card p-10 text-center">
          <Inbox className="h-10 w-10 text-ph-muted mx-auto mb-3" />
          <p className="font-semibold text-ph-ink">No tasks yet</p>
          <p className="text-sm text-ph-muted mt-1">
            Add tasks from the{" "}
            <Link href="/recommendations" className="text-ph-red font-semibold hover:underline">
              Recommendations
            </Link>{" "}
            page to start tracking execution.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <TaskRow key={t.id} t={t} />
          ))}
        </div>
      )}
    </>
  );
}
