import { afterEach, describe, expect, it, vi } from "vitest";
import { readLastRun, shareChallengeUrl, shareResultsCopy, shareResultsUrl, writeLastRun, loadBoard, loadDailyBoard, saveDailyBoardEntry } from "../storage/session";
import type { LastRun } from "../types/chart";
import { getPersonalBest, loadScores, personalBestFor, saveScore } from "./settings";

const sample: LastRun = {
  v: 1,
  track_id: "bs-s1-01",
  title: "Neon Pulse",
  artist: "Pulse Atlas",
  tier: "standard",
  mode: "arcade",
  score: 120000,
  accuracy: 98.5,
  maxCombo: 40,
  grade: "S",
  fc: true,
  ap: false,
  counts: { perfect: 38, great: 2, good: 0, miss: 0 },
  totalNotes: 40,
  durationMs: 75000,
  endedAt: "2026-08-25T00:00:00.000Z",
};

describe("share deep link helpers (BS-005)", () => {
  it("builds results?run=local URL", () => {
    expect(shareResultsUrl("https://example.com")).toBe(
      "https://example.com/beatscape/results?run=local",
    );
  });

  it("formats PRD §6.0.24 share copy", () => {
    const url = shareResultsUrl("https://example.com");
    expect(shareResultsCopy(sample, url)).toBe(
      "I just ran Neon Pulse on BeatScape — 98.5% S. No account, no ads. Scores stay in your browser. Try this chart: https://example.com/beatscape/results?run=local",
    );
  });

  it("labels section-practice copy and links to a full chart", () => {
    const run = { ...sample, mode: "practice" as const, seekedFrom: 45, seekedUntil: 62 };
    const url = shareChallengeUrl(run, "https://example.com");
    expect(url).toBe("https://example.com/beatscape/play/bs-s1-01?tier=standard&mode=practice");
    expect(shareResultsCopy(run, url)).toContain("practiced Neon Pulse 0:45–1:02");
    expect(shareResultsCopy(run, url)).toContain("Practice scores stay off the rankings");
  });

  it("labels drill sharing as final-repetition data", () => {
    const run = {
      ...sample,
      mode: "practice" as const,
      seekedFrom: 45,
      seekedUntil: 62,
      practiceRepetitions: 3,
    };
    expect(shareResultsCopy(run, "https://example.com/full")).toContain(
      "3-rep drill on Neon Pulse 0:45–1:02",
    );
    expect(shareResultsCopy(run, "https://example.com/full")).toContain("final rep 98.5% S");
  });
});

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
}

afterEach(() => vi.unstubAllGlobals());

