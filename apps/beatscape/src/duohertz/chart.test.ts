import { describe, expect, it } from "vitest";
import { parseDuohertzChart } from "./chart";

const easy = {
  format: 2,
  theme: "duohertz",
  track_id: "dh-first-pulse",
  tier: "easy",
  input_count: 1,
  bpm: 120,
  audio_offset_ms: 0,
  total_notes: 2,
  notes: [
    { id: "n1", type: "tap", t: 1, key: 0 },
    { id: "n2", type: "hold", t: 2, end: 3, key: 0 },
  ],
};

describe("duohertz format 2 charts", () => {
  it("accepts authored one-key and two-key charts", () => {
    expect(parseDuohertzChart(easy).input_count).toBe(1);
    expect(parseDuohertzChart({
      ...easy,
      tier: "hard",
      input_count: 2,
      total_notes: 3,
      notes: [
        { id: "n1", type: "tap", t: 1, key: 0 },
        { id: "n2", type: "chord", t: 2, keys: [0, 1] },
      ],
    }).total_notes).toBe(3);
  });

  it("rejects legacy four-lane data and invalid difficulty/key combinations", () => {
    expect(() => parseDuohertzChart({ ...easy, format: 1 })).toThrow(/format 2/);
    expect(() => parseDuohertzChart({ ...easy, theme: "beatscape" })).toThrow(/format 2/);
    expect(() => parseDuohertzChart({ ...easy, notes: [{ id: "n1", type: "tap", t: 1, key: 2 }] })).toThrow(/Invalid tap key/);
    expect(() => parseDuohertzChart({ ...easy, input_count: 2 })).toThrow(/Easy must use one key/);
    expect(() => parseDuohertzChart({ ...easy, notes: [{ id: "n1", type: "chord", t: 1, keys: [0, 1] }] })).toThrow(/Hard/);
    expect(() => parseDuohertzChart({ ...easy, tier: "standard", input_count: 2 })).toThrow(/every declared key/);
  });

  it("rejects inconsistent counts and impossible same-key hold overlaps", () => {
    expect(() => parseDuohertzChart({ ...easy, total_notes: 1 })).toThrow(/total_notes/);
    expect(() => parseDuohertzChart({
      ...easy,
      notes: [
        { id: "n1", type: "hold", t: 1, end: 2, key: 0 },
        { id: "n2", type: "tap", t: 1.5, key: 0 },
      ],
    })).toThrow(/overlaps a hold/);
    expect(() => parseDuohertzChart({
      ...easy,
      notes: [
        { id: "n1", type: "tap", t: 1, key: 0 },
        { id: "n2", type: "tap", t: 1, key: 0 },
      ],
    })).toThrow(/duplicate or unsorted note time/);
  });

  it("requires simultaneous two-key input to be one explicit Hard chord", () => {
    expect(() => parseDuohertzChart({
      ...easy,
      tier: "standard",
      input_count: 2,
      notes: [
        { id: "left", type: "tap", t: 1, key: 0 },
        { id: "right", type: "tap", t: 1, key: 1 },
      ],
    })).toThrow(/duplicate or unsorted note time/);
  });
});
