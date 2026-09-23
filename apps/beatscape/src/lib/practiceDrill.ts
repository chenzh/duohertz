import type { PracticeAttemptSummary } from "../types/chart";

export const MISS_DRILL_REPETITIONS = 3;
export const MAX_PRACTICE_REPETITIONS = 5;

/**
 * Repetition count is friendly URL state, so only a small bounded integer is
 * accepted. Repetition is enabled exclusively for bounded section practice;
 * full-track or open-ended practice remains a single run.
 */
export function normalizePracticeRepetitions(
  value: unknown,
  boundedSectionPractice: boolean,
): number {
  if (!boundedSectionPractice) return 1;
  const repetitions = typeof value === "string" && value.trim() !== ""
    ? Number(value)
    : value;
  return Number.isInteger(repetitions)
    && Number(repetitions) >= 2
    && Number(repetitions) <= MAX_PRACTICE_REPETITIONS
      ? Number(repetitions)
      : 1;
}

/**
 * Drill progress is friendly local feedback, not trusted scoring input. Keep a
 * compact copy only when every pass matches the validated bounded drill.
 */
export function normalizePracticeAttempts(
  value: unknown,
  repetitions: number,
  totalNotes: number,
): PracticeAttemptSummary[] | undefined {
  if (
    repetitions < 2
    || repetitions > MAX_PRACTICE_REPETITIONS
    || !Number.isInteger(totalNotes)
    || totalNotes <= 0
    || !Array.isArray(value)
    || value.length !== repetitions
  ) return undefined;

  const attempts: PracticeAttemptSummary[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") return undefined;
    const attempt = candidate as Record<string, unknown>;
    if (
      typeof attempt.accuracy !== "number"
      || !Number.isFinite(attempt.accuracy)
      || attempt.accuracy < 0
      || attempt.accuracy > 100
      || !Number.isInteger(attempt.misses)
      || Number(attempt.misses) < 0
      || Number(attempt.misses) > totalNotes
      || typeof attempt.score !== "number"
      || !Number.isFinite(attempt.score)
      || attempt.score < 0
      || typeof attempt.grade !== "string"
      || !["S", "A", "B", "C", "D"].includes(attempt.grade)
    ) return undefined;
    attempts.push({
      accuracy: attempt.accuracy,
      misses: Number(attempt.misses),
      score: attempt.score,
      grade: attempt.grade as PracticeAttemptSummary["grade"],
    });
  }
  return attempts;
}

export type PracticeProgress = {
  bestIndex: number;
  accuracyDelta: number;
  missDelta: number;
};

/** Compares the final pass with the first and selects one deterministic best. */
export function practiceProgress(attempts: PracticeAttemptSummary[]): PracticeProgress | null {
  if (attempts.length < 2) return null;
  let bestIndex = 0;
  for (let index = 1; index < attempts.length; index++) {
    const current = attempts[index]!;
    const best = attempts[bestIndex]!;
    if (
      current.accuracy > best.accuracy
      || (current.accuracy === best.accuracy && current.misses < best.misses)
      || (current.accuracy === best.accuracy && current.misses === best.misses && current.score >= best.score)
    ) bestIndex = index;
  }
  const first = attempts[0]!;
  const last = attempts[attempts.length - 1]!;
  return {
    bestIndex,
    accuracyDelta: Math.round((last.accuracy - first.accuracy) * 100) / 100,
    missDelta: last.misses - first.misses,
  };
}
