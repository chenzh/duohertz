/**
 * Live, ref-shared game stats written by the PlayField game loop and read by
 * the comic-panel HUD (PlayHud).
 *
 * Design rule (PRD §7.5 RESONANCE / B-1): the PlayField canvas runs its own
 * rAF and must NEVER trigger a React re-render. So the loop writes into this
 * mutable object ~20Hz via a dedicated low-frequency rAF, and the HUD reads it
 * on its own 20Hz rAF and writes the DOM directly. No React state crossing the
 * 60fps boundary.
 */
export interface LiveStats {
  score: number;
  combo: number;
  maxCombo: number;
  hp: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  /** Latched SIGNAL tier (0 = SIGNAL, 1 = TUNING, 2 = LIVE, 3 = ON AIR). */
  surgeTier: 0 | 1 | 2 | 3;
  /** perfect + great + good + miss — judged notes so far. */
  judged: number;
  /** total scorable notes in the chart. */
  total: number;
}

export function makeLiveStats(): LiveStats {
  return {
    score: 0,
    combo: 0,
    maxCombo: 0,
    hp: 100,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
    surgeTier: 0,
    judged: 0,
    total: 0,
  };
}
