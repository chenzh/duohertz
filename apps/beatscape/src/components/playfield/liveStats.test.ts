import { describe, expect, test } from "vitest";
import {
  chartProgressPercent,
  liveAccuracyLabel,
  liveAccuracyPercent,
  liveHpDamage,
  openingTimingCoachVisible,
  liveScoreTargetStatus,
  makeLiveStats,
} from "./liveStats";

describe("compact play HUD stats", () => {
  test("starts at full live accuracy instead of penalizing future notes", () => {
    const stats = makeLiveStats();
    stats.total = 120;
    expect(liveAccuracyPercent(stats)).toBe(100);
    expect(liveAccuracyLabel(stats)).toBe("—");
    expect(chartProgressPercent(stats)).toBe(0);
  });

  test("uses only judgments already made for live accuracy", () => {
    const stats = makeLiveStats();
    Object.assign(stats, { perfect: 1, great: 1, good: 1, miss: 1, judged: 4, total: 100 });
    expect(liveAccuracyPercent(stats)).toBe(53.75);
    expect(liveAccuracyLabel(stats)).toBe("53.75%");
    expect(chartProgressPercent(stats)).toBe(4);
  });

  test("clamps progress when defensive inputs exceed the chart total", () => {
    expect(chartProgressPercent({ judged: 8, total: 4 })).toBe(100);
    expect(chartProgressPercent({ judged: -1, total: 4 })).toBe(0);
  });

  test("reports only real sampled HP loss for the Arcade damage cue", () => {
    expect(liveHpDamage(-1, 100)).toBe(0);
    expect(liveHpDamage(100, 95)).toBe(5);
    expect(liveHpDamage(100, 88)).toBe(12);
    expect(liveHpDamage(95, 97)).toBe(0);
    expect(liveHpDamage(Number.NaN, 90)).toBe(0);
  });

  test("offers one opening timing rescue only before the player lands a note", () => {
    const opening = { perfect: 0, great: 0, good: 0, miss: 3 };
    expect(openingTimingCoachVisible(false, opening)).toBe(false);
    expect(openingTimingCoachVisible(true, { ...opening, miss: 2 })).toBe(false);
    expect(openingTimingCoachVisible(true, opening)).toBe(true);
    expect(openingTimingCoachVisible(true, { ...opening, good: 1 })).toBe(false);
  });

  test("counts down an honest PB gap and celebrates clearing it", () => {
    const target = { kind: "personal-best" as const, score: 924_000 };
    expect(liveScoreTargetStatus(0, target)).toEqual({ state: "behind", text: "PB −924K" });
    expect(liveScoreTargetStatus(900_000, target)).toEqual({ state: "behind", text: "PB −24K" });
    expect(liveScoreTargetStatus(924_000, target)).toEqual({ state: "tied", text: "PB TIED" });
    expect(liveScoreTargetStatus(925_200, target)).toEqual({ state: "ahead", text: "PB +1.2K" });
  });

  test("uses a distinct compact label for a shared challenge", () => {
    const target = { kind: "challenge" as const, score: 82_400 };
    expect(liveScoreTargetStatus(0, target)).toEqual({ state: "behind", text: "GOAL −82.4K" });
    expect(liveScoreTargetStatus(Number.NaN, target)).toEqual({ state: "behind", text: "GOAL −82.4K" });
  });
});
