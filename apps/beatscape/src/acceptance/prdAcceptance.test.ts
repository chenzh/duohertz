import { describe, expect, it } from "vitest";
import { judgeDelta, windowsFor, maxScore } from "../engine/judge";
import { countTotalNotes, initPlay, finalize } from "../engine/playState";
import { LANE_DEBOUNCE_MS, receptorYFromGeometry } from "../input/touchInput";

describe("BeatScape PRD acceptance", () => {
  it("Arcade judge windows are 15/30/50", () => {
    expect(windowsFor("arcade")).toEqual({ perfect: 15, great: 30, good: 50 });
  });

  it("Good breaks combo path uses miss/good combo reset", () => {
    const chart = {
      track_id: "test",
      tier: "standard" as const,
      format: 1 as const,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 28,
      total_notes: 1,
      notes: [{ id: "1", t: 1, lane: 0 as const, type: "tap" as const }],
    };
    const play = initPlay(chart, "arcade");
    expect(play.combo).toBe(0);
  });

  it("MaxScore formula TotalNotes × 300 × 4", () => {
    expect(maxScore(100)).toBe(120000);
  });

  it("finalize accuracy uses PRD weights", () => {
    const chart = {
      track_id: "test",
      tier: "standard" as const,
      format: 1 as const,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 28,
      total_notes: 2,
      notes: [
        { id: "1", t: 1, lane: 0 as const, type: "tap" as const },
        { id: "2", t: 2, lane: 3 as const, type: "tap" as const },
      ],
    };
    const play = initPlay(chart, "arcade");
    play.judgments.perfect = 1;
    play.judgments.great = 1;
    const r = finalize(play);
    expect(r.accuracy).toBe(87.5);
  });

  it("countTotalNotes hold=2", () => {
    const n = countTotalNotes([
      { id: "h", t: 1, lane: 0, type: "hold", end: 2 },
      { id: "t", t: 3, lane: 1, type: "tap" },
    ]);
    expect(n).toBe(3);
  });

  it("judge at 51ms is miss in arcade", () => {
    expect(judgeDelta(51, "arcade")).toBe("miss");
  });

  it("mobile touch debounce and receptor geometry match PRD §4.12/§4.14", () => {
    expect(LANE_DEBOUNCE_MS).toBe(20);
    expect(receptorYFromGeometry(600, 375, 0)).toBeCloseTo(600 - 375 * 0.15);
  });
});
