"use client";

import { useState } from "react";
import Link from "next/link";
import { ListChecks, ArrowRight, Inbox } from "lucide-react";
import { PageHeader } from "@/components/Shell";
import { useAppStore, TaskStatus } from "@/lib/state/store";
import { TaskRow } from "@/components/TaskList";
import { KPICard } from "@/components/KPICard";
import { useT } from "@/lib/i18n/useT";
import { lookup } from "@/lib/i18n/messages";

const FILTERS: { v: "all" | TaskStatus; labelKey: string }[] = [
  { v: "all", labelKey: "page.tasks.filter.all" },
  { v: "new", labelKey: "page.tasks.filter.new" },
  { v: "in_progress", labelKey: "page.tasks.filter.in_progress" },
  { v: "blocked", labelKey: "page.tasks.filter.blocked" },
  { v: "done", labelKey: "page.tasks.filter.done" },
  { v: "verified", labelKey: "page.tasks.filter.verified" },
];

export default function TasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const { t } = useT();
  const emptySub = lookup("page.tasks.empty_sub");

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
        title={t("page.tasks.title")}
        subtitle={t("page.tasks.subtitle")}
        right={
          <Link href="/recommendations" className="ph-btn-primary">
            <ListChecks className="h-4 w-4" /> {t("page.tasks.browse")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard
          label={t("page.tasks.kpi_open")}
          value={stats.open}
          sub={t("page.tasks.kpi_open_sub")}
        />
        <KPICard
          label={t("page.tasks.kpi_inprog")}
          value={stats.inProgress}
          tone="warn"
          sub={t("page.tasks.kpi_inprog_sub")}
        />
        <KPICard
          label={t("page.tasks.kpi_done")}
          value={stats.done}
          tone="good"
          sub={t("page.tasks.kpi_done_sub")}
        />
        <KPICard
          label={t("page.tasks.kpi_blocked")}
          value={stats.blocked}
          tone="bad"
          sub={t("page.tasks.kpi_blocked_sub")}
        />
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
            {t(f.labelKey)} (
            {f.v === "all"
              ? tasks.length
              : tasks.filter((task) => task.status === f.v).length}
            )
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="ph-card p-10 text-center">
          <Inbox className="h-10 w-10 text-ph-muted mx-auto mb-3" />
          <p className="font-semibold text-ph-ink">{t("page.tasks.empty_title")}</p>
          <p className="text-sm text-ph-muted mt-1">
            {emptySub
              .split("{link}")
              .flatMap((part, i, arr) =>
                i < arr.length - 1
                  ? [
                      part,
                      <Link
                        key={i}
                        href="/recommendations"
                        className="text-ph-red font-semibold hover:underline"
                      >
                        {t("page.tasks.empty_link")}
                      </Link>,
                    ]
                  : [part],
              )}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <TaskRow key={task.id} t={task} />
          ))}
        </div>
      )}
    </>
  );
}
