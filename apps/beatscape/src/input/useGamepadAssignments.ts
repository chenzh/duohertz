import { useCallback, useEffect, useState } from "react";
import {
  connectedStandardGamepadIndexes,
  reconcileGamepadAssignments,
  sameGamepadAssignments,
} from "./gamepadInput";

function readStandardGamepadIndexes(): number[] {
  if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") return [];
  try {
    return connectedStandardGamepadIndexes(navigator.getGamepads());
  } catch {
    // Permissions Policy and hardened browsers may reject Gamepad access.
    // Keyboard and touch remain fully usable, so this is a silent fallback.
    return [];
  }
}

/**
 * Assign visible standard controllers to player slots while preserving each
 * surviving seat across disconnect/reconnect events.
 */
export function useGamepadAssignments(slotCount: number): Array<number | null> {
  const normalizedSlotCount = Math.max(0, Math.floor(slotCount));
  const [assignments, setAssignments] = useState<Array<number | null>>(
    () => Array.from({ length: normalizedSlotCount }, () => null),
  );

  const refresh = useCallback(() => {
    const available = readStandardGamepadIndexes();
    setAssignments((current) => {
      const next = reconcileGamepadAssignments(current, available, normalizedSlotCount);
      return sameGamepadAssignments(current, next) ? current : next;
    });
  }, [normalizedSlotCount]);

  useEffect(() => {
    refresh();
    window.addEventListener("gamepadconnected", refresh);
    window.addEventListener("gamepaddisconnected", refresh);
    window.addEventListener("focus", refresh);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("gamepadconnected", refresh);
      window.removeEventListener("gamepaddisconnected", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh]);

  return assignments;
}
