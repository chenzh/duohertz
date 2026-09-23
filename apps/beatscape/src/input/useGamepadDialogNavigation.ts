import { useEffect, useRef, type RefObject } from "react";
import {
  pressedStandardGamepadUiButtons,
  STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON,
  STANDARD_GAMEPAD_DPAD_DOWN_BUTTON,
  STANDARD_GAMEPAD_DPAD_LEFT_BUTTON,
  STANDARD_GAMEPAD_DPAD_RIGHT_BUTTON,
  STANDARD_GAMEPAD_DPAD_UP_BUTTON,
  STANDARD_GAMEPAD_RIGHT_FACE_BUTTON,
} from "./gamepadInput";
import {
  spatialGamepadTarget,
  type GamepadNavigationDirection,
} from "./gamepadUiNavigation";

const DIRECTION_BUTTONS: ReadonlyArray<[number, GamepadNavigationDirection]> = [
  [STANDARD_GAMEPAD_DPAD_UP_BUTTON, "up"],
  [STANDARD_GAMEPAD_DPAD_DOWN_BUTTON, "down"],
  [STANDARD_GAMEPAD_DPAD_LEFT_BUTTON, "left"],
  [STANDARD_GAMEPAD_DPAD_RIGHT_BUTTON, "right"],
];

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not(:disabled)",
  "input:not(:disabled):not([type=hidden])",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "summary",
  "[tabindex]",
].join(",");

const INITIAL_REPEAT_DELAY_MS = 360;
const REPEAT_INTERVAL_MS = 110;

function isFocusableTarget(element: HTMLElement): boolean {
  if (element.closest("[hidden], [inert], [aria-hidden=\"true\"]")) return false;
  if (element.getAttribute("aria-disabled") === "true") return false;
  if ("disabled" in element && Boolean((element as HTMLButtonElement).disabled)) return false;
  if (element.tabIndex < 0 && element.getAttribute("role") !== "radio") return false;
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function focusableTargets(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter(isFocusableTarget);
}

function focusTarget(target: HTMLElement): void {
  target.focus({ preventScroll: true });
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "nearest",
    inline: "nearest",
  });
}

function setNativeInputValue(input: HTMLInputElement, value: number): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, String(value));
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function adjustInput(input: HTMLInputElement, direction: -1 | 1): boolean {
  if (input.type !== "range" && input.type !== "number") return false;
  const current = Number(input.value);
  const step = input.step && input.step !== "any" ? Number(input.step) : 1;
  const min = input.min === "" ? Number.NEGATIVE_INFINITY : Number(input.min);
  const max = input.max === "" ? Number.POSITIVE_INFINITY : Number(input.max);
  if (!Number.isFinite(current) || !Number.isFinite(step) || step <= 0) return false;
  const next = Math.min(max, Math.max(min, Number((current + step * direction).toFixed(6))));
  if (next !== current) setNativeInputValue(input, next);
  return true;
}

