"use client";

import { useCallback } from "react";
import { lookup, interp } from "./messages";

// App is English-only; Intl uses en-GB across the UI.
const DATE_LOCALE = "en-GB";

export function useT() {
  const t = useCallback(
    (key: string, vars?: Record<string, string | number | undefined | null>) =>
      interp(lookup(key), vars),
    [],
  );

  const longWeekday = useCallback(
    (d: Date) => t(`weekday.${d.getDay()}`),
    [t],
  );
  const shortWeekday = useCallback(
    (d: Date) => t(`weekday.short.${d.getDay()}`),
    [t],
  );
  const shortDate = useCallback(
    (d: Date) =>
      d.toLocaleDateString(DATE_LOCALE, { day: "2-digit", month: "short" }),
    [],
  );
  const fullDate = useCallback(
    (d: Date) =>
      d.toLocaleDateString(DATE_LOCALE, {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  return {
    t,
    dateLocale: DATE_LOCALE,
    longWeekday,
    shortWeekday,
    shortDate,
    fullDate,
  };
}

export { lookup, interp };
