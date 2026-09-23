import { describe, expect, it } from "vitest";
import type { LastRun } from "../types/chart";
import { resultReplayHref } from "./resultReplay";

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

describe("Results replay identity", () => {
  it("replays an ordinary run and preserves its Library origin", () => {
    expect(resultReplayHref(run, "/library?q=neon+pulse&genre=Electronic")).toBe(
      "/play/bs-s1-01?tier=standard&mode=arcade&returnTo=%2Flibrary%3Fq%3Dneon%2Bpulse%26genre%3DElectronic",
    );
  });

  it("keeps bounded and legacy section-practice ranges", () => {
    expect(resultReplayHref({
      ...run,
      tier: "easy",
      mode: "practice",
      seekedFrom: 12,
      seekedUntil: 28,
    })).toBe("/play/bs-s1-01?tier=easy&mode=practice&seek=12&until=28");
    expect(resultReplayHref({
      ...run,
      tier: "easy",
      mode: "practice",
      seekedFrom: 12,
    })).toBe("/play/bs-s1-01?tier=easy&mode=practice&seek=12");
  });

  it("keeps an explicit bounded-section drill count", () => {
    expect(resultReplayHref({
      ...run,
      tier: "easy",
      mode: "practice",
      seekedFrom: 12,
      seekedUntil: 28,
      practiceRepetitions: 3,
    })).toBe("/play/bs-s1-01?tier=easy&mode=practice&seek=12&until=28&reps=3");
  });

  it("keeps current Daily, challenge, and First Shift context", () => {
    expect(resultReplayHref({
      ...run,
      dailyDateKey: "2026-09-13",
    }, "/library", "2026-09-13")).toBe(
      "/play/bs-s1-01?tier=standard&mode=arcade&date=2026-09-13&daily=1",
    );
    expect(resultReplayHref({
      ...run,
      challenge: { score: 82_400, accuracy: 82.4, grade: "B" },
    })).toBe(
      "/play/bs-s1-01?tier=standard&mode=arcade&challenge=1&target=82400&acc=82.4&grade=B",
    );
    expect(resultReplayHref({
      ...run,
      track_id: "bs-s1-05",
      tier: "easy",
      mode: "casual",
      shiftStep: "studio",
    })).toBe(
      "/play/bs-s1-05?tier=easy&mode=casual&shift=studio",
    );
  });

  it("drops expired Daily identity into a normal replay", () => {
    expect(resultReplayHref({
      ...run,
      dailyDateKey: "2026-09-12",
    }, "/library", "2026-09-13")).toBe(
      "/play/bs-s1-01?tier=standard&mode=arcade",
    );
  });
});
