import type { ChallengeTarget, LastRun } from "../types/chart";
import { playHref } from "./playHref";

const GRADES = new Set<ChallengeTarget["grade"]>(["S", "A", "B", "C", "D"]);
const MAX_SHARED_SCORE = 99_999_999;

export type ChallengeOutcome = {
  status: "cleared" | "tied" | "missed";
  delta: number;
};

export function isChallengeTarget(value: unknown): value is ChallengeTarget {
  if (!value || typeof value !== "object") return false;
  const target = value as Record<string, unknown>;
  return Number.isSafeInteger(target.score) &&
    (target.score as number) >= 0 &&
    (target.score as number) <= MAX_SHARED_SCORE &&
    Number.isFinite(target.accuracy) &&
    (target.accuracy as number) >= 0 &&
    (target.accuracy as number) <= 100 &&
    typeof target.grade === "string" &&
    GRADES.has(target.grade as ChallengeTarget["grade"]);
}

export function challengeTargetForRun(run: LastRun): ChallengeTarget | null {
  if (run.seekedFrom !== undefined) return null;
  const target: ChallengeTarget = {
    score: Math.round(run.score),
    accuracy: Number(run.accuracy.toFixed(2)),
    grade: run.grade,
  };
  return isChallengeTarget(target) ? target : null;
}

export function parseChallengeTarget(params: URLSearchParams): ChallengeTarget | null {
  if (params.get("challenge") !== "1") return null;
  const rawScore = params.get("target");
  const rawAccuracy = params.get("acc");
  const rawGrade = params.get("grade");
  if (rawScore === null || rawAccuracy === null || rawGrade === null) return null;
  if (rawScore.trim() === "" || rawAccuracy.trim() === "") return null;
  const target = {
    score: Number(rawScore),
    accuracy: Number(rawAccuracy),
    grade: rawGrade,
  };
  return isChallengeTarget(target) ? target : null;
}

/** Exact rematch URL for an inbound challenge. Mode/tier changes intentionally
 * leave the challenge because their scoring rules are no longer comparable. */
export function challengeReplayHref(run: LastRun): string {
  const href = playHref(run.track_id, run.tier, run.mode);
  if (run.seekedFrom !== undefined || !isChallengeTarget(run.challenge)) return href;
  const params = new URLSearchParams({
    challenge: "1",
    target: String(run.challenge.score),
    acc: String(run.challenge.accuracy),
    grade: run.challenge.grade,
  });
  return `${href}&${params}`;
}

export function resolveChallengeOutcome(
  score: number,
  target: ChallengeTarget,
  failed = false,
): ChallengeOutcome {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.round(score)) : 0;
  const delta = safeScore - target.score;
  return {
    status: failed || delta < 0 ? "missed" : delta > 0 ? "cleared" : "tied",
    delta,
  };
}
