import { describe, expect, it } from "vitest";
import { noteWidthForLane, NOTE_LANE_RATIO, NOTE_MAX_PX } from "./noteSprite";

describe("noteWidthForLane", () => {
  it("scales with lane width up to the cap", () => {
    expect(noteWidthForLane(60)).toBeCloseTo(48);
    expect(noteWidthForLane(100)).toBe(NOTE_MAX_PX);
    expect(noteWidthForLane(200)).toBe(NOTE_MAX_PX);
  });

  it("uses readable defaults", () => {
    expect(NOTE_LANE_RATIO).toBe(0.8);
    expect(NOTE_MAX_PX).toBe(60);
  });
});
