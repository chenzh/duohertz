import { afterEach, describe, expect, it, vi } from "vitest";
import { canBindDuohertzCode, DEFAULT_DUOHERTZ_KEYMAP, DUOHERTZ_KEYMAP_STORAGE_KEY,
  loadDuohertzKeymap, saveDuohertzKeymap } from "./keymap";

afterEach(() => vi.unstubAllGlobals());

describe("duohertz physical key bindings", () => {
  it("keeps new-game keys separate from legacy BeatScape settings", () => {
    const getItem = vi.fn(() => null);
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem, setItem });
    expect(loadDuohertzKeymap()).toEqual(DEFAULT_DUOHERTZ_KEYMAP);
    expect(saveDuohertzKeymap({ one: "KeyA", left: "KeyQ", right: "ArrowRight" })).toBe(true);
    expect(getItem).toHaveBeenCalledWith(DUOHERTZ_KEYMAP_STORAGE_KEY);
    expect(setItem).toHaveBeenCalledWith(DUOHERTZ_KEYMAP_STORAGE_KEY,
      JSON.stringify({ one: "KeyA", left: "KeyQ", right: "ArrowRight" }));
    expect(getItem).not.toHaveBeenCalledWith("bs_settings");
  });

  it("rejects duplicate two-key controls, reserved keys and corrupt storage", () => {
    expect(canBindDuohertzCode("KeyQ")).toBe(true);
    for (const code of ["Escape", "Tab", "Enter", "Backspace", "MetaLeft", "F5", ""]) {
      expect(canBindDuohertzCode(code)).toBe(false);
    }
    const setItem = vi.fn();
    const getItem = vi.fn(() => JSON.stringify({ one: "Space", left: "KeyF", right: "KeyF" }));
    vi.stubGlobal("localStorage", { getItem, setItem });
    expect(loadDuohertzKeymap()).toEqual(DEFAULT_DUOHERTZ_KEYMAP);
    expect(saveDuohertzKeymap({ one: "Space", left: "KeyF", right: "KeyF" })).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
  });

  it("does not claim a changed binding when local storage rejects the write", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => { throw new DOMException("denied", "SecurityError"); },
    });
    expect(saveDuohertzKeymap({ one: "KeyA", left: "KeyF", right: "KeyJ" })).toBe(false);
  });
});
