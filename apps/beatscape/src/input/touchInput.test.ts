import { describe, expect, it } from "vitest";
import {
  LANE_DEBOUNCE_MS,
  TouchLaneTracker,
  laneFromClientX,
  receptorYFromGeometry,
} from "./touchInput";

describe("touchInput (PRD §4.12 / §4.14)", () => {
  const rect = { left: 0, top: 0, width: 400, height: 600, right: 400, bottom: 600 } as DOMRect;

  it("maps client X into four equal lanes with edge guard", () => {
    expect(laneFromClientX(20, rect)).toBeNull();
    expect(laneFromClientX(50, rect)).toBe(0);
    expect(laneFromClientX(150, rect)).toBe(1);
    expect(laneFromClientX(250, rect)).toBe(2);
    expect(laneFromClientX(350, rect)).toBe(3);
    expect(laneFromClientX(390, rect)).toBeNull();
  });

  it("places receptor at 15% of short side from bottom", () => {
    expect(receptorYFromGeometry(600, 400, 0)).toBe(600 - 400 * 0.15);
    expect(receptorYFromGeometry(400, 600, 0)).toBe(400 - 400 * 0.15);
    expect(receptorYFromGeometry(600, 400, 20)).toBe(600 - 400 * 0.15 - 20);
  });

  it("debounces same-lane presses within 20ms", () => {
    const tracker = new TouchLaneTracker();
    expect(tracker.press(1, 0, 100)).toBe(0);
    expect(tracker.press(2, 0, 100 + LANE_DEBOUNCE_MS - 1)).toBeNull();
    expect(tracker.press(3, 0, 100 + LANE_DEBOUNCE_MS)).toBe(0);
  });

  it("tracks multiple pointers on different lanes", () => {
    const tracker = new TouchLaneTracker();
    tracker.press(10, 0, 0);
    tracker.press(11, 2, 0);
    expect(tracker.activeLanes()).toEqual(new Set([0, 2]));
    expect(tracker.release(10)).toBe(0);
    expect(tracker.activeLanes()).toEqual(new Set([2]));
  });
});
