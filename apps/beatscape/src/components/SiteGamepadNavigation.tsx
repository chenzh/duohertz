import { useCallback, useEffect, useRef, useState } from "react";
import {
  pressedStandardGamepadUiButtons,
  STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON,
  STANDARD_GAMEPAD_DPAD_DOWN_BUTTON,
  STANDARD_GAMEPAD_DPAD_LEFT_BUTTON,
  STANDARD_GAMEPAD_DPAD_RIGHT_BUTTON,
  STANDARD_GAMEPAD_DPAD_UP_BUTTON,
  STANDARD_GAMEPAD_RIGHT_FACE_BUTTON,
} from "../input/gamepadInput";
import {
  spatialGamepadTarget,
  type GamepadNavigationDirection,
} from "../input/gamepadUiNavigation";
import { useGamepadAssignments } from "../input/useGamepadAssignments";
import { useRouter } from "../router";

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
const HINT_DURATION_MS = 3_600;

function supportsSiteNavigation(path: string): boolean {
  return path !== "/"
    && path !== "/results"
    && path !== "/calibrate"
    && !path.startsWith("/play/")
    && !path.startsWith("/duo/");
}

function isFocusableTarget(element: HTMLElement): boolean {
  if (element.closest("[data-gamepad-ignore]")) return false;
  if (element.closest("[hidden], [inert], [aria-hidden=\"true\"]")) return false;
  if (element.getAttribute("aria-disabled") === "true") return false;
  if ("disabled" in element && Boolean((element as HTMLButtonElement).disabled)) return false;
  if (element.tabIndex < 0 && element.getAttribute("role") !== "radio") return false;
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function focusableTargets(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter(isFocusableTarget);
}

function initialTarget(targets: readonly HTMLElement[]): HTMLElement | null {
  return targets.find((element) => element.matches(".site-main [data-gamepad-default]"))
    ?? targets.find((element) => element.matches(".site-main .btn.primary"))
    ?? targets.find((element) => element.closest(".site-main"))
    ?? targets[0]
    ?? null;
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
  if (next === current) return true;
  setNativeInputValue(input, next);
  return true;
}

function adjustSelect(select: HTMLSelectElement, direction: -1 | 1): boolean {
  const enabled = Array.from(select.options).filter((option) => !option.disabled);
  const current = enabled.findIndex((option) => option.index === select.selectedIndex);
  if (current < 0 || enabled.length === 0) return false;
  const next = Math.min(enabled.length - 1, Math.max(0, current + direction));
  if (next === current) return true;
  select.selectedIndex = enabled[next]!.index;
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function moveFocus(direction: GamepadNavigationDirection): void {
  const targets = focusableTargets();
  if (targets.length === 0) return;
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const currentIndex = active ? targets.indexOf(active) : -1;
  if (currentIndex < 0) {
    const target = initialTarget(targets);
    if (target) focusTarget(target);
    return;
  }

  if (direction === "left" || direction === "right") {
    const step = direction === "left" ? -1 : 1;
    if (active instanceof HTMLInputElement && adjustInput(active, step)) return;
    if (active instanceof HTMLSelectElement && adjustSelect(active, step)) return;
  }

  const nextIndex = spatialGamepadTarget(
    targets.map((target) => target.getBoundingClientRect()),
    currentIndex,
    direction,
  );
  if (nextIndex !== null) focusTarget(targets[nextIndex]!);
}

function activateFocusedTarget(): void {
  const targets = focusableTargets();
  const active = document.activeElement instanceof HTMLElement && targets.includes(document.activeElement)
    ? document.activeElement
    : initialTarget(targets);
  if (!active) return;
  focusTarget(active);
  if (
    active instanceof HTMLInputElement
    && ["text", "search", "number", "range"].includes(active.type)
  ) return;
  active.click();
}

export function SiteGamepadNavigation() {
  const { path, navigate } = useRouter();
  const enabled = supportsSiteNavigation(path);
  const [gamepadIndex] = useGamepadAssignments(1);
  const [hintVisible, setHintVisible] = useState(false);
  const hintTimerRef = useRef<number | null>(null);

  const showHint = useCallback(() => {
    setHintVisible(true);
    if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => setHintVisible(false), HINT_DURATION_MS);
  }, []);

  useEffect(() => () => {
    if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
    document.body.classList.remove("gamepad-ui-active");
  }, []);

  useEffect(() => {
    const leaveGamepadMode = () => document.body.classList.remove("gamepad-ui-active");
    window.addEventListener("pointerdown", leaveGamepadMode, true);
    window.addEventListener("keydown", leaveGamepadMode, true);
    return () => {
      window.removeEventListener("pointerdown", leaveGamepadMode, true);
      window.removeEventListener("keydown", leaveGamepadMode, true);
    };
  }, []);

  useEffect(() => {
    document.body.classList.remove("gamepad-ui-active");
    if (!enabled || gamepadIndex === null) {
      setHintVisible(false);
      return;
    }
    showHint();

    let frame = 0;
    let neutral = false;
    let previous = new Set<number>();
    const repeatAt = new Map<number, number>();

    const tick = (now: number) => {
      let gamepad: Gamepad | null = null;
      try {
        gamepad = navigator.getGamepads?.()[gamepadIndex] ?? null;
      } catch {
        // Permissions Policy may revoke access after a controller connected.
      }
      if (!gamepad?.connected || gamepad.mapping !== "standard") {
        neutral = false;
        previous = new Set();
        repeatAt.clear();
        frame = requestAnimationFrame(tick);
        return;
      }

      const pressed = pressedStandardGamepadUiButtons(gamepad);
      if (!neutral) {
        neutral = pressed.size === 0;
        previous = pressed;
        frame = requestAnimationFrame(tick);
        return;
      }

      let moved = false;
      for (const [button, direction] of DIRECTION_BUTTONS) {
        if (!pressed.has(button)) {
          repeatAt.delete(button);
          continue;
        }
        const fresh = !previous.has(button);
        const due = now >= (repeatAt.get(button) ?? Number.POSITIVE_INFINITY);
        if (!fresh && !due) continue;
        repeatAt.set(button, now + (fresh ? INITIAL_REPEAT_DELAY_MS : REPEAT_INTERVAL_MS));
        if (!moved) {
          document.body.classList.add("gamepad-ui-active");
          showHint();
          moveFocus(direction);
          moved = true;
        }
      }

      if (pressed.has(STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON)
          && !previous.has(STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON)) {
        document.body.classList.add("gamepad-ui-active");
        showHint();
        activateFocusedTarget();
      }
      if (pressed.has(STANDARD_GAMEPAD_RIGHT_FACE_BUTTON)
          && !previous.has(STANDARD_GAMEPAD_RIGHT_FACE_BUTTON)) {
        document.body.classList.add("gamepad-ui-active");
        showHint();
        const back = focusableTargets().find((target) => target.matches(".site-main .back-link"));
        if (back) back.click();
        else if (path !== "/") navigate("/");
      }

      previous = pressed;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      document.body.classList.remove("gamepad-ui-active");
    };
  }, [enabled, gamepadIndex, navigate, path, showHint]);

  if (!enabled || gamepadIndex === null || !hintVisible) return null;
  return (
    <div
      className="gamepad-site-hint"
      role="note"
      aria-label="Controller navigation. Use the D-pad or left stick to move, bottom face to select, and right face to go back or Home."
    >
      <span>Controller</span>
      <strong>D-pad / stick · Move</strong>
      <strong>Face down · Select</strong>
      <strong>Face right · Back</strong>
    </div>
  );
}
