// Standard Gamepad helpers (W3C Gamepad mapping).
//
// BeatScape only accepts controllers the browser has normalized to the
// `standard` layout. Raw controller button orders vary by device and OS; a
// guessed mapping would turn a timing game into an unfair one.

export const GAMEPAD_BUTTON_PRESS_THRESHOLD = 0.5;
/** Bottom face button in the W3C standard layout (primary UI action). */
export const STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON = 0;
/** Right face button in the W3C standard layout (secondary/back UI action). */
export const STANDARD_GAMEPAD_RIGHT_FACE_BUTTON = 1;
/** Right-center Options/Menu button in the W3C standard layout. */
export const STANDARD_GAMEPAD_MENU_BUTTON = 9;
export const STANDARD_GAMEPAD_DPAD_UP_BUTTON = 12;
export const STANDARD_GAMEPAD_DPAD_DOWN_BUTTON = 13;
export const STANDARD_GAMEPAD_DPAD_LEFT_BUTTON = 14;
export const STANDARD_GAMEPAD_DPAD_RIGHT_BUTTON = 15;
/** W3C standard mapping: left stick horizontal/vertical axes. */
export const STANDARD_GAMEPAD_LEFT_STICK_X_AXIS = 0;
export const STANDARD_GAMEPAD_LEFT_STICK_Y_AXIS = 1;
/** High enough to reject common stick drift while keeping deliberate menu flicks responsive. */
export const GAMEPAD_UI_STICK_THRESHOLD = 0.65;

/**
 * Four-lane geometry shared by the D-pad and the right face-button diamond:
 *
 * lane 0 = left, lane 1 = down/bottom, lane 2 = up/top, lane 3 = right.
 *
 * W3C standard buttons: face bottom/right/left/top = 0/1/2/3 and
 * D-pad up/down/left/right = 12/13/14/15.
 */
export const STANDARD_GAMEPAD_LANE_BUTTONS = [
  { lane: 0, buttons: [STANDARD_GAMEPAD_DPAD_LEFT_BUTTON, 2] },
  { lane: 1, buttons: [STANDARD_GAMEPAD_DPAD_DOWN_BUTTON, 0] },
  { lane: 2, buttons: [STANDARD_GAMEPAD_DPAD_UP_BUTTON, 3] },
  { lane: 3, buttons: [STANDARD_GAMEPAD_DPAD_RIGHT_BUTTON, 1] },
] as const;

const STANDARD_BUTTON_TO_LANE = new Map<number, number>(
  STANDARD_GAMEPAD_LANE_BUTTONS.flatMap(({ lane, buttons }) =>
    buttons.map((button) => [button, lane] as const),
  ),
);

export type GamepadButtonLike = Pick<GamepadButton, "pressed" | "value">;

export type GamepadLike = {
  index: number;
  connected: boolean;
  mapping: string;
  buttons: readonly GamepadButtonLike[];
};

export type GamepadUiLike = GamepadLike & {
  axes: readonly number[];
};

export function laneFromStandardGamepadButton(button: number): number | null {
  return STANDARD_BUTTON_TO_LANE.get(button) ?? null;
}

export function gamepadButtonIsPressed(button: GamepadButtonLike | undefined): boolean {
  return Boolean(
    button
    && (button.pressed || Number(button.value) >= GAMEPAD_BUTTON_PRESS_THRESHOLD),
  );
}

export function pressedStandardGamepadButtons(gamepad: GamepadLike): Set<number> {
  const pressed = new Set<number>();
  if (!gamepad.connected || gamepad.mapping !== "standard") return pressed;
  for (const button of STANDARD_BUTTON_TO_LANE.keys()) {
    if (gamepadButtonIsPressed(gamepad.buttons[button])) pressed.add(button);
  }
  return pressed;
}

const STANDARD_GAMEPAD_UI_DIRECTION_BUTTONS = [
  STANDARD_GAMEPAD_DPAD_UP_BUTTON,
  STANDARD_GAMEPAD_DPAD_DOWN_BUTTON,
  STANDARD_GAMEPAD_DPAD_LEFT_BUTTON,
  STANDARD_GAMEPAD_DPAD_RIGHT_BUTTON,
] as const;

