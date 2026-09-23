import { describe, expect, it } from "vitest";
import { isPhysicalKeyboardSignal } from "./usePhysicalKeyboardInput";

function signal(code: string, extras: Record<string, unknown> = {}): KeyboardEvent {
  return {
    code,
    isComposing: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    target: null,
    ...extras,
  } as KeyboardEvent;
}

describe("physical keyboard hint detection", () => {
  it("recognizes lane and navigation keys outside editable controls", () => {
    expect(isPhysicalKeyboardSignal(signal("KeyA"))).toBe(true);
    expect(isPhysicalKeyboardSignal(signal("ArrowLeft"))).toBe(true);
    expect(isPhysicalKeyboardSignal(signal("Semicolon"))).toBe(true);
  });

  it("does not infer a game keyboard from typing, IME, or browser shortcuts", () => {
    expect(isPhysicalKeyboardSignal(signal("KeyA", { target: { tagName: "INPUT" } }))).toBe(false);
    expect(isPhysicalKeyboardSignal(signal("KeyA", { target: { isContentEditable: true } }))).toBe(false);
    expect(isPhysicalKeyboardSignal(signal("KeyA", { isComposing: true }))).toBe(false);
    expect(isPhysicalKeyboardSignal(signal("Unidentified"))).toBe(false);
    expect(isPhysicalKeyboardSignal(signal("ShiftLeft"))).toBe(false);
    expect(isPhysicalKeyboardSignal(signal("Escape"))).toBe(false);
    expect(isPhysicalKeyboardSignal(signal("MediaPlayPause"))).toBe(false);
    expect(isPhysicalKeyboardSignal(signal("KeyR", { metaKey: true }))).toBe(false);
  });
});
