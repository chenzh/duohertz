import type { Judgment, PlayMode } from "../types/chart";

// BeatScape PRD §4.3 — these are the BeatScape truth values, NOT NeonBeat 22/45/80.
export const WINDOWS_ARCADE = { perfect: 15, great: 30, good: 50 } as const;
export const WINDOWS_CASUAL = { perfect: 28, great: 55, good: 90 } as const;

export type Windows = { perfect: number; great: number; good: number };

export function windowsFor(mode: PlayMode): Windows {
  return mode === "casual" ? WINDOWS_CASUAL : WINDOWS_ARCADE;
}

/** Classify a press delta (ms) against the active windows. */
export function judgeDelta(deltaMs: number, mode: PlayMode = "arcade"): Judgment {
  const w = windowsFor(mode);
  const abs = Math.abs(deltaMs);
  if (abs <= w.perfect) return "perfect";
  if (abs <= w.great) return "great";
  if (abs <= w.good) return "good";
  return "miss";
}

/** Hold tail gets a +20ms snap on top of the Good window (PRD §4.2). */
export function judgeHoldTail(deltaMs: number, mode: PlayMode): Judgment {
  const w = windowsFor(mode);
  const abs = Math.abs(deltaMs);
  if (abs <= w.perfect + 20) return "perfect";
  if (abs <= w.great + 20) return "great";
  if (abs <= w.good + 20) return "good";
  return "miss";
}

export function goodWindowMs(mode: PlayMode): number {
  return windowsFor(mode).good;
}

export function judgmentScore(j: Judgment): number {
  switch (j) {
    case "perfect":
      return 300;
    case "great":
      return 200;
    case "good":
      return 100;
    default:
      return 0;
  }
}

export function comboMultiplier(combo: number): number {
  if (combo >= 200) return 4;
  if (combo >= 100) return 3;
  if (combo >= 50) return 2;
  return 1;
}

export function gradeFromAccuracy(accuracy: number): "S" | "A" | "B" | "C" | "D" {
  if (accuracy >= 95) return "S";
  if (accuracy >= 90) return "A";
  if (accuracy >= 80) return "B";
  if (accuracy >= 70) return "C";
  return "D";
}

/** HP change per judgment object (Arcade only). Tail miss uses -5. */
export function hpDelta(j: Judgment, tailMiss = false): number {
  if (tailMiss) return -5;
  switch (j) {
    case "perfect":
      return 2;
    case "great":
      return 1;
    case "good":
      return 0;
    default:
      return -7;
  }
}

export function accuracyPercent(counts: Record<Judgment, number>, totalNotes: number): number {
  if (!totalNotes) return 0;
  const weighted =
    counts.perfect * 1.0 + counts.great * 0.75 + counts.good * 0.4 + counts.miss * 0;
  return Math.round((weighted / totalNotes) * 10000) / 100;
}

function hasCompleteJudgmentTotal(counts: Record<Judgment, number>, totalNotes: number): boolean {
  const values = Object.values(counts);
  return Number.isInteger(totalNotes)
    && totalNotes > 0
    && values.every((count) => Number.isInteger(count) && count >= 0)
    && values.reduce((sum, count) => sum + count, 0) === totalNotes;
}

/** Full Combo means no combo-breaking judgment: Great is allowed, Good/Miss are not. */
export function isFullCombo(counts: Record<Judgment, number>, totalNotes: number): boolean {
  return hasCompleteJudgmentTotal(counts, totalNotes) && counts.good === 0 && counts.miss === 0;
}

/** All Perfect is stricter than FC and requires every complete judgment to be Perfect. */
export function isAllPerfect(counts: Record<Judgment, number>, totalNotes: number): boolean {
  return hasCompleteJudgmentTotal(counts, totalNotes) && counts.perfect === totalNotes;
}

/** Theoretical max for leaderboard sanity checks (PRD §4.4). */
export function maxScore(totalNotes: number): number {
  return totalNotes * 300 * 4;
}
