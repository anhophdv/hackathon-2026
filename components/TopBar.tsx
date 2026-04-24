"use client";

import { Bell, Search, User } from "lucide-react";
import { PizzaHutMark } from "./Brand";
import { useAppStore } from "@/lib/state/store";
import { useT } from "@/lib/i18n/useT";

export function TopBar() {
  const tasks = useAppStore((s) => s.tasks);
  const open = tasks.filter(
    (t) => t.status !== "verified" && t.status !== "done",
  ).length;
  const { t, fullDate } = useT();
  const today = fullDate(new Date());
  return (
    <header className="sticky top-0 z-40 bg-ph-red text-white">
      <div className="flex items-center gap-3 px-4 md:px-6 h-14">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center bg-white rounded-md px-1.5 py-1">
            <PizzaHutMark className="h-6 w-auto" />
          </span>
          <div className="leading-tight">
            <div className="font-extrabold text-[15px] tracking-tight flex items-center gap-1.5">
              {t("brand.name")}
              <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded bg-ph-yellow text-ph-black tracking-wider">
                {t("brand.version")}
              </span>
            </div>
            <div className="text-[11px] text-white/85 -mt-0.5">
              {t("brand.subtitle")}
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 ml-6 px-3 py-1.5 rounded-xl bg-white/10 text-white/90 text-sm flex-1 max-w-md">
          <Search className="h-4 w-4" />
          <input
            placeholder={t("topbar.search")}
            className="bg-transparent placeholder-white/60 outline-none flex-1 text-sm"
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden lg:block text-xs text-white/85">{today}</span>
          <button
            className="relative p-2 rounded-lg hover:bg-white/10"
            title={t("topbar.tasks_open")}
          >
            <Bell className="h-4 w-4" />
            {open > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-ph-yellow text-ph-black text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {open}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/10">
            <User className="h-4 w-4" />
            <span className="text-xs font-semibold">{t("topbar.user")}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
