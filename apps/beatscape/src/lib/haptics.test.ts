import { describe, expect, it, vi } from "vitest";
import {
  HAPTIC_CUE_PROFILES,
  createGamepadRumbler,
  type RumbleGamepadLike,
} from "./haptics";

function controller(
  index: number,
  playEffect: (type: "dual-rumble", effect: GamepadEffectParameters) => PromiseLike<unknown> | unknown,
  overrides: Partial<RumbleGamepadLike> = {},
): RumbleGamepadLike {
  return {
    index,
    connected: true,
    mapping: "standard",
    vibrationActuator: { effects: ["dual-rumble"], playEffect },
    ...overrides,
  };
}

describe("gamepad haptics", () => {
  it("uses a crisp high-frequency hit and a longer, stronger miss", () => {
    const hit = HAPTIC_CUE_PROFILES.hit.gamepadEffect;
    const miss = HAPTIC_CUE_PROFILES.miss.gamepadEffect;
    expect(hit.weakMagnitude).toBeGreaterThan(hit.strongMagnitude ?? 0);
    expect(miss.strongMagnitude).toBeGreaterThan(hit.strongMagnitude ?? 0);
    expect(miss.duration).toBeGreaterThan(hit.duration ?? 0);
  });

  it("plays only on a connected standard controller with dual-rumble support", () => {
    const playEffect = vi.fn(() => Promise.resolve("complete"));
    const gamepads: Array<RumbleGamepadLike | null> = [controller(0, playEffect)];
    const rumble = createGamepadRumbler(() => gamepads, () => 100);

    expect(rumble(0, "hit")).toBe(true);
    expect(playEffect).toHaveBeenCalledWith("dual-rumble", HAPTIC_CUE_PROFILES.hit.gamepadEffect);

    gamepads[0] = controller(0, playEffect, { connected: false });
    expect(rumble(0, "miss")).toBe(false);
    gamepads[0] = controller(0, playEffect, { mapping: "" });
    expect(rumble(0, "miss")).toBe(false);
    gamepads[0] = controller(0, playEffect, {
      vibrationActuator: { effects: ["trigger-rumble"], playEffect },
    });
    expect(rumble(0, "miss")).toBe(false);
    expect(rumble(-1, "miss")).toBe(false);
  });

  it("throttles each player independently without blocking milestone cues", () => {
    let at = 1_000;
    const p1 = vi.fn(() => Promise.resolve("complete"));
    const p2 = vi.fn(() => Promise.resolve("complete"));
    const rumble = createGamepadRumbler(
      () => [controller(0, p1), controller(1, p2)],
      () => at,
    );

    expect(rumble(0, "hit")).toBe(true);
    expect(rumble(0, "hit")).toBe(false);
    expect(rumble(1, "hit")).toBe(true);
    at += HAPTIC_CUE_PROFILES.hit.gamepadMinGapMs;
    expect(rumble(0, "hit")).toBe(true);
    expect(rumble(0, "milestone")).toBe(true);
    expect(HAPTIC_CUE_PROFILES.milestone.touchMinGapMs).toBe(0);
    expect(p1).toHaveBeenCalledTimes(3);
    expect(p2).toHaveBeenCalledTimes(1);
  });

  it("contains synchronous throws and asynchronous actuator rejection", async () => {
    const rejected = createGamepadRumbler(
      () => [controller(0, () => Promise.reject(new DOMException("Hidden", "InvalidStateError")))],
      () => 1_000,
    );
    expect(rejected(0, "miss")).toBe(true);
    await Promise.resolve();

    const thrown = createGamepadRumbler(
      () => [controller(0, () => { throw new Error("Actuator unavailable"); })],
      () => 1_000,
    );
    expect(thrown(0, "miss")).toBe(false);
  });
});
