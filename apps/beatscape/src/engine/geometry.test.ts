import { describe, expect, it } from "vitest";
import { APPROACH_VISIBLE_BEATS, approachSec, noteProximityFactor, noteScreenY } from "./geometry";

describe("geometry feel", () => {
  it("approachSec uses slower visible beats than legacy 50", () => {
    expect(APPROACH_VISIBLE_BEATS).toBeGreaterThan(50);
    const legacy = (50 / 24) * (60 / 120);
    const current = approachSec(24, 120);
    expect(current).toBeGreaterThan(legacy);
  });
  it("noteProximityFactor peaks at receptor", () => {
    expect(noteProximityFactor(100, 100)).toBe(1);
    expect(noteProximityFactor(0, 100)).toBeLessThan(0.5);
  });

  it("noteScreenY eases near receptor without changing hit time", () => {
    const receptor = 200;
    const approach = 2;
    const atHit = noteScreenY(5, 5, receptor, approach);
    expect(atHit).toBeCloseTo(receptor, 1);
    const before = noteScreenY(5, 4.9, receptor, approach);
    expect(before).toBeLessThan(receptor);
  });
});
