import type { Judgment, PlayMode } from "../types/chart";

const WINDOWS_ARCADE = { perfect: 22, great: 45, good: 80 } as const;
const WINDOWS_CASUAL = { perfect: 38, great: 72, good: 115 } as const;
const WINDOWS_PRACTICE = { perfect: 38, great: 75, good: 130 } as const;

export const WINDOWS = WINDOWS_ARCADE;

function windowsFor(mode: PlayMode) {
  if (mode === "casual") return WINDOWS_CASUAL;
  if (mode === "practice") return WINDOWS_PRACTICE;
  return WINDOWS_ARCADE;
}

export function judgeDelta(deltaMs: number, mode: PlayMode = "arcade"): Judgment {
  const w = windowsFor(mode);
  const abs = Math.abs(deltaMs);
  if (abs <= w.perfect) return "perfect";
  if (abs <= w.great) return "great";
  if (abs <= w.good) return "good";
  return "miss";
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
