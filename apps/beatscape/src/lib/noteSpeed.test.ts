import { describe, expect, it } from "vitest";
import {
  approachMultiplierFromScrollBias,
  noteSpeedFromScrollBias,
  nudgeNoteSpeed,
  scrollBiasFromNoteSpeed,
} from "./noteSpeed";

describe("note speed semantics", () => {
  it("round-trips player-facing speed through the legacy scroll bias", () => {
    for (const speed of [0.5, 0.75, 1, 1.25, 1.5, 2]) {
      expect(noteSpeedFromScrollBias(scrollBiasFromNoteSpeed(speed))).toBe(speed);
    }
  });

  it("normalizes old extreme settings into the supported UI range", () => {
    expect(noteSpeedFromScrollBias(2)).toBe(0.5);
    expect(noteSpeedFromScrollBias(-0.9)).toBe(2);
    expect(noteSpeedFromScrollBias(Number.NaN)).toBe(1);
  });

  it("maps faster notes to a shorter visible approach duration", () => {
    expect(approachMultiplierFromScrollBias(scrollBiasFromNoteSpeed(2))).toBe(0.5);
    expect(approachMultiplierFromScrollBias(scrollBiasFromNoteSpeed(0.5))).toBe(2);
  });

  it("nudges in predictable quarter steps and clamps the endpoints", () => {
    expect(nudgeNoteSpeed(1, 1)).toBe(1.25);
    expect(nudgeNoteSpeed(1, -1)).toBe(0.75);
    expect(nudgeNoteSpeed(2, 1)).toBe(2);
    expect(nudgeNoteSpeed(0.5, -1)).toBe(0.5);
  });
});
