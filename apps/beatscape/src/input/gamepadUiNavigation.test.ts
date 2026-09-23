import { describe, expect, it } from "vitest";
import { spatialGamepadTarget, type GamepadNavigationRect } from "./gamepadUiNavigation";

function rect(left: number, top: number, width = 80, height = 44): GamepadNavigationRect {
  return { left, top, right: left + width, bottom: top + height };
}

describe("gamepad UI spatial navigation", () => {
  const grid = [
    rect(0, 0),
    rect(120, 0),
    rect(0, 80),
    rect(120, 80),
  ];

  it("moves to the aligned neighbor in a two-dimensional control grid", () => {
    expect(spatialGamepadTarget(grid, 0, "right")).toBe(1);
    expect(spatialGamepadTarget(grid, 0, "down")).toBe(2);
    expect(spatialGamepadTarget(grid, 3, "left")).toBe(2);
    expect(spatialGamepadTarget(grid, 3, "up")).toBe(1);
  });

  it("prefers a farther aligned control over a slightly nearer diagonal jump", () => {
    const controls = [
      rect(100, 100),
      rect(105, 180),
      rect(210, 150),
    ];
    expect(spatialGamepadTarget(controls, 0, "down")).toBe(1);
  });

  it("returns null when no control exists in the requested half-plane", () => {
    expect(spatialGamepadTarget(grid, 0, "left")).toBeNull();
    expect(spatialGamepadTarget(grid, 0, "up")).toBeNull();
  });
});
