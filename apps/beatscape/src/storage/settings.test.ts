import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DISPLAY_NAME_CHANGE_EVENT,
  DISPLAY_NAME_STORAGE_KEY,
  loadSettings,
  saveOffsetMs,
  saveSettings,
  saveDisplayName,
  SETTINGS_CHANGE_EVENT,
  SETTINGS_STORAGE_KEY,
} from "./settings";

afterEach(() => vi.unstubAllGlobals());

describe("haptics setting", () => {
  it("keeps feedback on for legacy saves that predate the control", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({ hitsound: false, fancyFx: false })),
    });

    const settings = loadSettings();
    expect(settings.haptics).toBe(true);
    expect(settings.backgroundDim).toBe(0.25);
    expect(settings.hitsound).toBe(false);
  });

  it("preserves an explicit haptics opt-out independently from hitsound", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({ hitsound: true, haptics: false })),
    });

    const settings = loadSettings();
    expect(settings.haptics).toBe(false);
    expect(settings.hitsound).toBe(true);
  });
});

describe("background dim setting", () => {
  it.each([
    [0.8, 0.8],
    [-1, 0],
    [2, 1],
    ["bright", 0.25],
  ])("normalizes %p to %p", (stored, expected) => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => JSON.stringify({ backgroundDim: stored })),
    });

    expect(loadSettings().backgroundDim).toBe(expected);
  });
});

describe("printed keyboard labels", () => {
  it("defaults old and invalid saves to browser detection and keeps valid manual choices", () => {
    const getItem = vi.fn(() => JSON.stringify({ hitsound: false }));
    vi.stubGlobal("localStorage", { getItem });
    expect(loadSettings().keyLabelLayout).toBe("auto");

    getItem.mockReturnValue(JSON.stringify({ keyLabelLayout: "azerty" }));
    expect(loadSettings().keyLabelLayout).toBe("azerty");

    getItem.mockReturnValue(JSON.stringify({ keyLabelLayout: "unknown" }));
    expect(loadSettings().keyLabelLayout).toBe("auto");
  });
});

describe("display name notifications", () => {
  it("notifies the current tab after a successful canonicalized save", () => {
    const setItem = vi.fn();
    const dispatchEvent = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    vi.stubGlobal("window", { dispatchEvent });

    expect(saveDisplayName("  Night Rider  ")).toBe(true);
    expect(setItem).toHaveBeenCalledWith(DISPLAY_NAME_STORAGE_KEY, "Night Rider");
    expect(dispatchEvent).toHaveBeenCalledOnce();
    expect(dispatchEvent.mock.calls[0]?.[0]).toMatchObject({ type: DISPLAY_NAME_CHANGE_EVENT });
  });

  it("does not claim a profile update when storage rejects the write", () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("localStorage", {
      setItem: () => { throw new DOMException("denied", "SecurityError"); },
    });
    vi.stubGlobal("window", { dispatchEvent });

    expect(saveDisplayName("Night Rider")).toBe(false);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});

describe("settings notifications", () => {
  it("notifies the current tab only after a successful save", () => {
    const setItem = vi.fn();
    const dispatchEvent = vi.fn();
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => null), setItem });
    vi.stubGlobal("window", { dispatchEvent });

    expect(saveSettings({ musicVolume: 0.25 })).toBe(true);
    expect(setItem).toHaveBeenCalledWith(
      SETTINGS_STORAGE_KEY,
      expect.stringContaining('"musicVolume":0.25'),
    );
    expect(dispatchEvent).toHaveBeenCalledOnce();
    expect(dispatchEvent.mock.calls[0]?.[0]).toMatchObject({ type: SETTINGS_CHANGE_EVENT });
  });

  it("does not broadcast a setting that storage rejected", () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: () => { throw new DOMException("denied", "SecurityError"); },
    });
    vi.stubGlobal("window", { dispatchEvent });

    expect(saveSettings({ hitsound: false })).toBe(false);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});

describe("global timing offset", () => {
  it("clamps finite values and refuses to persist non-finite drafts", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });

    expect(saveOffsetMs(250)).toBe(true);
    expect(saveOffsetMs(-250)).toBe(true);
    expect(saveOffsetMs(Number.NaN)).toBe(false);
    expect(saveOffsetMs(Number.POSITIVE_INFINITY)).toBe(false);
    expect(setItem.mock.calls).toEqual([
      ["bs_offset_ms", "200"],
      ["bs_offset_ms", "-200"],
    ]);
  });
});
