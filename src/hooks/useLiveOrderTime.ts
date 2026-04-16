"use client";

import { useEffect, useState } from "react";
import { formatOrderTimeLive } from "@/lib/order-time";

const TICK_MS = 30_000;

type NowListener = (nowMs: number) => void;

let intervalId: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<NowListener>();

function startTicker() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    const nowMs = Date.now();
    for (const l of listeners) l(nowMs);
  }, TICK_MS);
}

function stopTickerIfIdle() {
  if (listeners.size > 0) return;
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
}

/** Cập nhật nhãn thời gian theo chu kỳ (mặc định 30s) để tương đối gần realtime. */
export function useLiveOrderTime(iso: string): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const onTick: NowListener = (nowMs) => setNow(nowMs);
    listeners.add(onTick);
    startTicker();
    // Push an immediate tick so newly mounted rows don't wait up to TICK_MS.
    onTick(Date.now());
    return () => {
      listeners.delete(onTick);
      stopTickerIfIdle();
    };
  }, []);

  return formatOrderTimeLive(iso, now);
}
