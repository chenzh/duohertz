import type { PlayResult } from "../types/chart";

export type DuoOutcome = {
  winner: "p1" | "p2" | "draw";
  headline: "P1 WINS" | "P2 WINS" | "DEAD HEAT";
  reason: "clear" | "score" | "draw";
};

export function resolveDuoOutcome(p1: PlayResult, p2: PlayResult): DuoOutcome {
  if (p1.failed !== p2.failed) {
    return p1.failed
      ? { winner: "p2", headline: "P2 WINS", reason: "clear" }
      : { winner: "p1", headline: "P1 WINS", reason: "clear" };
  }
  if (p1.score !== p2.score) {
    return p1.score > p2.score
      ? { winner: "p1", headline: "P1 WINS", reason: "score" }
      : { winner: "p2", headline: "P2 WINS", reason: "score" };
  }
  return { winner: "draw", headline: "DEAD HEAT", reason: "draw" };
}

export function formatDuoAccuracy(accuracy: number): string {
  return `${accuracy.toFixed(2)}%`;
}
