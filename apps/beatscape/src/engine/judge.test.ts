import { describe, expect, it } from "vitest";
import { judgeDelta, windowsFor } from "./judge";

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
});
