import { describe, expect, it } from "vitest";
import {
  DEFAULT_KEYS,
  KEY_PRESETS,
  captureKeyCode,
  codesForPreset,
  hasBrowserShortcutModifier,
  hasDuplicateKeys,
  keyLabel,
  keyLabels,
  keyLabelsForDisplayLayout,
  keyLabelsForLayout,
  laneFromKeyEvent,
  normalizeKeys,
  partnerKeysFor,
  presetIdFor,
} from "./keyMap";

function ev(code: string, key: string, modifiers: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return { code, key, ...modifiers } as KeyboardEvent;
}

describe("keyMap", () => {
  it("ships the arrow keys as the default layout", () => {
    expect(DEFAULT_KEYS).toEqual(["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"]);
  });

  it("upgrades legacy single-character bindings to physical codes", () => {
    expect(normalizeKeys(["D", "F", "J", "K"])).toEqual(["KeyD", "KeyF", "KeyJ", "KeyK"]);
  });

  it("leaves already-normalized codes untouched", () => {
    const arrows = ["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"];
    expect(normalizeKeys(arrows)).toEqual(arrows);
  });

  it("pads a short binding back up to four lanes", () => {
    const padded = normalizeKeys(["KeyA"]);
    expect(padded).toHaveLength(4);
    expect(padded[0]).toBe("KeyA");
  });

  it("resolves lanes by physical code", () => {
    const keys = codesForPreset("arrows");
    expect(laneFromKeyEvent(ev("ArrowLeft", "ArrowLeft"), keys)).toBe(0);
    expect(laneFromKeyEvent(ev("ArrowUp", "ArrowUp"), keys)).toBe(2);
    expect(laneFromKeyEvent(ev("ArrowRight", "ArrowRight"), keys)).toBe(3);
  });

  it("falls back to the reported key for legacy and symbolic bindings", () => {
    expect(laneFromKeyEvent(ev("Semicolon", ";"), ["KeyD", "Semicolon", "KeyJ", "KeyK"])).toBe(1);
    expect(laneFromKeyEvent(ev("", "d"), ["d", "f", "j", "k"])).toBe(0);
  });

  it("returns -1 for a key that is not bound", () => {
    expect(laneFromKeyEvent(ev("KeyQ", "q"), DEFAULT_KEYS)).toBe(-1);
  });

  it("ignores the printed letter so AZERTY keeps the same hand positions", () => {
    // Same physical key, different letter printed: the binding follows the finger.
    const wasd = codesForPreset("wasd");
    expect(laneFromKeyEvent(ev("KeyA", "q"), wasd)).toBe(0);
    expect(laneFromKeyEvent(ev("KeyW", "z"), wasd)).toBe(2);
  });

  it("prefers a physical binding over an earlier legacy glyph on AZERTY", () => {
    const mixed = ["q", "KeyA", "KeyS", "KeyD"];
    expect(laneFromKeyEvent(ev("KeyA", "q"), mixed)).toBe(1);
    expect(laneFromKeyEvent(ev("KeyQ", "q"), mixed)).toBe(0);
  });

  it("leaves browser modifier chords unbound while retaining shifted lane input", () => {
    const arrows = codesForPreset("arrows");
    expect(laneFromKeyEvent(ev("ArrowLeft", "ArrowLeft", { altKey: true }), arrows)).toBe(-1);
    expect(laneFromKeyEvent(ev("ArrowLeft", "ArrowLeft", { ctrlKey: true }), arrows)).toBe(-1);
    expect(laneFromKeyEvent(ev("ArrowLeft", "ArrowLeft", { metaKey: true }), arrows)).toBe(-1);
    expect(laneFromKeyEvent(ev("ArrowLeft", "ArrowLeft", { shiftKey: true }), arrows)).toBe(0);
    expect(hasBrowserShortcutModifier(ev("KeyR", "r", { ctrlKey: true }))).toBe(true);
    expect(hasBrowserShortcutModifier(ev("KeyR", "R", { shiftKey: true }))).toBe(false);
  });

  it("never captures a browser shortcut while rebinding", () => {
    expect(captureKeyCode(ev("KeyR", "r", { ctrlKey: true }))).toBeNull();
    expect(captureKeyCode(ev("KeyP", "p", { metaKey: true }))).toBeNull();
    expect(captureKeyCode(ev("ArrowLeft", "ArrowLeft", { altKey: true }))).toBeNull();
    expect(captureKeyCode(ev("KeyZ", "Z", { shiftKey: true }))).toBe("KeyZ");
  });

  it("identifies which preset is bound", () => {
    expect(presetIdFor(["KeyD", "KeyF", "KeyJ", "KeyK"])).toBe("dfjk");
    expect(presetIdFor(["KeyA", "KeyS", "KeyW", "KeyD"])).toBe("wasd");
    expect(presetIdFor(DEFAULT_KEYS)).toBe("arrows");
    expect(presetIdFor(["KeyZ", "KeyX", "KeyC", "KeyV"])).toBe("custom");
  });

  it("flags duplicate bindings so they cannot be saved", () => {
    expect(hasDuplicateKeys(["KeyD", "KeyD", "KeyJ", "KeyK"])).toBe(true);
    expect(hasDuplicateKeys(["KeyA", "KeyS", "KeyW", "KeyD"])).toBe(false);
  });

  it("renders arrows as glyphs, letters and digits plainly", () => {
    expect(keyLabels(DEFAULT_KEYS)).toEqual(["←", "↓", "↑", "→"]);
    expect(keyLabel("KeyD")).toBe("D");
    expect(keyLabel("Digit1")).toBe("1");
    expect(keyLabel("")).toBe("—");
  });

  it("renders physical codes with the glyphs from an AZERTY layout map", () => {
    const azerty = new Map([
      ["KeyA", "q"],
      ["KeyS", "s"],
      ["KeyW", "z"],
      ["KeyD", "d"],
    ]);
    expect(keyLabelsForLayout(codesForPreset("wasd"), azerty)).toEqual(["Q", "S", "Z", "D"]);
    expect(keyLabelsForLayout(DEFAULT_KEYS, azerty)).toEqual(["←", "↓", "↑", "→"]);
  });

  it("falls back when a layout map omits or returns unsafe labels", () => {
    const partial = new Map([
      ["KeyA", ""],
      ["KeyS", "Dead"],
      ["KeyW", "Unidentified"],
      ["KeyD", "d"],
    ]);
    expect(keyLabelsForLayout(codesForPreset("wasd"), partial)).toEqual(["A", "S", "W", "D"]);
    expect(keyLabelsForLayout(codesForPreset("wasd"), null)).toEqual(["A", "S", "W", "D"]);
  });

  it("lets players override unavailable or inaccurate keyboard maps without changing bindings", () => {
    const wasd = codesForPreset("wasd");
    const detected = new Map([["KeyA", "a"], ["KeyW", "w"]]);
    expect(keyLabelsForDisplayLayout(wasd, "auto", detected)).toEqual(["A", "S", "W", "D"]);
    expect(keyLabelsForDisplayLayout(wasd, "azerty", detected)).toEqual(["Q", "S", "Z", "D"]);
    expect(keyLabelsForDisplayLayout(wasd, "qwerty", new Map([["KeyA", "q"]]))).toEqual(["A", "S", "W", "D"]);
    expect(keyLabelsForDisplayLayout(["KeyY", "KeyZ", "ArrowLeft", "Semicolon"], "qwertz"))
      .toEqual(["Z", "Y", "←", ";"]);
    expect(wasd).toEqual(["KeyA", "KeyS", "KeyW", "KeyD"]);
  });

  it("keeps every preset at four distinct lanes", () => {
    for (const p of KEY_PRESETS) {
      expect(p.codes).toHaveLength(4);
      expect(hasDuplicateKeys(p.codes)).toBe(false);
    }
  });

  it("gives duo P2 a binding that never collides with P1", () => {
    // P1 on the arrow cluster (bottom-right island) → P2 gets WASD, the tight
    // left-hand block on the opposite corner. Hands never meet.
    expect(partnerKeysFor(DEFAULT_KEYS)).toEqual(codesForPreset("wasd"));
    // P1 already on WASD → P2 gets the arrows, the only preset that far away.
    expect(partnerKeysFor(codesForPreset("wasd"))).toEqual(codesForPreset("arrows"));
    // P1 on D F J K → WASD is out (both layouts use `D`), so P2 gets the arrows.
    expect(partnerKeysFor(codesForPreset("dfjk"))).toEqual(codesForPreset("arrows"));
    // Custom bindings get the same treatment — WASD when it's free.
    expect(partnerKeysFor(["KeyZ", "KeyX", "KeyC", "KeyV"])).toEqual(codesForPreset("wasd"));
    // The contract that actually matters: zero shared codes for any P1 input.
    for (const p of [...KEY_PRESETS.map((k) => k.codes), ["KeyZ", "KeyX", "KeyC", "KeyV"]]) {
      const p2 = partnerKeysFor(p);
      for (const code of p2) expect(p).not.toContain(code);
      expect(p2).toHaveLength(4);
      expect(new Set(p2).size).toBe(4);
    }
  });

  it("keeps duo P2 playable when P1 squats on all three presets", () => {
    // One key out of each preset: A (wasd), ← (arrows), J (dfjk). No preset is
    // free wholesale, so P2 is dealt four leftovers instead of nothing.
    const p1 = ["KeyA", "ArrowLeft", "KeyJ", "KeyS"];
    const p2 = partnerKeysFor(p1);
    expect(p2).toHaveLength(4);
    expect(new Set(p2).size).toBe(4);
    for (const code of p2) expect(p1).not.toContain(code);
  });
});
