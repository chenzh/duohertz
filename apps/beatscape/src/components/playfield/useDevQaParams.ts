// Dev-only visual-QA URL params, extracted from PlayField (P2-2 hooks split).
//
// These exist so tier/streak stills can be captured headlessly. They are
// compiled out of production builds via the `import.meta.env.DEV` guard and
// have NO side effects on the audio graph or game loop — pure reads of
// `window.location.search` memoized once per mount.
//
//   ?surge=N       locks the SIGNAL meter at tier N (1–3)
//   ?autostart     skips the tap-to-enter gate
//   ?streak=N      (alias ?combo=N) floors the ScoreStreak driver
//
// Kept in its own hook so PlayField stays focused on input + wiring.

import { useMemo } from "react";
import type { SurgeTier } from "../../engine/surge";

export type DevQaParams = {
  demoSurge: SurgeTier;
  devAutoStart: boolean;
  demoStreak: number;
};

export function useDevQaParams(): DevQaParams {
  const demoSurge = useMemo(() => {
    if (!import.meta.env.DEV) return 0;
    const v = Number(new URLSearchParams(window.location.search).get("surge") ?? "0");
    return v >= 1 && v <= 3 ? (Math.floor(v) as SurgeTier) : 0;
  }, []);
  const devAutoStart = useMemo(() => {
    if (!import.meta.env.DEV) return false;
    return new URLSearchParams(window.location.search).has("autostart");
  }, []);
  const demoStreak = useMemo(() => {
    if (!import.meta.env.DEV) return 0;
    const p = new URLSearchParams(window.location.search);
    const v = Number(p.get("streak") ?? p.get("combo") ?? "0");
    return Number.isFinite(v) && v > 0 ? Math.min(200, Math.floor(v)) : 0;
  }, []);
  return { demoSurge, devAutoStart, demoStreak };
}
