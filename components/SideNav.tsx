"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  Lightbulb,
  Sliders,
  LineChart,
  ListChecks,
  Bell,
  Pizza,
  MessageCircle,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/useT";

const NAV_PRIMARY = [
  { href: "/today", key: "sidenav.today", Icon: CalendarCheck },
  { href: "/copilot", key: "sidenav.copilot", Icon: MessageCircle },
];
const NAV_SECONDARY = [
  { href: "/store-health", key: "sidenav.home", Icon: Home },
  { href: "/predictions", key: "sidenav.predictions", Icon: TrendingUp },
  { href: "/recommendations", key: "sidenav.recommendations", Icon: Lightbulb },
  { href: "/what-if", key: "sidenav.whatif", Icon: Sliders },
  { href: "/accuracy", key: "sidenav.accuracy", Icon: LineChart },
  { href: "/tasks", key: "sidenav.tasks", Icon: ListChecks },
  { href: "/alerts", key: "sidenav.alerts", Icon: Bell },
];

export function SideNav() {
  const path = usePathname();
  const { t } = useT();
  return (
    <nav className="hidden md:flex md:flex-col w-60 shrink-0 bg-ph-black text-white p-4 gap-1">
      <div className="px-2 py-3 mb-2 flex items-center gap-2">
        <Pizza className="h-5 w-5 text-ph-yellow" />
        <span className="text-xs font-bold uppercase tracking-widest text-ph-yellow">
          {t("sidenav.copilot_section")}
        </span>
      </div>
      {NAV_PRIMARY.map(({ href, key, Icon }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-ph-red text-white shadow-pop"
                : "bg-white/5 text-white hover:bg-white/10",
            )}
          >
            <Icon className="h-4 w-4" />
            {t(key)}
          </Link>
        );
      })}
      <div className="mt-4 mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
        {t("sidenav.explore_section")}
      </div>
      {NAV_SECONDARY.map(({ href, key, Icon }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-ph-red text-white shadow-pop"
                : "text-white/75 hover:bg-white/10",
            )}
          >
            <Icon className="h-4 w-4" />
            {t(key)}
          </Link>
        );
      })}
      <div className="mt-auto pt-4 border-t border-white/10 text-[11px] text-white/50 px-2">
        {t("sidenav.store_label")}
      </div>
    </nav>
  );
}
