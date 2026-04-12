"use client";

import { useEffect, useState } from "react";
import { formatOrderTimeLive } from "@/lib/order-time";

const TICK_MS = 30_000;

/** Cập nhật nhãn thời gian theo chu kỳ (mặc định 30s) để tương đối gần realtime. */
export function useLiveOrderTime(iso: string): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  return formatOrderTimeLive(iso, now);
}
