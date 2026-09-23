import { describe, expect, it } from "vitest";
import { RunClock } from "./runClock";

describe("RunClock", () => {
  it("starts at the real Start action, not page entry or loading", () => {
    const clock = new RunClock();
    clock.setPaused(true, 100);
    expect(clock.durationMs(120_000)).toBe(0);
    clock.start(120_000);
    expect(clock.durationMs(124_250)).toBe(4_250);
  });

  it("excludes repeat pause signals and exit confirmation holds", () => {
    const clock = new RunClock();
    clock.start(100);
    clock.setPaused(true, 1_100);
    clock.setPaused(true, 1_200); // Duo's second field reports the same pause.
    expect(clock.durationMs(6_100)).toBe(1_000);
    clock.setPaused(false, 6_100);
    clock.setPaused(true, 7_100); // Exit confirmation pauses independently.
    clock.setPaused(false, 10_100);
    expect(clock.durationMs(12_100)).toBe(4_000);
  });

  it("resets on restart and rematch instead of carrying the previous round", () => {
    const clock = new RunClock();
    clock.start(0);
    clock.setPaused(true, 1_000);
    clock.start(20_000);
    expect(clock.durationMs(21_000)).toBe(1_000);
    clock.reset();
    expect(clock.durationMs(99_000)).toBe(0);
  });
});
