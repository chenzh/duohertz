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
  /** Music rate; Practice temporarily sets this to 0.5 after three consecutive misses. */
  playbackRate: number;
  /** Real wall-clock milliseconds left on the temporary Practice slowdown. */
  rateRemainingMs: number;
}

/** A single score chase surfaced in the live HUD. Explicit shared challenges
 * outrank a device-local PB; callers intentionally omit this for Daily and
 * unranked runs so the player never sees competing objectives. */
export type LiveScoreTarget = {
  kind: "personal-best" | "challenge";
  score: number;
};

export type LiveScoreTargetStatus = {
  state: "behind" | "tied" | "ahead";
  text: string;
};

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
    playbackRate: 1,
    rateRemainingMs: 0,
  };
}

/**
 * Accuracy while the chart is still running. Future notes must not drag the
 * percentage down before the player has had a chance to hit them, so the
 * denominator is the number of judgments already made. At chart end this is
 * identical to the final-result calculation because judged === total.
 */
export function liveAccuracyPercent(stats: Pick<LiveStats, "perfect" | "great" | "good" | "miss" | "judged">): number {
  if (stats.judged <= 0) return 100;
  const weighted = stats.perfect + stats.great * 0.75 + stats.good * 0.4;
  return Math.round((weighted / stats.judged) * 10_000) / 100;
}

/** Keep the live HUD honest before the chart has produced a judgment. The
 * numeric helper still returns 100 for score math, while the player-facing
 * label waits until there is actual performance to measure. */
export function liveAccuracyLabel(
  stats: Pick<LiveStats, "perfect" | "great" | "good" | "miss" | "judged">,
): string {
  if (stats.judged <= 0) return "—";
  return `${liveAccuracyPercent(stats).toFixed(2)}%`;
}

export function chartProgressPercent(stats: Pick<LiveStats, "judged" | "total">): number {
  if (stats.total <= 0) return 0;
  return Math.min(100, Math.max(0, (stats.judged / stats.total) * 100));
}

/**
 * Damage represented by two consecutive live-HUD samples. The bridge may
 * collapse several same-frame misses into one update (for example, an
 * untouched Hold head + tail), so the player should see the exact aggregate
 * loss instead of a guessed per-judgment constant.
 */
export function liveHpDamage(previousHp: number, currentHp: number): number {
  if (!Number.isFinite(previousHp) || !Number.isFinite(currentHp) || previousHp < 0) return 0;
  const previous = Math.round(Math.min(100, Math.max(0, previousHp)));
  const current = Math.round(Math.min(100, Math.max(0, currentHp)));
  return Math.max(0, previous - current);
}

/**
 * A quiet opening rescue for the first playable story scene. Three misses
 * before any successful judgment strongly suggests the player has not found
 * the receptor line yet; once they land anything, the prompt stays out of the
 * way for the rest of that attempt.
 */
export function openingTimingCoachVisible(
  enabled: boolean,
  stats: Pick<LiveStats, "perfect" | "great" | "good" | "miss">,
): boolean {
  if (!enabled || stats.miss < 3) return false;
  return stats.perfect + stats.great + stats.good === 0;
}

function compactScoreGap(value: number): string {
  const score = Math.max(0, Math.round(value));
  if (score >= 1_000_000) {
    const millions = score / 1_000_000;
    return `${millions.toLocaleString("en-US", {
      maximumFractionDigits: millions < 10 ? 1 : 0,
    })}M`;
  }
  if (score >= 1_000) {
    const thousands = score / 1_000;
    return `${thousands.toLocaleString("en-US", {
      maximumFractionDigits: thousands < 100 ? 1 : 0,
    })}K`;
  }
  return score.toLocaleString("en-US");
}

/**
 * Honest score delta for the live chase label. This is deliberately not a
 * progress-normalized "pace": a final PB contains no note-by-note replay, so
 * pretending to know whether the player is ahead at the current beat would be
 * misleading. The raw gap counts down to zero and turns positive once cleared.
 */
export function liveScoreTargetStatus(
  currentScore: number,
  target: LiveScoreTarget,
): LiveScoreTargetStatus {
  const current = Number.isFinite(currentScore) ? Math.max(0, Math.round(currentScore)) : 0;
  const targetScore = Number.isFinite(target.score) ? Math.max(0, Math.round(target.score)) : 0;
  const delta = current - targetScore;
  const label = target.kind === "personal-best" ? "PB" : "GOAL";
  if (delta === 0) return { state: "tied", text: `${label} TIED` };
  return {
    state: delta > 0 ? "ahead" : "behind",
    text: `${label} ${delta > 0 ? "+" : "−"}${compactScoreGap(Math.abs(delta))}`,
  };
}
