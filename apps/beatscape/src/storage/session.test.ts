import { afterEach, describe, expect, it, vi } from "vitest";
import { readLastRun, shareChallengeUrl, shareResultsCopy, shareResultsUrl, writeLastRun, loadDailyBoard } from "../storage/session";
import type { LastRun } from "../types/chart";

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
});

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
}

afterEach(() => vi.unstubAllGlobals());

describe("release storage and sharing regressions", () => {
  it("shares a playable chart, including difficulty, across devices", () => {
    expect(shareChallengeUrl(sample, "https://example.com")).toBe("https://example.com/beatscape/play/bs-s1-01?tier=standard&mode=arcade");
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

  it("applies the same score ceiling to Daily and all-time boards", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", memoryStorage());
    const result = { score: 999999, accuracy: 100, maxCombo: 1, grade: "S" as const, fullCombo: true, allPerfect: true, failed: false, judgments: { perfect: 1, great: 0, good: 0, miss: 0 }, totalNotes: 1, missEvents: [] };
    const track = { track_id: sample.track_id, title: sample.title, artist: sample.artist } as Parameters<typeof writeLastRun>[0];
    writeLastRun(track, "easy", "arcade", result, 1000, { daily: true });
    expect(loadDailyBoard()).toEqual([]);
    writeLastRun(track, "easy", "arcade", { ...result, score: 300 }, 1000, { daily: true });
    expect(loadDailyBoard()).toHaveLength(1);
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
