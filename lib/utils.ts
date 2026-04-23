import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGBP(value: number, decimals = 0) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

export function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

export function formatPct(value: number, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function shortDay(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

export function ddmm(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
