import { describe, expect, test } from "vitest";
import type { ChartJSON } from "../types/chart";
import { chartMechanicGuides, chartProfile, duoMode, MODE_GUIDANCE } from "./runSetup";

const chart: ChartJSON = {
  track_id: "track-1",
  tier: "standard",
  format: 1,
  bpm: 120,
  audio_offset_ms: 0,
  ar: 24,
  total_notes: 9,
  sections: [
    { id: "intro", t0: 0, t1: 10 },
    { id: "drop", t0: 10, t1: 20 },
  ],
  notes: [
    { id: "tap", type: "tap", lane: 0, t: 1 },
    { id: "hold", type: "hold", lane: 1, t: 2, end: 3 },
    { id: "chord", type: "chord", lanes: [0, 2], t: 4 },
  ],
};

describe("run setup guidance", () => {
  test("summarizes the selected chart for a player", () => {
    expect(chartProfile(chart, 6)).toEqual({
      judgments: 9,
      pace: 1.5,
      sections: 2,
      patterns: "Taps + Holds + Chords",
    });
  });

  test("keeps malformed durations and empty charts readable", () => {
    expect(chartProfile({ ...chart, total_notes: 0, sections: undefined, notes: [] }, 0)).toEqual({
      judgments: 0,
      pace: 0,
      sections: 0,
      patterns: "Rhythm notes",
    });
  });

  test("practice is explicitly solo and cannot become a Duo clock mode", () => {
    expect(MODE_GUIDANCE.practice.duoAvailable).toBe(false);
    expect(duoMode("practice")).toBe("casual");
    expect(duoMode("casual")).toBe("casual");
    expect(duoMode("arcade")).toBe("arcade");
  });

  test("explains advanced chart moves in first-appearance order without repeating taps", () => {
    const guided: ChartJSON = {
      ...chart,
      notes: [
        { id: "tap", type: "tap", lane: 0, t: 1 },
        { id: "slide", type: "slide", lane: 0, to: 1, t: 2, end: 3 },
        { id: "hold", type: "hold", lane: 2, t: 4, end: 5 },
        { id: "slide-again", type: "slide", lane: 1, to: 2, t: 6, end: 7 },
        { id: "chord", type: "chord", lanes: [0, 3], t: 8 },
      ],
    };
    expect(chartMechanicGuides(guided)).toEqual([
      {
        type: "slide",
        label: "Slide",
        detail: "Press the first lane, move to the target, and hold through the end.",
      },
      { type: "hold", label: "Hold", detail: "Press when it lands. Release at the end." },
      { type: "chord", label: "Chord", detail: "Hit every marked lane at the same time." },
    ]);

    expect(chartMechanicGuides(guided, "touch")).toEqual([
      {
        type: "slide",
        label: "Slide",
        detail: "Touch the first lane, slide to the target, and hold through the end.",
      },
      { type: "hold", label: "Hold", detail: "Touch and hold on the line. Lift at the end." },
      { type: "chord", label: "Chord", detail: "Touch every marked lane at the same time." },
    ]);
  });
});
