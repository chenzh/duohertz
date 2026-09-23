import { describe, expect, test } from "vitest";
import {
  judgmentLabelCenterX,
  judgmentTimingCenterX,
  judgmentTimingLabel,
} from "./judgmentFeedback";

describe("judgment timing feedback", () => {
  test("names early and late Hold release outcomes", () => {
    expect(judgmentTimingLabel({ judgment: "miss", deltaMs: -800, accent: "hold-release-miss" }))
      .toBe("EARLY RELEASE");
    expect(judgmentTimingLabel({ judgment: "miss", deltaMs: 71, accent: "hold-release-miss" }))
      .toBe("LATE RELEASE");
    expect(judgmentTimingLabel({ judgment: "great", deltaMs: -12, accent: "hold-release" }))
      .toBe("EARLY RELEASE");
  });

  test("does not invent timing for an untouched note or a centered hit", () => {
    expect(judgmentTimingLabel({ judgment: "miss", deltaMs: 51 })).toBeNull();
    expect(judgmentTimingLabel({ judgment: "perfect", deltaMs: 4 })).toBeNull();
  });

  test("explains the two unfinished Slide gestures without inventing timing", () => {
    expect(judgmentTimingLabel({
      judgment: "miss",
      deltaMs: 71,
      accent: "slide-target-miss",
    })).toBe("REACH TARGET");
    expect(judgmentTimingLabel({
      judgment: "miss",
      deltaMs: 71,
      accent: "slide-hold-miss",
    })).toBe("HOLD TO END");
  });

  test("identifies a banked Chord lane instead of calling its timeout late", () => {
    expect(judgmentTimingLabel({
      judgment: "great",
      deltaMs: 91,
      accent: "chord-assist",
    })).toBe("ASSIST");
  });

  test("keeps compact coaching for ordinary landed notes", () => {
    expect(judgmentTimingLabel({ judgment: "good", deltaMs: -40 })).toBe("EARLY");
    expect(judgmentTimingLabel({ judgment: "great", deltaMs: 16 })).toBe("LATE");
  });

  test("keeps long gesture coaching inside the first and last mobile lanes", () => {
    expect(judgmentTimingCenterX(18, 288, "EARLY RELEASE")).toBe(56);
    expect(judgmentTimingCenterX(270, 288, "LATE RELEASE")).toBe(232);
    expect(judgmentTimingCenterX(18, 288, "REACH TARGET")).toBe(56);
    expect(judgmentTimingCenterX(270, 288, "HOLD TO END")).toBe(232);
    expect(judgmentTimingCenterX(18, 288, "EARLY")).toBe(18);
  });

  test("keeps scaled outlined judgment words inside narrow outer lanes", () => {
    const halfExtent = (70 + 4) * 1.2 / 2 + 2;
    expect(judgmentLabelCenterX(18, 298, 70, 1.2, 4)).toBeCloseTo(halfExtent);
    expect(judgmentLabelCenterX(280, 298, 70, 1.2, 4)).toBeCloseTo(298 - halfExtent);
    expect(judgmentLabelCenterX(149, 298, 70, 1.2, 4)).toBe(149);
  });

  test("centers an oversized judgment safely and ignores invalid metrics", () => {
    expect(judgmentLabelCenterX(12, 60, 120, 1.2, 5)).toBe(30);
    expect(judgmentLabelCenterX(12, 60, Number.NaN, 1.2, 5)).toBe(12);
  });
});
