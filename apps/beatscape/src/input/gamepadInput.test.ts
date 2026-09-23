import { describe, expect, it } from "vitest";
import {
  connectedStandardGamepadIndexes,
  GAMEPAD_UI_STICK_THRESHOLD,
  gamepadButtonIsPressed,
  leftStickUiDirectionButton,
  laneFromStandardGamepadButton,
  pressedStandardGamepadButtons,
  pressedStandardGamepadUiButtons,
  reconcileGamepadAssignments,
  sameGamepadAssignments,
  STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON,
  STANDARD_GAMEPAD_DPAD_DOWN_BUTTON,
  STANDARD_GAMEPAD_DPAD_LEFT_BUTTON,
  STANDARD_GAMEPAD_DPAD_RIGHT_BUTTON,
  STANDARD_GAMEPAD_DPAD_UP_BUTTON,
  STANDARD_GAMEPAD_MENU_BUTTON,
  STANDARD_GAMEPAD_RIGHT_FACE_BUTTON,
  type GamepadUiLike,
} from "./gamepadInput";

function gamepad(
  index: number,
  pressedButtons: number[] = [],
  mapping = "standard",
  axes: readonly number[] = [0, 0, 0, 0],
): GamepadUiLike {
  const buttons = Array.from({ length: 17 }, (_, button) => ({
    pressed: pressedButtons.includes(button),
    value: pressedButtons.includes(button) ? 1 : 0,
  }));
  return { index, connected: true, mapping, buttons, axes };
}

describe("standard gamepad input", () => {
  it("maps D-pad and face-button geometry onto the same four lanes", () => {
    expect([14, 13, 12, 15].map(laneFromStandardGamepadButton)).toEqual([0, 1, 2, 3]);
    expect([2, 0, 3, 1].map(laneFromStandardGamepadButton)).toEqual([0, 1, 2, 3]);
    expect(laneFromStandardGamepadButton(9)).toBeNull();
    expect(STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON).toBe(0);
    expect(STANDARD_GAMEPAD_RIGHT_FACE_BUTTON).toBe(1);
    expect(STANDARD_GAMEPAD_MENU_BUTTON).toBe(9);
    expect([
      STANDARD_GAMEPAD_DPAD_UP_BUTTON,
      STANDARD_GAMEPAD_DPAD_DOWN_BUTTON,
      STANDARD_GAMEPAD_DPAD_LEFT_BUTTON,
      STANDARD_GAMEPAD_DPAD_RIGHT_BUTTON,
    ]).toEqual([12, 13, 14, 15]);
  });

  it("accepts digital presses and analog button values at the stable threshold", () => {
    expect(gamepadButtonIsPressed({ pressed: true, value: 0 })).toBe(true);
    expect(gamepadButtonIsPressed({ pressed: false, value: 0.5 })).toBe(true);
    expect(gamepadButtonIsPressed({ pressed: false, value: 0.49 })).toBe(false);
    expect(gamepadButtonIsPressed(undefined)).toBe(false);
  });

  it("reads only gameplay buttons from a connected standard controller", () => {
    expect(pressedStandardGamepadButtons(gamepad(0, [14, 0, 9]))).toEqual(new Set([14, 0]));
    expect(pressedStandardGamepadButtons(gamepad(0, [14], ""))).toEqual(new Set());
    expect(pressedStandardGamepadButtons({ ...gamepad(0, [14]), connected: false })).toEqual(new Set());
  });

  it("maps deliberate left-stick menu input through a drift-safe dominant axis", () => {
    expect(leftStickUiDirectionButton(gamepad(0, [], "standard", [0.8, 0]))).toBe(15);
    expect(leftStickUiDirectionButton(gamepad(0, [], "standard", [-0.8, 0]))).toBe(14);
    expect(leftStickUiDirectionButton(gamepad(0, [], "standard", [0, -0.8]))).toBe(12);
    expect(leftStickUiDirectionButton(gamepad(0, [], "standard", [0, 0.8]))).toBe(13);
    expect(leftStickUiDirectionButton(gamepad(0, [], "standard", [0.8, -0.9]))).toBe(12);
    expect(leftStickUiDirectionButton(gamepad(0, [], "standard", [0.9, -0.8]))).toBe(15);
    expect(leftStickUiDirectionButton(gamepad(0, [], "standard", [
      GAMEPAD_UI_STICK_THRESHOLD - 0.01,
      0,
    ]))).toBeNull();
  });

  it("combines menu actions with one stick direction and prioritizes a real D-pad", () => {
    expect(pressedStandardGamepadUiButtons(gamepad(0, [0], "standard", [0.9, 0]))).toEqual(
      new Set([15, 0]),
    );
    expect(pressedStandardGamepadUiButtons(gamepad(0, [14, 1], "standard", [0.9, 0]))).toEqual(
      new Set([14, 1]),
    );
    expect(pressedStandardGamepadUiButtons(gamepad(0, [0], "", [0.9, 0]))).toEqual(new Set());
  });

  it("discovers sparse standard controller indexes without accepting raw layouts", () => {
    expect(connectedStandardGamepadIndexes([
      null,
      gamepad(1),
      gamepad(2, [], ""),
      gamepad(3),
    ])).toEqual([1, 3]);
  });

  it("keeps Duo seats stable when one controller disconnects", () => {
    expect(reconcileGamepadAssignments([], [2, 5], 2)).toEqual([2, 5]);
    expect(reconcileGamepadAssignments([2, 5], [5], 2)).toEqual([null, 5]);
    expect(reconcileGamepadAssignments([null, 5], [5, 7], 2)).toEqual([7, 5]);
    expect(reconcileGamepadAssignments([7, 5], [5, 7], 1)).toEqual([7]);
  });

  it("compares assignment snapshots without reallocating consumers", () => {
    expect(sameGamepadAssignments([0, null], [0, null])).toBe(true);
    expect(sameGamepadAssignments([0, null], [1, null])).toBe(false);
    expect(sameGamepadAssignments([0], [0, null])).toBe(false);
  });
});
