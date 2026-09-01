import { beforeEach, describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  RANKS,
  achievementsFor,
  computeStats,
  loadRank,
  loadRuns,
  loadUnlockedAchievements,
  rankFor,
  recordRun,
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

  it("districtsPlayed uses stored run districts", () => {
    const stats = computeStats([
      T({ district: "Pulse Core" }),
      T({ district: "Night Grid" }),
      T({ district: "Pulse Core" }),
    ]);
    expect(stats.districtsPlayed).toBe(2);
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
    const out = recordRun(track, "standard", "arcade", result(), 90000);
    expect(out.newAchievements).toContain("ach-first-clear");
    expect(loadRuns()).toHaveLength(1);
    expect(loadUnlockedAchievements()).toContain("ach-first-clear");
    // Second identical run unlocks nothing new.
    const out2 = recordRun(track, "standard", "arcade", result(), 90000);
    expect(out2.newAchievements).toEqual([]);
  });

  it("only raises the rank, never demotes (PRD §17.1)", () => {
    recordRun(track, "standard", "arcade", result({ accuracy: 96 }), 90000);
    expect(loadRank()).toBe("beat-player");
    recordRun(track, "standard", "arcade", result({ accuracy: 50, fullCombo: false }), 90000);
    expect(loadRank()).toBe("beat-player"); // low run does not demote
  });
});