const STANDARD_GAMEPAD_UI_ACTION_BUTTONS = [
  STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON,
  STANDARD_GAMEPAD_RIGHT_FACE_BUTTON,
] as const;

/**
 * Normalize the standard left stick into the same direction IDs as the D-pad.
 * One dominant axis wins on diagonals so a single stick flick cannot move two
 * controls in one frame. A real D-pad direction takes priority when both input
 * surfaces are held.
 */
export function leftStickUiDirectionButton(gamepad: GamepadUiLike): number | null {
  if (!gamepad.connected || gamepad.mapping !== "standard") return null;
  const rawX = Number(gamepad.axes[STANDARD_GAMEPAD_LEFT_STICK_X_AXIS] ?? 0);
  const rawY = Number(gamepad.axes[STANDARD_GAMEPAD_LEFT_STICK_Y_AXIS] ?? 0);
  const x = Number.isFinite(rawX) ? rawX : 0;
  const y = Number.isFinite(rawY) ? rawY : 0;
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  if (Math.max(absX, absY) < GAMEPAD_UI_STICK_THRESHOLD) return null;
  if (absX > absY) {
    return x < 0 ? STANDARD_GAMEPAD_DPAD_LEFT_BUTTON : STANDARD_GAMEPAD_DPAD_RIGHT_BUTTON;
  }
  return y < 0 ? STANDARD_GAMEPAD_DPAD_UP_BUTTON : STANDARD_GAMEPAD_DPAD_DOWN_BUTTON;
}

/** Menu controls only: D-pad/left-stick directions plus select/back faces. */
export function pressedStandardGamepadUiButtons(gamepad: GamepadUiLike): Set<number> {
  const pressed = new Set<number>();
  if (!gamepad.connected || gamepad.mapping !== "standard") return pressed;
  for (const button of STANDARD_GAMEPAD_UI_DIRECTION_BUTTONS) {
    if (gamepadButtonIsPressed(gamepad.buttons[button])) pressed.add(button);
  }
  if (pressed.size === 0) {
    const stickDirection = leftStickUiDirectionButton(gamepad);
    if (stickDirection !== null) pressed.add(stickDirection);
  }
  for (const button of STANDARD_GAMEPAD_UI_ACTION_BUTTONS) {
    if (gamepadButtonIsPressed(gamepad.buttons[button])) pressed.add(button);
  }
  return pressed;
}

export function connectedStandardGamepadIndexes(
  gamepads: ArrayLike<GamepadLike | null>,
): number[] {
  return Array.from(gamepads)
    .filter((gamepad): gamepad is GamepadLike => Boolean(
      gamepad?.connected && gamepad.mapping === "standard",
    ))
    .map((gamepad) => gamepad.index)
    .sort((a, b) => a - b);
}

/**
 * Keep surviving assignments in their current player slot, then fill empty
 * slots with newly available controllers. This prevents P2's controller from
 * jumping to P1 merely because P1 disconnected from a Duo run.
 */
export function reconcileGamepadAssignments(
  previous: readonly (number | null)[],
  availableIndexes: readonly number[],
  slotCount: number,
): Array<number | null> {
  const safeSlotCount = Math.max(0, Math.floor(slotCount));
  const available = new Set(
    availableIndexes.filter((index) => Number.isInteger(index) && index >= 0),
  );
  const used = new Set<number>();
  const next = Array.from({ length: safeSlotCount }, (_, slot) => {
    const assigned = previous[slot];
    if (assigned === null || assigned === undefined || !available.has(assigned) || used.has(assigned)) {
      return null;
    }
    used.add(assigned);
    return assigned;
  });

  const unassigned = [...available].filter((index) => !used.has(index)).sort((a, b) => a - b);
  let candidate = 0;
  for (let slot = 0; slot < next.length && candidate < unassigned.length; slot += 1) {
    if (next[slot] !== null) continue;
    next[slot] = unassigned[candidate++]!;
  }
  return next;
}

export function sameGamepadAssignments(
  a: readonly (number | null)[],
  b: readonly (number | null)[],
): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
