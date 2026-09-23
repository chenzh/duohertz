import { describe, expect, it } from "vitest";
import {
  inputEventPerformanceTimeMs,
  MAX_INPUT_EVENT_AGE_MS,
  songTimeAtInputMs,
} from "./eventTiming";

describe("input event timing", () => {
  it("keeps a recent monotonic event on the performance timeline", () => {
    expect(inputEventPerformanceTimeMs(940, 1_000, 1_700_000_000_000)).toBe(940);
  });

  it("normalizes an epoch-based event timestamp", () => {
    const origin = 1_700_000_000_000;
    expect(inputEventPerformanceTimeMs(origin + 940, 1_000, origin)).toBe(940);
  });

  it("fails closed for invalid, stale, or future timestamps", () => {
    const now = 1_000;
    const origin = 1_700_000_000_000;
    expect(inputEventPerformanceTimeMs(Number.NaN, now, origin)).toBe(now);
    expect(inputEventPerformanceTimeMs(0, now, origin)).toBe(now);
    expect(inputEventPerformanceTimeMs(now - MAX_INPUT_EVENT_AGE_MS - 1, now, origin)).toBe(now);
    expect(inputEventPerformanceTimeMs(now + 3, now, origin)).toBe(now);
  });

  it("rewinds song time by event age at normal and Practice rates", () => {
    expect(songTimeAtInputMs(1_065, 1, 1_000, 1_065)).toBe(1_000);
    expect(songTimeAtInputMs(1_032.5, 0.5, 1_000, 1_065)).toBe(1_000);
  });

  it("does not rewind when the normalized event is too old", () => {
    expect(songTimeAtInputMs(2_000, 1, 1_000, 1_000 + MAX_INPUT_EVENT_AGE_MS + 1)).toBe(2_000);
  });
});
