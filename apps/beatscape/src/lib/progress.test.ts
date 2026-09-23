import { beforeEach, describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_KEY,
  RANKS,
  RUNS_KEY,
  achievementsFor,
  computeStats,
  latestRunForTrackIds,
  loadRank,
  loadRuns,
  loadUnlockedAchievements,
  nextRankProgress,
  rankFor,
  recordRun,
  todayKey,
  type RunRecord,
} from "./progress";
import type { ChartTier, PlayMode, PlayResult } from "../types/chart";

// vitest runs in the node environment — stand in a minimal localStorage.
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

const T = (over: Partial<RunRecord> = {}): RunRecord => ({
  track_id: "bs-s1-01",
  district: "Pulse Core",
  tier: "standard" as ChartTier,
  mode: "arcade" as PlayMode,
  score: 100000,
  accuracy: 95,
  maxCombo: 120,
  fc: true,
  ap: false,
  failed: false,
  durationMs: 90000,
  endedAt: "2026-08-30T12:00:00.000Z",
  dateKey: "2026-08-30",
  ...over,
});

const result = (over: Partial<PlayResult> = {}): PlayResult => ({
  score: 100000,
  accuracy: 95,
  maxCombo: 120,
  grade: "S",
  fullCombo: true,
  allPerfect: false,
  failed: false,
  judgments: { perfect: 100, great: 5, good: 0, miss: 0 },
  totalNotes: 105,
  missEvents: [],
  ...over,
});

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage();
});

describe("computeStats", () => {
  it("uses the player's local calendar date for streaks", () => {
    expect(todayKey(new Date(2026, 0, 2, 23, 30))).toBe("2026-01-02");
  });

  it("counts clears / fc / ap from arcade runs only, failed excluded", () => {
    const stats = computeStats([
      T(),
      T({ fc: true, ap: true }),
      T({ tier: "hard" }),
      T({ failed: true, fc: false, accuracy: 30 }),
      T({ mode: "casual", fc: true, ap: true }),
    ]);
    expect(stats.totalRuns).toBe(5);
    expect(stats.totalClears).toBe(4);
    expect(stats.fcCount).toBe(3); // casual FC does not count toward honor FCs
    expect(stats.apCount).toBe(1); // casual AP does not count either
    expect(stats.hardClears).toBe(1);
  });

  it("recentArcadeAccuracy averages last 20 arcade runs including failed", () => {
    const runs = Array.from({ length: 25 }, (_, i) =>
      T({ accuracy: i < 5 ? 50 : 100, dateKey: `2026-08-${String((i % 28) + 1).padStart(2, "0")}` }),
    );
    const stats = computeStats(runs);
    expect(stats.recentArcadeAccuracy).toBe(100); // last 20 are all 100
  });

  it("bestStreakDays counts consecutive calendar days", () => {
    const stats = computeStats([
      T({ dateKey: "2026-08-28" }),
      T({ dateKey: "2026-08-29" }),
      T({ dateKey: "2026-08-30" }),
      T({ dateKey: "2026-08-25" }),
    ]);
    expect(stats.bestStreakDays).toBe(3);
  });

  it("separates the active streak from the historical best", () => {
    const runs = [
      "2026-08-10",
      "2026-08-11",
      "2026-08-12",
      "2026-08-13",
      "2026-08-14",
      "2026-08-27",
      "2026-08-28",
      "2026-08-29",
    ].map((dateKey) => T({ dateKey }));

    expect(computeStats(runs, "2026-08-30")).toMatchObject({
      activeStreakDays: 3,
      bestStreakDays: 5,
      streakStatus: "ready-today",
    });
    expect(computeStats(runs, "2026-08-31")).toMatchObject({
      activeStreakDays: 0,
      bestStreakDays: 5,
      streakStatus: "inactive",
    });
  });

  it("marks today's full run as counted and ignores duplicate activity days", () => {
    const stats = computeStats([
      T({ dateKey: "2026-08-27" }),
      T({ dateKey: "2026-08-28" }),
      T({ dateKey: "2026-08-29" }),
      T({ dateKey: "2026-08-30" }),
      T({ dateKey: "2026-08-30", track_id: "bs-s1-02" }),
    ], "2026-08-30");

    expect(stats).toMatchObject({
      activeStreakDays: 4,
      bestStreakDays: 4,
      streakStatus: "played-today",
    });
  });

  it("keeps a zero-hit full attempt without treating it as a clear or streak day", () => {
    const stats = computeStats([
      T({
        score: 0,
        accuracy: 0,
        maxCombo: 0,
        fc: false,
        ap: false,
        failed: false,
        dateKey: "2026-08-30",
      }),
    ], "2026-08-30");

    expect(stats).toMatchObject({
      totalRuns: 1,
      totalClears: 0,
      districtsPlayed: 0,
      activeStreakDays: 0,
      bestStreakDays: 0,
      streakStatus: "inactive",
    });
    expect(achievementsFor(stats)).not.toContain("ach-first-clear");
  });

  it("districtsPlayed uses stored run districts", () => {
    const stats = computeStats([
      T({ district: "Pulse Core" }),
      T({ district: "Night Grid" }),
      T({ district: "Pulse Core" }),
    ]);
    expect(stats.districtsPlayed).toBe(2);
  });

  it("drops malformed stored runs and retired achievement ids", () => {
    localStorage.setItem(RUNS_KEY, JSON.stringify([
      T(),
      T({ track_id: "future-glitch", dateKey: "2026-99-99" }),
      T({ track_id: "bad-clock", endedAt: "not-a-date" }),
      null,
      { track_id: "broken" },
    ]));
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([
      "ach-first-clear",
      "ach-first-clear",
      "retired-id",
      42,
    ]));
    expect(loadRuns()).toEqual([T()]);
    expect(loadUnlockedAchievements()).toEqual(["ach-first-clear"]);
  });
});

