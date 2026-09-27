import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DUOHERTZ_OFFSET_STORAGE_KEY,
  clockTimeAtInputMs,
  judgedSongTimeMs,
  loadDuohertzOffsetMs,
  saveDuohertzOffsetMs,
} from "./timing";

afterEach(() => vi.unstubAllGlobals());

describe("duohertz timing adjustment", () => {
  it("compensates late inputs consistently for presses, releases and miss deadlines", () => {
    expect(judgedSongTimeMs(1_080, 80)).toBe(1_000);
    expect(judgedSongTimeMs(1_920, -80)).toBe(2_000);
  });

  it("uses recent physical input time while rejecting stale or malformed event timestamps", () => {
    const origin = 1_700_000_000_000;
    expect(clockTimeAtInputMs(1_100, 990, 1_100, origin)).toBe(990);
    expect(clockTimeAtInputMs(1_100, origin + 990, 1_100, origin)).toBe(990);
    expect(clockTimeAtInputMs(1_100, 700, 1_100, origin)).toBe(1_100);
    expect(clockTimeAtInputMs(1_100, undefined, 1_100, origin)).toBe(1_100);
  });

  it("keeps the new game's saved offset separate from legacy BeatScape timing", () => {
    const getItem = vi.fn((key: string) => key === "bs_offset_ms" ? "200" : "-65");
    vi.stubGlobal("localStorage", { getItem });
    expect(loadDuohertzOffsetMs()).toBe(-65);
    expect(getItem).toHaveBeenCalledWith(DUOHERTZ_OFFSET_STORAGE_KEY);
    expect(getItem).not.toHaveBeenCalledWith("bs_offset_ms");
  });

  it("clamps corrupt or extreme offsets and does not store non-finite measurements", () => {
    const getItem = vi.fn(() => "500");
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem, setItem });
    expect(loadDuohertzOffsetMs()).toBe(200);
    getItem.mockReturnValue("broken");
    expect(loadDuohertzOffsetMs()).toBe(0);
    expect(saveDuohertzOffsetMs(-250)).toBe(true);
    expect(saveDuohertzOffsetMs(Number.NaN)).toBe(false);
    expect(setItem).toHaveBeenCalledExactlyOnceWith(DUOHERTZ_OFFSET_STORAGE_KEY, "-200");
  });
});
