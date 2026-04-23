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
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Store Health", Icon: Home },
  { href: "/predictions", label: "Predictions", Icon: TrendingUp },
  { href: "/recommendations", label: "Recommendations", Icon: Lightbulb },
  { href: "/what-if", label: "What-if Planner", Icon: Sliders },
  { href: "/accuracy", label: "Accuracy (WoW)", Icon: LineChart },
  { href: "/tasks", label: "Tasks", Icon: ListChecks },
  { href: "/alerts", label: "Alerts", Icon: Bell },
];

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="hidden md:flex md:flex-col w-60 shrink-0 bg-ph-black text-white p-4 gap-1">
      <div className="px-2 py-3 mb-2 flex items-center gap-2">
        <Pizza className="h-5 w-5 text-ph-yellow" />
        <span className="text-xs font-bold uppercase tracking-widest text-ph-yellow">
          Store OS
        </span>
      </div>
      {NAV.map(({ href, label, Icon }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-ph-red text-white shadow-pop"
                : "text-white/80 hover:bg-white/10",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
      <div className="mt-auto pt-4 border-t border-white/10 text-[11px] text-white/50 px-2">
        Store #4187 · Manchester Piccadilly
      </div>
    </nav>
  );
}
