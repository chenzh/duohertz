import { useEffect, useState } from "react";
import { hasBrowserShortcutModifier } from "./keyMap";

type KeyboardSignal = Pick<
  KeyboardEvent,
  "code" | "isComposing" | "altKey" | "ctrlKey" | "metaKey" | "target"
>;

/** A key used outside text editing is evidence of an attached keyboard on touch devices. */
export function isPhysicalKeyboardSignal(event: KeyboardSignal): boolean {
  if (!event.code || event.code === "Unidentified" || event.isComposing) return false;
  if (hasBrowserShortcutModifier(event)) return false;
  if (/^(Shift|Control|Alt|Meta)(Left|Right)?$/.test(event.code)) return false;
  // Phone Back, media buttons and generic confirm actions are not evidence
  // that the player has an external keyboard for the four rhythm lanes.
  if (/^(Escape|Backspace|Delete|Enter|NumpadEnter|Browser|Media|AudioVolume|Power|Sleep)/.test(event.code)) {
    return false;
  }
  const target = event.target as HTMLElement | null;
  if (target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? "")) {
    return false;
  }
  return true;
}

// A route change should not hide the legend immediately after the player used
// an external keyboard. A reload starts fresh; there is no persisted guess
// about whether a keyboard is still connected.
let keyboardSeenThisPage = false;

export function usePhysicalKeyboardInput(): boolean {
  const [seen, setSeen] = useState(keyboardSeenThisPage);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isPhysicalKeyboardSignal(event)) return;
      keyboardSeenThisPage = true;
      setSeen(true);
    };
    // Modal gameplay guards stop bubbling so lane presses cannot reach the
    // field. Observe the key first, while the modal still owns the action.
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);

  return seen;
}