describe("latestRunForTrackIds", () => {
  it("returns the newest playable catalog run even when storage is out of order", () => {
    const newest = T({
      track_id: "bs-s1-06",
      tier: "hard",
      accuracy: 92.4,
      endedAt: "2026-09-13T12:30:00.000Z",
      dateKey: "2026-09-13",
    });
    const runs = [
      newest,
      T({ endedAt: "2026-09-10T08:00:00.000Z", dateKey: "2026-09-10" }),
      T({
        track_id: "retired-track",
        endedAt: "2026-09-14T08:00:00.000Z",
        dateKey: "2026-09-14",
      }),
      T({ endedAt: "not-a-date" }),
    ];

    expect(latestRunForTrackIds(runs, ["bs-s1-01", "bs-s1-06"])).toEqual(newest);
  });

  it("returns null when history has no run for the current catalog", () => {
    expect(latestRunForTrackIds([T({ track_id: "retired-track" })], ["bs-s1-01"]))
      .toBeNull();
  });
});

describe("nextRankProgress", () => {
  it("shows either route into Beat Player", () => {
    expect(nextRankProgress(computeStats([T({ accuracy: 84 })]), "echo-novice")).toMatchObject({
      rank: { id: "beat-player" },
      rule: "any",
      requirements: [
        { id: "clears", current: 1, target: 5 },
        { id: "accuracy", current: 84, target: 90 },
      ],
    });
  });

  it("shows every objective for the two upper ranks", () => {
    const stats = computeStats([
      T({ fc: true, accuracy: 93 }),
      T({ fc: true, accuracy: 93 }),
    ]);
    expect(nextRankProgress(stats, "beat-player")).toMatchObject({
      rank: { id: "rhythm-master" },
      rule: "all",
      requirements: [
        { id: "full-combos", current: 2, target: 3 },
        { id: "accuracy", current: 93, target: 92 },
      ],
    });
    expect(nextRankProgress(stats, "rhythm-master")?.requirements.map((requirement) => requirement.id)).toEqual([
      "all-perfect",
      "hard-clears",
      "accuracy",
    ]);
    expect(nextRankProgress(stats, "scape-legend")).toBeNull();
  });
});

describe("rankFor (PRD §17.1)", () => {
  it("echo-novice by default", () => {
    expect(rankFor(computeStats([]))).toBe("echo-novice");
  });

  it("beat-player on 5 clears or one 90% run", () => {
    const five = Array.from({ length: 5 }, () => T({ accuracy: 80 }));
    expect(rankFor(computeStats(five))).toBe("beat-player");
    expect(rankFor(computeStats([T({ accuracy: 90 })]))).toBe("beat-player");
  });

  it("rhythm-master needs 3 FCs and 92% recent accuracy", () => {
    const threeFc = Array.from({ length: 3 }, () => T({ fc: true, accuracy: 91 }));
    expect(rankFor(computeStats(threeFc))).toBe("beat-player"); // acc short
    const ok = Array.from({ length: 3 }, () => T({ fc: true, accuracy: 93 }));
    expect(rankFor(computeStats(ok))).toBe("rhythm-master");
  });

  it("scape-legend needs AP + 3 hard clears + 95% recent", () => {
    const near = Array.from({ length: 3 }, () => T({ tier: "hard", fc: true, ap: true, accuracy: 94 }));
    expect(rankFor(computeStats(near))).toBe("rhythm-master");
    const legend = Array.from({ length: 3 }, () => T({ tier: "hard", fc: true, ap: true, accuracy: 96 }));
    expect(rankFor(computeStats(legend))).toBe("scape-legend");
  });

  it("ladder is ordered echo-novice → scape-legend", () => {
    expect(RANKS.map((r) => r.id)).toEqual([
      "echo-novice",
      "beat-player",
      "rhythm-master",
      "scape-legend",
    ]);
  });
});

