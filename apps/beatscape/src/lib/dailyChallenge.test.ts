import { describe, expect, it } from "vitest";
import type { DailyBoardEntry } from "../storage/session";
import {
  dailyClockSnapshot,
  dailyPlayHref,
  dailyReplayHref,
  dailyResetInMs,
  formatDailyReset,
  getDailyChallenge,
  resolveDailyChallenge,
  summarizeDailyChallenge,
} from "./dailyChallenge";

const dateKey = "2026-09-12";
const trackIds = ["bs-s1-03", "bs-s1-01", "bs-s1-02"];
const challenge = getDailyChallenge(trackIds, dateKey)!;

function entry(overrides: Partial<DailyBoardEntry> = {}): DailyBoardEntry {
  return {
    track_id: challenge.trackId,
    title: "Daily signal",
    tier: challenge.tier,
    score: 1000,
    accuracy: 90,
    name: "Riley",
    at: `${dateKey}T08:00:00.000Z`,
    dateKey,
    ...overrides,
  };
}

describe("Daily challenge identity and progress", () => {
  it("presents a compact reset countdown from the shared UTC boundary", () => {
    const nearReset = new Date("2026-09-16T23:59:30.000Z");
    expect(dailyResetInMs(nearReset)).toBe(30_000);
    expect(dailyClockSnapshot(nearReset)).toEqual({
      dateKey: "2026-09-16",
      resetInMs: 30_000,
      resetLabel: "Resets in <1m",
    });
    expect(formatDailyReset(42 * 60_000)).toBe("Resets in 42m");
    expect(formatDailyReset((7 * 60 + 5) * 60_000)).toBe("Resets in 7h 5m");
  });

  it("pins generated links to the UTC challenge date", () => {
    expect(dailyPlayHref(challenge)).toBe(
      `/play/${challenge.trackId}?tier=standard&mode=arcade&date=${dateKey}&daily=1`,
    );
  });

  it("accepts only today's exact track, tier and mode", () => {
    const params = new URLSearchParams(`tier=standard&mode=arcade&date=${dateKey}&daily=1`);
    expect(resolveDailyChallenge(params, trackIds, challenge, dateKey)).toEqual(challenge);
    expect(resolveDailyChallenge(params, trackIds, { ...challenge, trackId: "bs-s1-99" }, dateKey)).toBeNull();
    expect(resolveDailyChallenge(params, trackIds, { ...challenge, tier: "easy" }, dateKey)).toBeNull();
    expect(resolveDailyChallenge(params, trackIds, { ...challenge, mode: "casual" }, dateKey)).toBeNull();
    expect(resolveDailyChallenge(new URLSearchParams("tier=standard&mode=arcade&daily=1"), trackIds, challenge, dateKey))
      .toEqual(challenge);
    expect(resolveDailyChallenge(
      new URLSearchParams("tier=standard&mode=arcade&date=2026-09-11&daily=1"),
      trackIds,
      challenge,
      dateKey,
    )).toBeNull();
    expect(resolveDailyChallenge(new URLSearchParams(`date=${dateKey}&daily=0`), trackIds, challenge, dateKey)).toBeNull();
  });

  it("summarizes only entries for the exact Daily and picks the strongest clear", () => {
    const summary = summarizeDailyChallenge(challenge, [
      entry({ score: 1000, accuracy: 91, at: `${dateKey}T08:00:00.000Z` }),
      entry({ score: 1200, accuracy: 88, at: `${dateKey}T09:00:00.000Z` }),
      entry({ track_id: "wrong-track", score: 999999 }),
      entry({ tier: "hard", score: 999999 }),
      entry({ dateKey: "2026-09-11", score: 999999 }),
    ]);
    expect(summary.clears).toBe(2);
    expect(summary.best?.score).toBe(1200);
    expect(summary.entries.map((item) => item.score)).toEqual([1200, 1000]);
  });

  it("keeps a current Daily retry ranked and expires yesterday's identity", () => {
    const run = {
      track_id: challenge.trackId,
      tier: challenge.tier,
      mode: challenge.mode,
      dailyDateKey: dateKey,
    };
    expect(dailyReplayHref(run, dateKey)).toBe(dailyPlayHref(challenge));
    expect(dailyReplayHref(run, "2026-09-13")).toBeNull();
    expect(dailyReplayHref({ ...run, tier: "easy" }, dateKey)).toBeNull();
  });
});
