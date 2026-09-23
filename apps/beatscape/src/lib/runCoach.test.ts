import { describe, expect, test } from "vitest";
import type { LastRun } from "../types/chart";
import type { RunRecord } from "./progress";
import { buildRunCoach } from "./runCoach";

const base: LastRun = {
  v: 1,
  track_id: "bs-s1-01",
  title: "Neon Pulse",
  artist: "Pulse Atlas",
  tier: "easy",
  mode: "arcade",
  score: 120_000,
  accuracy: 92,
  maxCombo: 60,
  grade: "A",
  fc: false,
  ap: false,
  failed: false,
  counts: { perfect: 80, great: 10, good: 1, miss: 1 },
  totalNotes: 92,
  durationMs: 75_000,
  endedAt: "2026-09-12T00:00:00.000Z",
};

function historyRun(endedAt: string, meanMs: number, early: number, late: number): RunRecord {
  return {
    track_id: "bs-s1-02",
    district: "Night Grid",
    tier: "standard",
    mode: "arcade",
    score: 170_000,
    accuracy: 95,
    maxCombo: 160,
    fc: false,
    ap: false,
    failed: false,
    durationMs: 75_000,
    endedAt,
    dateKey: endedAt.slice(0, 10),
    timing: { early, late, meanMs },
  };
}

