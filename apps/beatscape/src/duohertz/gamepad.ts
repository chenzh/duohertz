import {
  gamepadButtonIsPressed,
  STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON,
  STANDARD_GAMEPAD_RIGHT_FACE_BUTTON,
  type GamepadLike,
} from "../input/gamepadInput";
import type { KeyIndex } from "./chart";

/** Solo layout: the standard bottom face button starts the pulse; the right face adds the echo. */
export function pressedDuohertzGamepadKeys(
  gamepad: GamepadLike | null | undefined,
  inputCount: 1 | 2,
): Set<KeyIndex> {
  const keys = new Set<KeyIndex>();
  if (!gamepad?.connected || gamepad.mapping !== "standard") return keys;
  if (gamepadButtonIsPressed(gamepad.buttons[STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON])) keys.add(0);
  if (inputCount === 2 && gamepadButtonIsPressed(gamepad.buttons[STANDARD_GAMEPAD_RIGHT_FACE_BUTTON])) keys.add(1);
  return keys;
}
