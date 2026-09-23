import { describe, expect, it } from "vitest";
import { isAllPerfect, isFullCombo, judgeDelta, windowsFor } from "./judge";

describe("BeatScape judge windows (PRD §4.3)", () => {
  it("Arcade uses 15/30/50 not NeonBeat 22/45/80", () => {
    const w = windowsFor("arcade");
    expect(w.perfect).toBe(15);
    expect(w.great).toBe(30);
    expect(w.good).toBe(50);
  });

  it("classifies delta correctly in arcade", () => {
    expect(judgeDelta(0, "arcade")).toBe("perfect");
    expect(judgeDelta(15, "arcade")).toBe("perfect");
    expect(judgeDelta(16, "arcade")).toBe("great");
    expect(judgeDelta(30, "arcade")).toBe("great");
    expect(judgeDelta(31, "arcade")).toBe("good");
    expect(judgeDelta(50, "arcade")).toBe("good");
    expect(judgeDelta(51, "arcade")).toBe("miss");
  });

  it("Casual uses 28/55/90", () => {
    const w = windowsFor("casual");
    expect(w.perfect).toBe(28);
    expect(w.good).toBe(90);
  });

  it("only awards Full Combo to a complete chain without Good or Miss", () => {
    expect(isFullCombo({ perfect: 8, great: 2, good: 0, miss: 0 }, 10)).toBe(true);
    expect(isFullCombo({ perfect: 9, great: 0, good: 1, miss: 0 }, 10)).toBe(false);
    expect(isFullCombo({ perfect: 9, great: 0, good: 0, miss: 0 }, 10)).toBe(false);
    expect(isFullCombo({ perfect: 9, great: 0, good: 0, miss: 1 }, 10)).toBe(false);
  });

  it("only awards All Perfect when every complete judgment is Perfect", () => {
    expect(isAllPerfect({ perfect: 10, great: 0, good: 0, miss: 0 }, 10)).toBe(true);
    expect(isAllPerfect({ perfect: 9, great: 1, good: 0, miss: 0 }, 10)).toBe(false);
    expect(isAllPerfect({ perfect: 9, great: 0, good: 0, miss: 0 }, 10)).toBe(false);
  });
});