describe("post-run coaching", () => {
  test("sends a failed Arcade run to the same chart in Casual", () => {
    expect(buildRunCoach({ ...base, failed: true }).action).toEqual({
      kind: "link",
      label: "Try Casual",
      href: "/play/bs-s1-01?tier=easy&mode=casual",
    });
  });

  test("prioritizes clustered misses over timing advice", () => {
    const coach = buildRunCoach({
      ...base,
      missEvents: [{ tMs: 8_000, lane: 0 }, { tMs: 9_000, lane: 1 }],
      timing: { early: 1, late: 20, meanMs: 18 },
    });
    expect(coach.title).toBe("Drill the rough spots");
    expect(coach.action).toEqual({ kind: "review", label: "Review missed sections" });
  });

  test("turns a signed timing mean into specific correction", () => {
    const late = buildRunCoach({ ...base, missEvents: [], timing: { early: 2, late: 20, meanMs: 14.4 } });
    const early = buildRunCoach({ ...base, missEvents: [], timing: { early: 20, late: 2, meanMs: -11.6 } });
    expect(late.title).toBe("You’re landing 14 ms late");
    expect(late.detail).toContain("earlier");
    expect(early.title).toBe("You’re landing 12 ms early");
    expect(early.detail).toContain("farther");
  });

  test("recommends calibration only after three recent Arcade runs lean the same way", () => {
    const current = {
      ...base,
      tier: "standard" as const,
      missEvents: [],
      timing: { early: 12, late: 98, meanMs: 14.4 },
    };
    const coach = buildRunCoach(current, {
      recentRuns: [
        historyRun("2026-09-11T00:00:00.000Z", 12.1, 14, 96),
        historyRun("2026-09-10T00:00:00.000Z", 13.2, 10, 100),
      ],
      replayHref: "/play/bs-s1-01?tier=standard&mode=arcade",
    });

    expect(coach.title).toBe("You’re consistently 13 ms late");
    expect(coach.detail).toContain("last 3 full Arcade clears");
    expect(coach.action).toEqual({
      kind: "link",
      label: "Calibrate timing",
      href: "/calibrate?return=%2Fplay%2Fbs-s1-01%3Ftier%3Dstandard%26mode%3Darcade",
    });
  });

  test("does not mistake duplicate, mixed, failed, Practice, or low-sample history for setup bias", () => {
    const current = {
      ...base,
      missEvents: [],
      timing: { early: 8, late: 92, meanMs: 14 },
    };
    const currentDuplicate = historyRun(current.endedAt, 14, 8, 92);
    currentDuplicate.track_id = current.track_id;
    currentDuplicate.tier = current.tier;
    const mixed = buildRunCoach(current, {
      recentRuns: [
        currentDuplicate,
        historyRun("2026-09-11T00:00:00.000Z", -13, 90, 10),
        historyRun("2026-09-10T00:00:00.000Z", 15, 8, 92),
      ],
    });
    const ineligible = buildRunCoach(current, {
      recentRuns: [
        { ...historyRun("2026-09-11T00:00:00.000Z", 13, 10, 90), failed: true },
        { ...historyRun("2026-09-10T00:00:00.000Z", 14, 10, 90), mode: "practice" },
        historyRun("2026-09-09T00:00:00.000Z", 15, 2, 7),
      ],
    });

    expect(mixed.title).toBe("You’re landing 14 ms late");
    expect(mixed.action).toMatchObject({ label: "Replay" });
    expect(ineligible.title).toBe("You’re landing 14 ms late");
    expect(ineligible.action).toMatchObject({ label: "Replay" });
  });

  test("wraps every exact Daily or shared-challenge replay identity in calibration", () => {
    const current = {
      ...base,
      tier: "standard" as const,
      missEvents: [],
      timing: { early: 12, late: 98, meanMs: 14.4 },
    };
    const recentRuns = [
      historyRun("2026-09-11T00:00:00.000Z", 12.1, 14, 96),
      historyRun("2026-09-10T00:00:00.000Z", 13.2, 10, 100),
    ];
    const replayHrefs = [
      "/play/bs-s1-01?tier=standard&mode=arcade&date=2026-09-12&daily=1",
      "/play/bs-s1-01?tier=standard&mode=arcade&challenge=1&target=130000&acc=96.4&grade=A",
    ];

    for (const replayHref of replayHrefs) {
      expect(buildRunCoach(current, { recentRuns, replayHref }).action).toEqual({
        kind: "link",
        label: "Calibrate timing",
        href: `/calibrate?return=${encodeURIComponent(replayHref)}`,
      });
    }
  });

  test("promotes confident non-Arcade and clean Arcade runs in that order", () => {
    const casual = buildRunCoach({ ...base, mode: "casual", accuracy: 96, counts: { ...base.counts, miss: 0 } });
    const arcade = buildRunCoach({ ...base, accuracy: 97, counts: { ...base.counts, miss: 0 } });
    expect(casual.title).toBe("Ready for Arcade");
    expect(casual.action).toMatchObject({ href: "/play/bs-s1-01?tier=easy&mode=arcade" });
    expect(arcade.title).toBe("Move up to Standard");
    expect(arcade.action).toMatchObject({ href: "/play/bs-s1-01?tier=standard&mode=arcade" });
  });

  test("repeats the exact bounded practice section", () => {
    const coach = buildRunCoach({ ...base, mode: "practice", seekedFrom: 6, seekedUntil: 24 });
    expect(coach.action).toEqual({
      kind: "link",
      label: "Practice again",
      href: "/play/bs-s1-01?tier=easy&mode=practice&seek=6&until=24",
    });
  });

  test("repeats an exact multi-rep drill without dropping its count", () => {
    const coach = buildRunCoach({
      ...base,
      mode: "practice",
      seekedFrom: 6,
      seekedUntil: 24,
      practiceRepetitions: 3,
      practiceAttempts: [
        { accuracy: 70, misses: 3, score: 800, grade: "C" },
        { accuracy: 82, misses: 2, score: 1000, grade: "B" },
        { accuracy: 90, misses: 1, score: 1200, grade: "A" },
      ],
    });
    expect(coach.action).toEqual({
      kind: "link",
      label: "Drill again",
      href: "/play/bs-s1-01?tier=easy&mode=practice&seek=6&until=24&reps=3",
    });
    expect(coach.detail).toContain("Compare every pass above");
  });

  test("keeps a shared target when the recommendation is an exact replay", () => {
    const coach = buildRunCoach({
      ...base,
      challenge: { score: 130_000, accuracy: 96.4, grade: "A" },
    });
    expect(coach.action).toEqual({
      kind: "link",
      label: "Retry challenge",
      href: "/play/bs-s1-01?tier=easy&mode=arcade&challenge=1&target=130000&acc=96.4&grade=A",
    });
  });
});
