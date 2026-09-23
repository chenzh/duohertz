import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hasTouchInput,
  isCoarsePointer,
  LaneInputTracker,
  LANE_DEBOUNCE_MS,
  laneFromClientX,
  laneFromTouchDrag,
  receptorYFromGeometry,
} from "./touchInput";

describe("touchInput (PRD §4.12 / §4.14)", () => {
  const rect = { left: 0, top: 0, width: 400, height: 600, right: 400, bottom: 600 } as DOMRect;

  afterEach(() => vi.unstubAllGlobals());

  it("finds hybrid touch hardware without treating its fine primary pointer as mobile UI", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false }),
    });
    vi.stubGlobal("navigator", { maxTouchPoints: 5 });

    expect(isCoarsePointer()).toBe(false);
    expect(hasTouchInput()).toBe(true);
  });

  it("maps client X into four equal lanes with edge guard", () => {
    expect(laneFromClientX(10, rect)).toBeNull();
    expect(laneFromClientX(50, rect)).toBe(0);
    expect(laneFromClientX(150, rect)).toBe(1);
    expect(laneFromClientX(250, rect)).toBe(2);
    expect(laneFromClientX(350, rect)).toBe(3);
    expect(laneFromClientX(390, rect)).toBeNull();
  });

  it("maps viewport X against an offset canvas rather than its parent border", () => {
    const offsetRect = { ...rect, left: 73, right: 473 } as DOMRect;
    expect(laneFromClientX(83, offsetRect)).toBeNull();
    expect(laneFromClientX(123, offsetRect)).toBe(0);
    expect(laneFromClientX(223, offsetRect)).toBe(1);
    expect(laneFromClientX(423, offsetRect)).toBe(3);
  });

  it("keeps an owned touch lane through small boundary wobble but accepts a deliberate swipe", () => {
    expect(laneFromTouchDrag(103, rect, 0)).toBe(0);
    expect(laneFromTouchDrag(108, rect, 0)).toBe(1);
    expect(laneFromTouchDrag(97, rect, 1)).toBe(1);
    expect(laneFromTouchDrag(92, rect, 1)).toBe(0);
    expect(laneFromTouchDrag(250, rect, 0)).toBe(2);
    expect(laneFromTouchDrag(10, rect, 0)).toBeNull();
    expect(laneFromTouchDrag(103, rect, null)).toBe(1);
  });

  it("scales touch drag deadband down for narrow phone lanes", () => {
    const narrowRect = { ...rect, width: 120, right: 120 } as DOMRect;
    expect(laneFromTouchDrag(33, narrowRect, 0)).toBe(0);
    expect(laneFromTouchDrag(35, narrowRect, 0)).toBe(1);
  });

  it("places receptor at 15% of short side from bottom", () => {
    expect(receptorYFromGeometry(600, 400, 0)).toBe(600 - 400 * 0.15);
    expect(receptorYFromGeometry(400, 600, 0)).toBe(400 - 400 * 0.15);
    expect(receptorYFromGeometry(600, 400, 20)).toBe(600 - 400 * 0.15 - 20);
  });

  it("debounces same-lane presses within 20ms", () => {
    const tracker = new LaneInputTracker();
    expect(tracker.begin(1, 0, 100)).toEqual({ press: 0, release: null });
    expect(tracker.end(1)).toEqual({ press: null, release: 0 });
    expect(tracker.begin(2, 0, 100 + LANE_DEBOUNCE_MS - 1)).toEqual({ press: null, release: null });
    expect(tracker.end(2)).toEqual({ press: null, release: 0 });
    expect(tracker.begin(3, 0, 100 + LANE_DEBOUNCE_MS)).toEqual({ press: 0, release: null });
  });

  it("tracks multiple sources on different lanes", () => {
    const tracker = new LaneInputTracker();
    tracker.begin(10, 0, 0);
    tracker.begin("key:ArrowUp", 2, 0);
    expect(tracker.activeLanes()).toEqual(new Set([0, 2]));
    expect(tracker.end(10)).toEqual({ press: null, release: 0 });
    expect(tracker.activeLanes()).toEqual(new Set([2]));
  });

  it("keeps a lane held until its final owner leaves", () => {
    const tracker = new LaneInputTracker();
    expect(tracker.begin(10, 1, 0)).toEqual({ press: 1, release: null });
    expect(tracker.begin(11, 1, 50)).toEqual({ press: null, release: null });
    expect(tracker.end(10)).toEqual({ press: null, release: null });
    expect(tracker.activeLanes()).toEqual(new Set([1]));
    expect(tracker.end(11)).toEqual({ press: null, release: 1 });
    expect(tracker.activeLanes()).toEqual(new Set());
  });

  it("keeps an owned outer lane through the edge guard and can re-enter elsewhere", () => {
    const tracker = new LaneInputTracker();
    tracker.begin(10, 0, 0);
    expect(tracker.move(10, null, 40)).toEqual({ press: null, release: null });
    expect(tracker.activeLanes()).toEqual(new Set([0]));
    expect(tracker.move(10, 3, 80)).toEqual({ press: 3, release: 0 });
    expect(tracker.end(10)).toEqual({ press: null, release: 3 });
  });

  it("clears stale sources between pauses, retries, and chart changes", () => {
    const tracker = new LaneInputTracker();
    tracker.begin(10, 0, 0);
    tracker.begin(11, 2, 0);
    expect(tracker.activeSourceCount()).toBe(2);
    tracker.clear();
    expect(tracker.activeSourceCount()).toBe(0);
    expect(tracker.activeLanes()).toEqual(new Set());
    expect(tracker.end(10)).toEqual({ press: null, release: null });
  });
});
