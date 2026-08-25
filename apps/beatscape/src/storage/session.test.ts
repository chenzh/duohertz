import { describe, expect, it } from "vitest";
import { shareResultsCopy, shareResultsUrl } from "../storage/session";
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
      "I just ran Neon Pulse on BeatScape — 98.5% S. Feel the Beat, Own the Scape. https://example.com/beatscape/results?run=local",
    );
  });
});
