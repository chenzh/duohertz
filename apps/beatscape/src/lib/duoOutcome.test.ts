import { describe, expect, test } from "vitest";
import type { PlayResult } from "../types/chart";
import { formatDuoAccuracy, resolveDuoOutcome } from "./duoOutcome";

const run = (overrides: Partial<PlayResult> = {}): PlayResult => ({
  score: 100_000,
  accuracy: 90,
  maxCombo: 40,
  grade: "A",
  fullCombo: false,
  allPerfect: false,
  failed: false,
  judgments: { perfect: 60, great: 20, good: 10, miss: 10 },
  totalNotes: 100,
  missEvents: [],
  ...overrides,
});

describe("Duo outcome", () => {
  test("an Arcade clear beats a higher-scoring failed run", () => {
    expect(resolveDuoOutcome(
      run({ score: 80_000, failed: false }),
      run({ score: 140_000, failed: true }),
    )).toEqual({ winner: "p1", headline: "P1 WINS", reason: "clear" });
  });

  test("equal clear state falls back to score", () => {
    expect(resolveDuoOutcome(
      run({ score: 90_000 }),
      run({ score: 100_000 }),
    )).toEqual({ winner: "p2", headline: "P2 WINS", reason: "score" });
  });

  test("equal scores remain a dead heat", () => {
    expect(resolveDuoOutcome(
      run({ score: 100_000, failed: true }),
      run({ score: 100_000, failed: true }),
    )).toEqual({ winner: "draw", headline: "DEAD HEAT", reason: "draw" });
  });

  test("formats the already-percent accuracy without multiplying it again", () => {
    expect(formatDuoAccuracy(92.34)).toBe("92.34%");
  });
});
