import { describe, expect, it } from "vitest";
import { crossedComboMilestone } from "./comboFeedback";

describe("combo milestone feedback", () => {
  it("returns an exact milestone", () => {
    expect(crossedComboMilestone(9, 10)).toBe(10);
  });

  it("detects thresholds skipped by a same-frame chord", () => {
    expect(crossedComboMilestone(9, 11)).toBe(10);
    expect(crossedComboMilestone(49, 51)).toBe(50);
  });

  it("returns the highest threshold when one frame crosses several", () => {
    expect(crossedComboMilestone(49, 102)).toBe(100);
  });

  it("does not repeat or invent milestones without forward progress", () => {
    expect(crossedComboMilestone(10, 10)).toBeNull();
    expect(crossedComboMilestone(24, 24)).toBeNull();
    expect(crossedComboMilestone(49, 2)).toBeNull();
  });
});