describe("achievementsFor (PRD §17.2)", () => {
  it("grants the full set when every condition holds", () => {
    const stats = computeStats([
      T({ district: "Pulse Core", dateKey: "2026-08-28" }),
      T({ district: "Night Grid", tier: "hard", dateKey: "2026-08-29" }),
      T({ district: "Glass Rim", tier: "hard", ap: true, dateKey: "2026-08-30" }),
      T({ district: "Chrome Yard", tier: "hard", maxCombo: 250, dateKey: "2026-08-30" }),
      T({ district: "Afterhours Lane", dateKey: "2026-08-30" }),
    ]);
    expect(achievementsFor(stats)).toEqual(
      expect.arrayContaining(ACHIEVEMENTS.map((a) => a.id)),
    );
  });

  it("withholds locked ones", () => {
    const ids = achievementsFor(computeStats([T({ maxCombo: 50 })]));
    expect(ids).toContain("ach-first-clear");
    expect(ids).not.toContain("ach-combo-100");
    expect(ids).not.toContain("ach-district-5");
  });
});

describe("recordRun", () => {
  const track = { track_id: "bs-s1-01", district: "Pulse Core" };

  it("persists the run and reports newly unlocked achievements", () => {
    const out = recordRun(track, "standard", "arcade", result({
      timing: { early: 12, late: 93, meanMs: 11.8 },
    }), 90000);
    expect(out.newAchievements).toContain("ach-first-clear");
    expect(loadRuns()).toHaveLength(1);
    expect(loadRuns()[0]?.timing).toEqual({ early: 12, late: 93, meanMs: 11.8 });
    expect(loadUnlockedAchievements()).toContain("ach-first-clear");
    // Second identical run unlocks nothing new.
    const out2 = recordRun(track, "standard", "arcade", result(), 90000);
    expect(out2.newAchievements).toEqual([]);
  });

  it("does not award Full Combo progress when a Good broke the combo", () => {
    const out = recordRun(track, "easy", "arcade", result({
      score: 100,
      accuracy: 40,
      maxCombo: 0,
      fullCombo: true,
      judgments: { perfect: 0, great: 0, good: 1, miss: 0 },
      totalNotes: 1,
    }), 3000);

    expect(loadRuns()[0]?.fc).toBe(false);
    expect(out.newAchievements).not.toContain("ach-first-fc");
  });

  it("keeps a valid legacy run when only its optional timing profile is malformed", () => {
    localStorage.setItem(RUNS_KEY, JSON.stringify([
      T({ timing: { early: -2, late: 30, meanMs: 12 } }),
    ]));

    expect(loadRuns()).toEqual([T()]);
  });

  it("reports the first streak-qualified run once per local day, including a failed run", () => {
    const first = recordRun(
      track,
      "standard",
      "arcade",
      result({ failed: true, fullCombo: false }),
      30000,
      new Date(2026, 8, 10, 12),
    );
    expect(first.streakUpdate).toEqual({
      kind: "started",
      activeDays: 1,
      newBest: true,
    });

    const sameDay = recordRun(
      track,
      "standard",
      "arcade",
      result(),
      90000,
      new Date(2026, 8, 10, 20),
    );
    expect(sameDay.streakUpdate).toBeNull();

    const nextDay = recordRun(
      track,
      "standard",
      "arcade",
      result(),
      90000,
      new Date(2026, 8, 11, 9),
    );
    expect(nextDay.streakUpdate).toEqual({
      kind: "extended",
      activeDays: 2,
      newBest: true,
    });
  });

  it("waits for the first successful judgment before awarding same-day progress", () => {
    const day = new Date(2026, 8, 10, 12);
    const zeroHit = recordRun(
      track,
      "easy",
      "casual",
      result({
        score: 0,
        accuracy: 0,
        maxCombo: 0,
        fullCombo: false,
        judgments: { perfect: 0, great: 0, good: 0, miss: 105 },
      }),
      90000,
      day,
    );

    expect(zeroHit.newAchievements).not.toContain("ach-first-clear");
    expect(zeroHit.streakUpdate).toBeNull();
    expect(loadRuns()).toHaveLength(1);

    const engaged = recordRun(
      track,
      "easy",
      "casual",
      result({
        score: 100,
        accuracy: 0.38,
        maxCombo: 0,
        fullCombo: false,
        judgments: { perfect: 0, great: 0, good: 1, miss: 104 },
      }),
      90000,
      new Date(2026, 8, 10, 20),
    );

    expect(engaged.newAchievements).toContain("ach-first-clear");
    expect(engaged.streakUpdate).toEqual({
      kind: "started",
      activeDays: 1,
      newBest: true,
    });
  });

  it("only raises the rank, never demotes (PRD §17.1)", () => {
    recordRun(track, "standard", "arcade", result({ accuracy: 96 }), 90000);
    expect(loadRank()).toBe("beat-player");
    recordRun(track, "standard", "arcade", result({ accuracy: 50, fullCombo: false }), 90000);
    expect(loadRank()).toBe("beat-player"); // low run does not demote
  });

  it("does not let section practice inflate lifetime progress", () => {
    const out = recordRun(track, "hard", "arcade", result({
      seekedFrom: 45,
      allPerfect: true,
    }), 20000);
    expect(out).toEqual({ newAchievements: [], rank: "echo-novice", rankUp: false, streakUpdate: null });
    expect(loadRuns()).toEqual([]);
    expect(loadUnlockedAchievements()).toEqual([]);
    expect(loadRank()).toBe("echo-novice");
  });
});
