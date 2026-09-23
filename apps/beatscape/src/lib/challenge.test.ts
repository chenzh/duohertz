import { describe, expect, it } from "vitest";
import {
  challengeTargetForRun,
  parseChallengeTarget,
  resolveChallengeOutcome,
} from "./challenge";
import type { LastRun } from "../types/chart";

const run: LastRun = {
  v: 1,
  track_id: "bs-s1-01",
  title: "Neon Pulse",
  artist: "Pulse Atlas",
  tier: "standard",
  mode: "arcade",
  score: 82_400,
  accuracy: 82.4,
  maxCombo: 44,
  grade: "B",
  fc: false,
  ap: false,
  counts: { perfect: 76, great: 20, good: 15, miss: 3 },
  totalNotes: 114,
  durationMs: 75_000,
  endedAt: "2026-09-13T00:00:00.000Z",
};

describe("shared score challenges", () => {
  it("round-trips a finite friendly target", () => {
    const target = challengeTargetForRun(run);
    expect(target).toEqual({ score: 82_400, accuracy: 82.4, grade: "B" });
    expect(parseChallengeTarget(new URLSearchParams(
      "challenge=1&target=82400&acc=82.4&grade=B",
    ))).toEqual(target);
  });

  it("rejects partial, extreme, and forged-looking shapes", () => {
    expect(parseChallengeTarget(new URLSearchParams("target=82400&acc=82.4&grade=B"))).toBeNull();
    expect(parseChallengeTarget(new URLSearchParams("challenge=1&target=-1&acc=82.4&grade=B"))).toBeNull();
    expect(parseChallengeTarget(new URLSearchParams("challenge=1&target=82400&acc=101&grade=B"))).toBeNull();
    expect(parseChallengeTarget(new URLSearchParams("challenge=1&target=82400&acc=82.4&grade=SS"))).toBeNull();
    expect(parseChallengeTarget(new URLSearchParams("challenge=1&target=1.5&acc=82.4&grade=B"))).toBeNull();
  });

  it("does not turn a section-practice result into a score target", () => {
    expect(challengeTargetForRun({ ...run, mode: "practice", seekedFrom: 30 })).toBeNull();
  });

  it("resolves wins, ties, misses, and failed runs without trusting the URL as a leaderboard", () => {
    const target = challengeTargetForRun(run)!;
    expect(resolveChallengeOutcome(90_000, target)).toEqual({ status: "cleared", delta: 7_600 });
    expect(resolveChallengeOutcome(82_400, target)).toEqual({ status: "tied", delta: 0 });
    expect(resolveChallengeOutcome(80_000, target)).toEqual({ status: "missed", delta: -2_400 });
    expect(resolveChallengeOutcome(90_000, target, true)).toEqual({ status: "missed", delta: 7_600 });
  });
});
