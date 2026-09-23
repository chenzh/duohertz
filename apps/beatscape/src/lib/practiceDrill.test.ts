import { describe, expect, it } from "vitest";
import {
  MAX_PRACTICE_REPETITIONS,
  MISS_DRILL_REPETITIONS,
  normalizePracticeAttempts,
  normalizePracticeRepetitions,
  practiceProgress,
} from "./practiceDrill";

describe("bounded section-practice drills", () => {
  it("accepts the Miss review three-rep contract", () => {
    expect(MISS_DRILL_REPETITIONS).toBe(3);
    expect(normalizePracticeRepetitions("3", true)).toBe(3);
    expect(normalizePracticeRepetitions(3, true)).toBe(3);
  });

  it("keeps full-track, open-ended, malformed, and excessive requests single-run", () => {
    expect(MAX_PRACTICE_REPETITIONS).toBe(5);
    for (const value of [null, "", "1", "2.5", "6", "many", Infinity]) {
      expect(normalizePracticeRepetitions(value, true)).toBe(1);
    }
    expect(normalizePracticeRepetitions("3", false)).toBe(1);
  });

  it("keeps one compact, validated result for every drill pass", () => {
    const attempts = [
      { accuracy: 70, misses: 3, score: 800, grade: "C" },
      { accuracy: 82.5, misses: 2, score: 1100, grade: "B" },
      { accuracy: 82.5, misses: 1, score: 1200, grade: "B" },
    ];
    expect(normalizePracticeAttempts(attempts, 3, 4)).toEqual(attempts);
    expect(practiceProgress(attempts)).toEqual({
      bestIndex: 2,
      accuracyDelta: 12.5,
      missDelta: -2,
    });
  });

  it("drops incomplete or corrupt drill trends without affecting the run", () => {
    const valid = { accuracy: 80, misses: 1, score: 900, grade: "B" };
    for (const attempts of [
      [valid, valid],
      [valid, valid, { ...valid, accuracy: 101 }],
      [valid, valid, { ...valid, misses: 5 }],
      [valid, valid, { ...valid, score: -1 }],
      [valid, valid, { ...valid, grade: "SS" }],
      "three runs",
    ]) expect(normalizePracticeAttempts(attempts, 3, 4)).toBeUndefined();
    expect(practiceProgress([valid])).toBeNull();
  });
});
