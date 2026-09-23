import { useEffect, useState } from "react";
import {
  dailyClockSnapshot,
  dailyResetInMs,
  type DailyClockSnapshot,
} from "./dailyChallenge";

const MINUTE_MS = 60_000;
const BOUNDARY_GRACE_MS = 25;

/**
 * Keep Daily presentation aligned with the shared UTC date without a reload.
 * The timer wakes only at the next visible minute or UTC rollover; returning
 * to a backgrounded tab refreshes immediately instead of trusting a stale timer.
 */
export function useUtcDailyClock(): DailyClockSnapshot {
  const [clock, setClock] = useState(dailyClockSnapshot);

  useEffect(() => {
    let timeout = 0;

    const schedule = () => {
      const now = Date.now();
      const nextMinuteInMs = MINUTE_MS - (now % MINUTE_MS);
      const nextResetInMs = dailyResetInMs(new Date(now));
      const delay = Math.max(
        BOUNDARY_GRACE_MS,
        Math.min(nextMinuteInMs, nextResetInMs) + BOUNDARY_GRACE_MS,
      );
      timeout = window.setTimeout(refresh, delay);
    };

    const refresh = () => {
      window.clearTimeout(timeout);
      setClock(dailyClockSnapshot());
      schedule();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return clock;
}
