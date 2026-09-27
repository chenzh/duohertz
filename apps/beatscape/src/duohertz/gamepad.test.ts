import { describe, expect, it } from "vitest";
import { pressedDuohertzGamepadKeys } from "./gamepad";
import type { GamepadLike } from "../input/gamepadInput";

function pad(pressed: number[], mapping = "standard", connected = true): GamepadLike {
  return {
    index: 0,
    connected,
    mapping,
    buttons: Array.from({ length: 17 }, (_, index) => ({
      pressed: pressed.includes(index),
      value: pressed.includes(index) ? 1 : 0,
    })),
  };
}

describe("duohertz standard gamepad", () => {
  it("uses one face button for Easy and two independent face buttons for Standard/Hard", () => {
    expect(pressedDuohertzGamepadKeys(pad([0, 1]), 1)).toEqual(new Set([0]));
    expect(pressedDuohertzGamepadKeys(pad([0, 1]), 2)).toEqual(new Set([0, 1]));
    expect(pressedDuohertzGamepadKeys(pad([1]), 2)).toEqual(new Set([1]));
  });

  it("ignores raw, disconnected, and unrelated controller buttons", () => {
    expect(pressedDuohertzGamepadKeys(pad([0, 1], ""), 2)).toEqual(new Set());
    expect(pressedDuohertzGamepadKeys(pad([0], "standard", false), 1)).toEqual(new Set());
    expect(pressedDuohertzGamepadKeys(pad([9, 12, 14]), 2)).toEqual(new Set());
  });

  it("accepts a deliberate analog face-button press at the shared threshold", () => {
    const analog = {
      ...pad([]),
      buttons: pad([]).buttons.map((button, index) => ({
        ...button,
        value: index === 0 ? 0.5 : index === 1 ? 0.49 : 0,
      })),
    };
    expect(pressedDuohertzGamepadKeys(analog, 2)).toEqual(new Set([0]));
  });
});
