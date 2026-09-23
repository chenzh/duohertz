/** Feedback vibration (FEEL PACK, docs/BEATSCAPE-SURGE-FX.md). */

export type HapticCue = "hit" | "miss" | "confirm" | "surge" | "milestone";

type CueProfile = {
  touchPattern: number | number[];
  touchMinGapMs: number;
  gamepadMinGapMs: number;
  gamepadEffect: Readonly<GamepadEffectParameters>;
};

/**
 * Short, intentionally distinct response shapes. High-frequency rumble makes
 * successful timing feel crisp; a Miss leans on the stronger low-frequency
 * motor so it cannot be mistaken for another hit.
 */
export const HAPTIC_CUE_PROFILES: Readonly<Record<HapticCue, CueProfile>> = {
  hit: {
    touchPattern: 8,
    touchMinGapMs: 80,
    gamepadMinGapMs: 55,
    gamepadEffect: { startDelay: 0, duration: 26, strongMagnitude: 0.12, weakMagnitude: 0.38 },
  },
  miss: {
    touchPattern: 35,
    touchMinGapMs: 60,
    gamepadMinGapMs: 55,
    gamepadEffect: { startDelay: 0, duration: 90, strongMagnitude: 0.82, weakMagnitude: 0.2 },
  },
  confirm: {
    touchPattern: 6,
    touchMinGapMs: 40,
    gamepadMinGapMs: 40,
    gamepadEffect: { startDelay: 0, duration: 22, strongMagnitude: 0.08, weakMagnitude: 0.28 },
  },
  surge: {
    touchPattern: [12, 60, 24],
    touchMinGapMs: 0,
    gamepadMinGapMs: 0,
    gamepadEffect: { startDelay: 0, duration: 110, strongMagnitude: 0.42, weakMagnitude: 0.62 },
  },
  milestone: {
    touchPattern: 18,
    // A milestone is emitted immediately after the hit that crossed it. It is
    // a priority replacement cue, so it must bypass the ordinary hit throttle
    // on both feedback surfaces; milestones are already sparse by definition.
    touchMinGapMs: 0,
    gamepadMinGapMs: 0,
    gamepadEffect: { startDelay: 0, duration: 82, strongMagnitude: 0.28, weakMagnitude: 0.76 },
  },
};

type RumbleActuatorLike = {
  /** Newer Gamepad drafts expose supported effect names; older Chromium does not. */
  effects?: readonly string[];
  playEffect: (
    type: "dual-rumble",
    effect: GamepadEffectParameters,
  ) => PromiseLike<unknown> | unknown;
};

export type RumbleGamepadLike = {
  index: number;
  connected: boolean;
  mapping: string;
  /** Optional at runtime even though newer DOM typings declare it required. */
  vibrationActuator?: RumbleActuatorLike | null;
};

type ReadGamepads = () => ArrayLike<RumbleGamepadLike | null>;

/**
 * Factory keeps each player's throttle independent and makes the timing-path
 * adapter testable without mutating the browser's navigator singleton.
 */
export function createGamepadRumbler(
  readGamepads: ReadGamepads,
  now: () => number = () => performance.now(),
) {
  const lastAtByGamepad = new Map<number, number>();

  return (gamepadIndex: number, cue: HapticCue): boolean => {
    if (!Number.isInteger(gamepadIndex) || gamepadIndex < 0) return false;
    let gamepad: RumbleGamepadLike | null = null;
    try {
      gamepad = readGamepads()[gamepadIndex] ?? null;
    } catch {
      return false;
    }
    if (
      !gamepad
      || gamepad.index !== gamepadIndex
      || !gamepad.connected
      || gamepad.mapping !== "standard"
    ) return false;

    const actuator = gamepad.vibrationActuator;
    if (!actuator || typeof actuator.playEffect !== "function") return false;
    if (actuator.effects && !actuator.effects.includes("dual-rumble")) return false;

    const profile = HAPTIC_CUE_PROFILES[cue];
    const at = now();
    const previous = lastAtByGamepad.get(gamepadIndex);
    if (
      profile.gamepadMinGapMs > 0
      && previous !== undefined
      && at - previous < profile.gamepadMinGapMs
    ) return false;

    try {
      // Do not await device I/O in the judgment path. Rejections are expected
      // for hidden tabs, unsupported controller/OS pairs, and revoked access.
      const result = actuator.playEffect("dual-rumble", { ...profile.gamepadEffect });
      lastAtByGamepad.set(gamepadIndex, at);
      void Promise.resolve(result).catch(() => undefined);
      return true;
    } catch {
      return false;
    }
  };
}

let lastTouchAt: number | null = null;

/**
 * Touch vibration is currently exposed by Android/Chromium; unsupported
 * browsers (including iOS Safari) remain a silent no-op.
 */
export function vibrate(pattern: number | number[], minGapMs = 80): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  const now = performance.now();
  if (minGapMs > 0 && lastTouchAt !== null && now - lastTouchAt < minGapMs) return;
  lastTouchAt = now;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* unsupported / disabled */
  }
}

const rumbleGamepad = createGamepadRumbler(() => {
  if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") return [];
  return navigator.getGamepads();
});

export type HapticTargets = {
  touch: boolean;
  gamepadIndex?: number;
};

/** Sends one semantic cue to every currently assigned feedback surface. */
export function playHapticCue(cue: HapticCue, targets: HapticTargets): void {
  const profile = HAPTIC_CUE_PROFILES[cue];
  if (targets.touch) vibrate(profile.touchPattern, profile.touchMinGapMs);
  if (targets.gamepadIndex !== undefined) rumbleGamepad(targets.gamepadIndex, cue);
}
