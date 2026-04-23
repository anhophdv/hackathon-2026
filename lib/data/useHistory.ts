"use client";

import { useMemo } from "react";
import { generateHistory, GeneratedHistory } from "../mock/orders";

let cached: GeneratedHistory | null = null;

export function useHistory(): GeneratedHistory {
  return useMemo(() => {
    if (cached) return cached;
    cached = generateHistory({ weeks: 4, baseDailyOrders: 110, seed: 20260423 });
    return cached;
  }, []);
}