function adjustSelect(select: HTMLSelectElement, direction: -1 | 1): boolean {
  const enabled = Array.from(select.options).filter((option) => !option.disabled);
  const current = enabled.findIndex((option) => option.index === select.selectedIndex);
  if (current < 0 || enabled.length === 0) return false;
  const next = Math.min(enabled.length - 1, Math.max(0, current + direction));
  if (next !== current) {
    select.selectedIndex = enabled[next]!.index;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
  return true;
}

function preferredTarget(
  container: HTMLElement,
  targets: readonly HTMLElement[],
  defaultSelector?: string,
): HTMLElement | undefined {
  const selected = defaultSelector
    ? container.querySelector<HTMLElement>(defaultSelector)
    : null;
  if (selected && targets.includes(selected)) return selected;
  return targets.find((target) => target.hasAttribute("data-gamepad-default")) ?? targets[0];
}

function moveFocus(
  container: HTMLElement,
  direction: GamepadNavigationDirection,
  defaultSelector?: string,
): void {
  const targets = focusableTargets(container);
  if (targets.length === 0) return;
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const currentIndex = active ? targets.indexOf(active) : -1;
  if (currentIndex < 0) {
    const preferred = preferredTarget(container, targets, defaultSelector);
    if (preferred) focusTarget(preferred);
    return;
  }

  if (direction === "left" || direction === "right") {
    const step = direction === "left" ? -1 : 1;
    if (active instanceof HTMLInputElement && adjustInput(active, step)) return;
    if (active instanceof HTMLSelectElement && adjustSelect(active, step)) return;
    const spatialIndex = spatialGamepadTarget(
      targets.map((target) => target.getBoundingClientRect()),
      currentIndex,
      direction,
    );
    if (spatialIndex !== null) focusTarget(targets[spatialIndex]!);
    return;
  }

  // Pause menus are read top-to-bottom even when their final actions use a
  // two-column visual layout. Linear vertical movement is deterministic on
  // desktop, portrait phones, and compact landscape layouts alike.
  const step = direction === "up" ? -1 : 1;
  const nextIndex = (currentIndex + step + targets.length) % targets.length;
  focusTarget(targets[nextIndex]!);
}

function activateFocusedTarget(container: HTMLElement, defaultSelector?: string): void {
  const targets = focusableTargets(container);
  const focused = document.activeElement instanceof HTMLElement && targets.includes(document.activeElement)
    ? document.activeElement
    : null;
  // Results can intentionally hide a duplicate in-card primary action on
  // phones because the same action is mirrored in the fixed touch bar. A
  // bottom-face press without D-pad movement must still invoke that product
  // default, while D-pad focus remains limited to actually visible controls.
  const configuredDefault = !focused && defaultSelector
    ? container.querySelector<HTMLElement>(defaultSelector)
    : null;
  const active = focused ?? configuredDefault ?? preferredTarget(container, targets, defaultSelector);
  if (!active) return;
  if (targets.includes(active)) focusTarget(active);
  if (
    active instanceof HTMLInputElement
    && ["text", "search", "number", "range"].includes(active.type)
  ) return;
  active.click();
}

type Options<T extends HTMLElement> = {
  containerRef: RefObject<T | null>;
  defaultSelector?: string;
  enabled: boolean;
  gamepadIndexes: readonly number[];
  onBack: () => void;
};

/** Controller focus, adjustment, select, and back behavior for an active modal. */
export function useGamepadDialogNavigation<T extends HTMLElement>({
  containerRef,
  defaultSelector,
  enabled,
  gamepadIndexes,
  onBack,
}: Options<T>): void {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!enabled || gamepadIndexes.length === 0 || typeof navigator.getGamepads !== "function") {
      return;
    }

    let frame = 0;
    let neutral = false;
    let previous = new Map<number, Set<number>>();
    const repeatAt = new Map<string, number>();

    const tick = (now: number) => {
      const pressedByGamepad = new Map<number, Set<number>>();
      for (const gamepadIndex of gamepadIndexes) {
        let gamepad: Gamepad | null = null;
        try {
          gamepad = navigator.getGamepads()[gamepadIndex] ?? null;
        } catch {
          // Permissions Policy can revoke access after the controller connects.
        }
        if (!gamepad?.connected || gamepad.mapping !== "standard") continue;
        pressedByGamepad.set(gamepadIndex, pressedStandardGamepadUiButtons(gamepad));
      }

      if (pressedByGamepad.size === 0) {
        neutral = false;
        previous = new Map();
        repeatAt.clear();
        frame = requestAnimationFrame(tick);
        return;
      }

      if (!neutral) {
        neutral = Array.from(pressedByGamepad.values()).every((pressed) => pressed.size === 0);
        previous = pressedByGamepad;
        frame = requestAnimationFrame(tick);
        return;
      }

      const container = containerRef.current;
      let handled = false;
      if (container) {
        for (const [gamepadIndex, pressed] of pressedByGamepad) {
          const prior = previous.get(gamepadIndex) ?? new Set<number>();
          for (const [button, direction] of DIRECTION_BUTTONS) {
            const repeatKey = `${gamepadIndex}:${button}`;
            if (!pressed.has(button)) {
              repeatAt.delete(repeatKey);
              continue;
            }
            const fresh = !prior.has(button);
            const due = now >= (repeatAt.get(repeatKey) ?? Number.POSITIVE_INFINITY);
            if (!fresh && !due) continue;
            repeatAt.set(
              repeatKey,
              now + (fresh ? INITIAL_REPEAT_DELAY_MS : REPEAT_INTERVAL_MS),
            );
            if (!handled) {
              document.body.classList.add("gamepad-ui-active");
              moveFocus(container, direction, defaultSelector);
              handled = true;
            }
          }

          if (!handled
              && pressed.has(STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON)
              && !prior.has(STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON)) {
            document.body.classList.add("gamepad-ui-active");
            activateFocusedTarget(container, defaultSelector);
            handled = true;
          }
          if (!handled
              && pressed.has(STANDARD_GAMEPAD_RIGHT_FACE_BUTTON)
              && !prior.has(STANDARD_GAMEPAD_RIGHT_FACE_BUTTON)) {
            document.body.classList.add("gamepad-ui-active");
            onBackRef.current();
            handled = true;
          }
        }
      }

      previous = pressedByGamepad;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      document.body.classList.remove("gamepad-ui-active");
    };
  }, [containerRef, defaultSelector, enabled, gamepadIndexes]);
}
