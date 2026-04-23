"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Recommendation } from "../forecast/recommendations";
import { WhatIf, DEFAULT_WHATIF } from "../forecast/engine";

export type TaskStatus = "new" | "in_progress" | "blocked" | "done" | "verified";
export type Task = {
  id: string;
  title: string;
  owner: string;
  due: string;
  category: string;
  severity: "high" | "med" | "low";
  status: TaskStatus;
  createdAt: number;
  source?: string; // recommendation id
  notes?: string;
};

export type Scenario = {
  id: string;
  name: string;
  whatIf: WhatIf;
  savedAt: number;
};

type AppState = {
  tasks: Task[];
  addTaskFromRec: (r: Recommendation) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  removeTask: (id: string) => void;

  whatIf: WhatIf;
  setWhatIf: (patch: Partial<WhatIf>) => void;
  resetWhatIf: () => void;

  scenarios: Scenario[];
  saveScenario: (name: string) => void;
  loadScenario: (id: string) => void;
  deleteScenario: (id: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      addTaskFromRec: (r) => {
        const owner = r.steps[0]?.owner ?? "Manager";
        const due = r.steps[0]?.at ?? "ASAP";
        const id = `t_${r.id}_${Date.now()}`;
        if (get().tasks.some((t) => t.source === r.id && t.status !== "verified")) return;
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              id,
              title: r.title,
              owner,
              due,
              category: r.category,
              severity: r.severity,
              status: "new",
              createdAt: Date.now(),
              source: r.id,
            },
          ],
        }));
      },
      setTaskStatus: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        })),
      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      whatIf: { ...DEFAULT_WHATIF },
      setWhatIf: (patch) => set((s) => ({ whatIf: { ...s.whatIf, ...patch } })),
      resetWhatIf: () => set({ whatIf: { ...DEFAULT_WHATIF } }),

      scenarios: [],
      saveScenario: (name) =>
        set((s) => ({
          scenarios: [
            ...s.scenarios,
            {
              id: `sc_${Date.now()}`,
              name,
              whatIf: { ...s.whatIf },
              savedAt: Date.now(),
            },
          ],
        })),
      loadScenario: (id) =>
        set((s) => {
          const sc = s.scenarios.find((x) => x.id === id);
          return sc ? { whatIf: { ...sc.whatIf } } : {};
        }),
      deleteScenario: (id) =>
        set((s) => ({ scenarios: s.scenarios.filter((x) => x.id !== id) })),
    }),
    { name: "ph-store-cmd-center" },
  ),
);