describe("release storage and sharing regressions", () => {
  it("shares a playable chart, including difficulty, across devices", () => {
    expect(shareChallengeUrl(sample, "https://example.com")).toBe(
      "https://example.com/beatscape/play/bs-s1-01?tier=standard&mode=arcade&challenge=1&target=120000&acc=98.5&grade=S",
    );
  });

  it("rejects corrupt runs and falls back to the valid local save", () => {
    const local = memoryStorage();
    const session = memoryStorage();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("sessionStorage", session);
    for (const corrupt of ["{", "null", "{}", JSON.stringify({ ...sample, counts: null }), JSON.stringify({ ...sample, missEvents: [null] })]) {
      session.setItem("bs_last_run", corrupt);
      expect(readLastRun()).toBeNull();
    }
    local.setItem("bs_last_run_local", JSON.stringify(sample));
    expect(readLastRun()).toEqual(sample);
  });

  it("expires only legacy results from charts affected by Slide double-scoring", () => {
    const local = memoryStorage();
    const session = memoryStorage();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("sessionStorage", session);
    const affected = { ...sample, track_id: "bs-s2-01", tier: "standard" as const };

    session.setItem("bs_last_run", JSON.stringify(affected));
    expect(readLastRun()).toBeNull();
    session.setItem("bs_last_run", JSON.stringify({ ...affected, scoringVersion: 2 }));
    expect(readLastRun()).toEqual({ ...affected, scoringVersion: 2 });

    const unaffectedTier = { ...affected, tier: "easy" as const };
    session.setItem("bs_last_run", JSON.stringify(unaffectedTier));
    expect(readLastRun()).toEqual(unaffectedTier);
  });

  it("applies the same score ceiling to Daily and all-time boards", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", memoryStorage());
    const result = { score: 999999, accuracy: 100, maxCombo: 1, grade: "S" as const, fullCombo: true, allPerfect: true, failed: false, judgments: { perfect: 1, great: 0, good: 0, miss: 0 }, totalNotes: 1, missEvents: [] };
    const track = { track_id: sample.track_id, title: sample.title, artist: sample.artist } as Parameters<typeof writeLastRun>[0];
    writeLastRun(track, "standard", "arcade", result, 1000, {
      daily: { dateKey: "2026-09-12", trackId: sample.track_id, tier: "standard", mode: "arcade" },
    });
    expect(loadDailyBoard()).toEqual([]);
    const run = writeLastRun(track, "standard", "arcade", { ...result, score: 300 }, 1000, {
      daily: { dateKey: "2026-09-12", trackId: sample.track_id, tier: "standard", mode: "arcade" },
    });
    expect(run.dailyDateKey).toBe("2026-09-12");
    expect(loadDailyBoard("2026-09-12")).toHaveLength(1);
  });

  it("derives FC and AP badges from judgments instead of trusting caller flags", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", memoryStorage());
    const track = { track_id: sample.track_id, title: sample.title, artist: sample.artist } as Parameters<typeof writeLastRun>[0];
    const run = writeLastRun(track, "easy", "casual", {
      score: 100,
      accuracy: 40,
      maxCombo: 0,
      grade: "D",
      fullCombo: true,
      allPerfect: true,
      failed: false,
      judgments: { perfect: 0, great: 0, good: 1, miss: 0 },
      totalNotes: 1,
      missEvents: [],
    }, 3000);

    expect(run.fc).toBe(false);
    expect(run.ap).toBe(false);
    expect(readLastRun()).toMatchObject({ fc: false, ap: false });
  });

  it("filters corrupt local and Daily board rows before the UI formats them", () => {
    const local = memoryStorage();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("sessionStorage", memoryStorage());
    const valid = {
      track_id: "bs-s1-01",
      title: "Neon Pulse",
      tier: "hard",
      score: 123456,
      accuracy: 98.76,
      name: "Riley West",
      at: "2026-09-13T12:00:00.000Z",
    };
    local.setItem("bs_board", JSON.stringify([
      valid,
      { ...valid, score: null },
      { ...valid, accuracy: 101 },
      { ...valid, tier: "expert" },
      { ...valid, at: null },
      { ...valid, title: 42 },
    ]));
    expect(loadBoard()).toEqual([valid]);

    local.setItem("bs_daily_board", JSON.stringify([
      { ...valid, dateKey: "2026-09-13" },
      { ...valid, score: -1, dateKey: "2026-09-13" },
      { ...valid, accuracy: "98", dateKey: "2026-09-13" },
      { ...valid, dateKey: "2026-99-99" },
      { ...valid },
    ]));
    expect(loadDailyBoard("2026-09-13")).toEqual([{ ...valid, dateKey: "2026-09-13" }]);
  });

  it("removes legacy Slide PB and board rows without erasing unaffected history", () => {
    const local = memoryStorage();
    vi.stubGlobal("localStorage", local);
    const base = {
      track_id: "bs-s2-01",
      tier: "standard",
      mode: "arcade",
      score: 1000,
      accuracy: 90,
      at: "2026-09-13T12:00:00.000Z",
    };
    const current = { ...base, score: 900, scoringVersion: 2 };
    const unaffectedTier = { ...base, tier: "easy" };
    local.setItem("bs_scores", JSON.stringify([base, current, unaffectedTier]));
    expect(loadScores()).toEqual([current, unaffectedTier]);

    const boardBase = { ...base, title: "Slide City", name: "Riley" };
    const boardCurrent = { ...boardBase, score: 900, scoringVersion: 2 };
    const boardUnaffected = { ...boardBase, tier: "easy" };
    local.setItem("bs_board", JSON.stringify([boardBase, boardCurrent, boardUnaffected]));
    expect(loadBoard()).toEqual([boardCurrent, boardUnaffected]);

    local.setItem("bs_daily_board", JSON.stringify([
      { ...boardBase, dateKey: "2026-09-13" },
      { ...boardCurrent, dateKey: "2026-09-13" },
      { ...boardUnaffected, dateKey: "2026-09-13" },
    ]));
    expect(loadDailyBoard("2026-09-13")).toEqual([
      { ...boardUnaffected, dateKey: "2026-09-13" },
      { ...boardCurrent, dateKey: "2026-09-13" },
    ]);
  });

  it("does not rank a run whose judgment count disagrees with its denominator", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", memoryStorage());
    const track = { track_id: "bs-s2-01", title: "Slide City", artist: "Vector Bloom" } as Parameters<typeof writeLastRun>[0];
    const inconsistent = {
      score: 600,
      accuracy: 100,
      maxCombo: 2,
      grade: "S" as const,
      fullCombo: true,
      allPerfect: false,
      failed: false,
      judgments: { perfect: 2, great: 0, good: 0, miss: 0 },
      totalNotes: 1,
      missEvents: [],
    };

    writeLastRun(track, "standard", "arcade", inconsistent, 2000, {
      daily: { dateKey: "2026-09-13", trackId: "bs-s2-01", tier: "standard", mode: "arcade" },
    });
    expect(loadScores()).toEqual([]);
    expect(loadBoard()).toEqual([]);
    expect(loadDailyBoard("2026-09-13")).toEqual([]);
  });

  it("filters corrupt personal-best rows and selects the highest valid target", () => {
    const local = memoryStorage();
    vi.stubGlobal("localStorage", local);
    const first = {
      track_id: "bs-s1-01",
      tier: "hard",
      mode: "arcade",
      score: 820000,
      accuracy: 90.1,
      at: "2026-09-12T12:00:00.000Z",
    };
    const best = {
      ...first,
      score: 924000,
      accuracy: 92.4,
      at: "2026-09-13T12:00:00.000Z",
    };
    local.setItem("bs_scores", JSON.stringify([
      first,
      best,
      { ...best, track_id: "" },
      { ...best, tier: "expert" },
      { ...best, mode: "ranked" },
      { ...best, mode: "practice" },
      { ...best, score: -1 },
      { ...best, accuracy: 101 },
      { ...best, score: 9999999, at: "not-a-date" },
    ]));

    const loaded = loadScores();
    expect(loaded).toEqual([first, best]);
    expect(personalBestFor(loaded, "bs-s1-01", "hard", "arcade")).toEqual(best);
    expect(getPersonalBest("bs-s1-01", "hard", "arcade")).toEqual(best);
    expect(personalBestFor(loaded, "bs-s1-01", "standard", "arcade")).toBeNull();

    const moreAccurate = {
      ...best,
      accuracy: 94.8,
      at: "2026-09-13T13:00:00.000Z",
    };
    local.setItem("bs_scores", JSON.stringify([best]));
    saveScore(moreAccurate);
    saveScore({ ...moreAccurate, accuracy: 91, at: "2026-09-13T14:00:00.000Z" });
    expect(loadScores()).toEqual([moreAccurate]);
  });

  it("uses the Daily cap for recent clears instead of permanent old high scores", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    const base = {
      track_id: sample.track_id,
      title: sample.title,
      tier: "standard",
      accuracy: 90,
      name: "Riley",
    };
    saveDailyBoardEntry({ ...base, score: 9999, at: "2026-09-10T08:00:00.000Z", dateKey: "2026-09-10" }, 2);
    saveDailyBoardEntry({ ...base, score: 100, at: "2026-09-12T08:00:00.000Z", dateKey: "2026-09-12" }, 2);
    saveDailyBoardEntry({ ...base, score: 200, at: "2026-09-12T09:00:00.000Z", dateKey: "2026-09-12" }, 2);
    expect(loadDailyBoard("2026-09-10")).toEqual([]);
    expect(loadDailyBoard("2026-09-12").map((row) => row.score)).toEqual([200, 100]);
  });

  it("never saves a section slice to PB, all-time board or Daily even if the caller says Arcade", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", memoryStorage());
    const result = { score: 300, accuracy: 100, maxCombo: 1, grade: "S" as const, fullCombo: true, allPerfect: true,
      failed: false, judgments: { perfect: 1, great: 0, good: 0, miss: 0 }, totalNotes: 1, missEvents: [], seekedFrom: 45, seekedUntil: 62 };
    const track = { track_id: sample.track_id, title: sample.title, artist: sample.artist } as Parameters<typeof writeLastRun>[0];
    const run = writeLastRun(track, "standard", "arcade", result, 1000, {
      daily: { dateKey: "2026-09-12", trackId: sample.track_id, tier: "standard", mode: "arcade" },
      challenge: { score: 900, accuracy: 95, grade: "A" },
    });
    expect(run.seekedFrom).toBe(45);
    expect(run.seekedUntil).toBe(62);
    expect(run.challenge).toBeUndefined();
    expect(loadBoard()).toEqual([]);
    expect(loadDailyBoard()).toEqual([]);
    expect(getPersonalBest(sample.track_id, "standard", "arcade")).toBeNull();
  });

  it("marks failed exact Daily attempts without posting a score and rejects mismatched context", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", memoryStorage());
    const track = { track_id: sample.track_id, title: sample.title, artist: sample.artist } as Parameters<typeof writeLastRun>[0];
    const failed = {
      score: 300,
      accuracy: 40,
      maxCombo: 1,
      grade: "D" as const,
      fullCombo: false,
      allPerfect: false,
      failed: true,
      judgments: { perfect: 1, great: 0, good: 0, miss: 9 },
      totalNotes: 10,
      missEvents: [],
    };
    const daily = { dateKey: "2026-09-12", trackId: sample.track_id, tier: "standard" as const, mode: "arcade" as const };
    expect(writeLastRun(track, "standard", "arcade", failed, 1000, { daily }).dailyDateKey).toBe("2026-09-12");
    expect(loadDailyBoard("2026-09-12")).toEqual([]);
    expect(writeLastRun(track, "easy", "arcade", { ...failed, failed: false }, 1000, { daily }).dailyDateKey).toBeUndefined();
    expect(loadDailyBoard("2026-09-12")).toEqual([]);
  });

  it("keeps an otherwise valid run when optional story metadata is corrupt", () => {
    const session = memoryStorage();
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", session);
    for (const shiftStep of ["unknown", null, { id: "studio" }]) {
      session.setItem("bs_last_run", JSON.stringify({ ...sample, shiftStep }));
      expect(readLastRun()).toEqual(sample);
    }
  });

  it("drops corrupt Daily identity without losing an otherwise valid result", () => {
    const session = memoryStorage();
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", session);
    for (const dailyDateKey of ["", "2026-99-99", "yesterday", 20260912, null]) {
      session.setItem("bs_last_run", JSON.stringify({ ...sample, dailyDateKey }));
      expect(readLastRun()).toEqual(sample);
    }
    session.setItem("bs_last_run", JSON.stringify({ ...sample, dailyDateKey: "2026-09-12" }));
    expect(readLastRun()?.dailyDateKey).toBe("2026-09-12");
  });

  it("persists the T3 timing profile and drops a corrupt one", () => {
    const session = memoryStorage();
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", session);
    const timing = { early: 3, late: 7, meanMs: 12.5 };
    const result = { score: 900, accuracy: 92, maxCombo: 10, grade: "A" as const, fullCombo: false, allPerfect: false,
      failed: false, judgments: { perfect: 30, great: 8, good: 2, miss: 0 }, totalNotes: 40, missEvents: [], timing };
    const track = { track_id: sample.track_id, title: sample.title, artist: sample.artist } as Parameters<typeof writeLastRun>[0];
    const run = writeLastRun(track, "standard", "arcade", result, 60000);
    expect(run.timing).toEqual(timing);
    expect(readLastRun()?.timing).toEqual(timing);

    for (const bad of [
      null,
      { early: 1 },
      { early: 1, late: 1, meanMs: "x" },
      { early: -1, late: 4, meanMs: 12 },
      { early: 0, late: 0, meanMs: 0 },
      "early",
    ]) {
      session.setItem("bs_last_run", JSON.stringify({ ...sample, timing: bad }));
      expect(readLastRun()).toEqual(sample);
    }
  });

  it("keeps a valid section marker, including the intro, and drops corrupt markers", () => {
    const session = memoryStorage();
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", session);
    for (const seekedFrom of [0, 45.5]) {
      session.setItem("bs_last_run", JSON.stringify({ ...sample, seekedFrom, seekedUntil: seekedFrom + 10 }));
      expect(readLastRun()?.seekedFrom).toBe(seekedFrom);
      expect(readLastRun()?.seekedUntil).toBe(seekedFrom + 10);
    }
    for (const seekedFrom of [-1, "45", null]) {
      session.setItem("bs_last_run", JSON.stringify({ ...sample, seekedFrom }));
      expect(readLastRun()).toEqual(sample);
    }
    for (const seekedUntil of [45, 40, "60", null]) {
      session.setItem("bs_last_run", JSON.stringify({ ...sample, seekedFrom: 45, seekedUntil }));
      expect(readLastRun()).toEqual({ ...sample, seekedFrom: 45 });
    }
  });

  it("keeps only bounded, validated section-drill repetition counts", () => {
    const session = memoryStorage();
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", session);
    session.setItem("bs_last_run", JSON.stringify({
      ...sample,
      mode: "practice",
      seekedFrom: 45,
      seekedUntil: 62,
      practiceRepetitions: 3,
    }));
    expect(readLastRun()?.practiceRepetitions).toBe(3);

    for (const practiceRepetitions of [1, 2.5, 6, "3", null]) {
      session.setItem("bs_last_run", JSON.stringify({
        ...sample,
        seekedFrom: 45,
        seekedUntil: 62,
        practiceRepetitions,
      }));
      expect(readLastRun()?.practiceRepetitions).toBeUndefined();
    }
    session.setItem("bs_last_run", JSON.stringify({ ...sample, practiceRepetitions: 3 }));
    expect(readLastRun()?.practiceRepetitions).toBeUndefined();
  });

  it("persists only a complete, validated per-rep drill trend", () => {
    const session = memoryStorage();
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", session);
    const practiceAttempts = [
      { accuracy: 70, misses: 3, score: 800, grade: "C" as const },
      { accuracy: 82.5, misses: 2, score: 1100, grade: "B" as const },
      { accuracy: 90, misses: 1, score: 1300, grade: "A" as const },
    ];
    const result = {
      score: 1300,
      accuracy: 90,
      maxCombo: 3,
      grade: "A" as const,
      fullCombo: false,
      allPerfect: false,
      failed: false,
      judgments: { perfect: 3, great: 0, good: 0, miss: 1 },
      totalNotes: 4,
      missEvents: [],
      seekedFrom: 45,
      seekedUntil: 62,
      practiceRepetitions: 3,
      practiceAttempts,
    };
    const track = { track_id: sample.track_id, title: sample.title, artist: sample.artist } as Parameters<typeof writeLastRun>[0];
    const run = writeLastRun(track, "standard", "practice", result, 12000);
    expect(run.practiceAttempts).toEqual(practiceAttempts);
    expect(readLastRun()?.practiceAttempts).toEqual(practiceAttempts);

    for (const bad of [
      practiceAttempts.slice(0, 2),
      practiceAttempts.map((attempt, index) => index === 2 ? { ...attempt, accuracy: 101 } : attempt),
      practiceAttempts.map((attempt, index) => index === 2 ? { ...attempt, misses: 41 } : attempt),
      "three attempts",
    ]) {
      session.setItem("bs_last_run", JSON.stringify({
        ...sample,
        mode: "practice",
        seekedFrom: 45,
        seekedUntil: 62,
        practiceRepetitions: 3,
        practiceAttempts: bad,
      }));
      expect(readLastRun()?.practiceRepetitions).toBe(3);
      expect(readLastRun()?.practiceAttempts).toBeUndefined();
    }
  });

  it("drops a challenge target from section-practice storage", () => {
    const session = memoryStorage();
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", session);
    session.setItem("bs_last_run", JSON.stringify({
      ...sample,
      mode: "practice",
      seekedFrom: 45,
      seekedUntil: 62,
      challenge: { score: 90_000, accuracy: 90, grade: "A" },
    }));
    expect(readLastRun()?.challenge).toBeUndefined();
  });
});

describe("current-visit results when storage is blocked", () => {
  it("keeps the actual finish and its story scene instead of an older readable save", async () => {
    vi.resetModules();
    const storage = { getItem: () => JSON.stringify(sample), setItem: () => { throw new Error("quota"); } };
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("sessionStorage", storage);
    const store = await import("./session");
    const result = { score: 0, accuracy: 1, maxCombo: 1, grade: "D" as const, fullCombo: false, allPerfect: false,
      failed: false, judgments: { perfect: 0, great: 0, good: 1, miss: 9 }, totalNotes: 10, missEvents: [] };
    const track = { track_id: "bs-s1-05", title: "Voltage Drop", artist: "Gridline" } as Parameters<typeof store.writeLastRun>[0];
    const current = store.writeLastRun(track, "easy", "casual", result, 60000, { shiftStep: "studio" });
    expect(store.readLastRun()).toEqual(current);
    expect(store.readLastRun(true)?.shiftStep).toBe("studio");
    expect(store.readLastRun()?.track_id).toBe("bs-s1-05");
  });
});
