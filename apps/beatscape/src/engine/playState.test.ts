import { describe, expect, it } from "vitest";
import { GameSession } from "./playState";
import type { ChartJSON } from "../types/chart";

const slideChart: ChartJSON = {
  track_id: "test-slide",
  tier: "standard",
  format: 1,
  bpm: 120,
  ar: 28,
  audio_offset_ms: 0,
  total_notes: 2,
  notes: [{ type: "slide", lane: 0, to: 2, t: 1, end: 1.5 }],
};

describe("GameSession feel", () => {
  it("slide stays active after head until tail is judged", () => {
    const s = new GameSession(slideChart, "arcade");
    const head = s.press(0, 1000);
    expect(head?.judgment).not.toBe("miss");
    expect(s.isComplete).toBe(false);

    const tail = s.press(2, 1500);
    expect(tail).not.toBeNull();
    expect(s.isComplete).toBe(true);
  });

  it("practice slow-mo triggers after 3 consecutive misses", () => {
    const tapChart: ChartJSON = {
      track_id: "test",
      tier: "easy",
      format: 1,
      bpm: 120,
      ar: 28,
      audio_offset_ms: 0,
      total_notes: 3,
      notes: [
        { type: "tap", lane: 0, t: 1 },
        { type: "tap", lane: 1, t: 2 },
        { type: "tap", lane: 2, t: 3 },
      ],
    };
    const s = new GameSession(tapChart, "practice");
    s.tick(1060);
    s.tick(2060);
    s.tick(3060);
    expect(s.consumeSlowTrigger()).toBe(true);
  });
});
