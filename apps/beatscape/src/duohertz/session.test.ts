import { describe, expect, it } from "vitest";
import { parseDuohertzChart } from "./chart";
import { DuohertzSession, validateTimingProfile } from "./session";

const timing = { perfectMs: 40, greatMs: 80, goodMs: 120 };

function chart(notes: unknown[], tier: "easy" | "hard" = "easy") {
  return parseDuohertzChart({
    format: 2,
    theme: "duohertz",
    track_id: "dh-first-pulse",
    tier,
    input_count: tier === "easy" ? 1 : 2,
    bpm: 120,
    audio_offset_ms: 0,
    total_notes: notes.reduce<number>((count, note) => count + ((note as { type: string }).type === "chord" ? 2 : 1), 0),
    notes,
  });
}

describe("duohertz one/two-key session", () => {
  it("judges taps against the supplied timing profile without ending a family run on a miss", () => {
    const session = new DuohertzSession(chart([
      { id: "a", type: "tap", t: 1, key: 0 },
      { id: "b", type: "tap", t: 2, key: 0 },
    ]), timing);
    expect(session.press(0, 1025)?.judgment).toBe("perfect");
    expect(session.tick(2121).map((event) => event.judgment)).toEqual(["miss"]);
    expect(session.result()).toMatchObject({ complete: true, judged: 2, total: 2, points: 3, accuracy: 50, failed: false });
    expect(session.tick(3000)).toEqual([]);
  });

  it("scores each Hard chord key once and rejects duplicate input", () => {
    const session = new DuohertzSession(chart([{ id: "c", type: "chord", t: 1, keys: [0, 1] }], "hard"), timing);
    expect(session.press(0, 1000)?.judgment).toBe("perfect");
    expect(session.press(0, 1001)).toBeNull();
    expect(session.press(1, 1060)?.judgment).toBe("great");
    expect(session.result()).toMatchObject({ complete: true, total: 2, points: 5, counts: { perfect: 1, great: 1, good: 0, miss: 0 } });
  });

  it("keeps Duo player results independent on a shared Hard chart and clock", () => {
    const session = new DuohertzSession(chart([
      { id: "p1", type: "tap", t: 1, key: 0 },
      { id: "p2", type: "tap", t: 2, key: 1 },
      { id: "both", type: "chord", t: 3, keys: [0, 1] },
    ], "hard"), timing);
    expect(session.press(0, 1000)?.judgment).toBe("perfect");
    expect(session.tick(2121).map((event) => event.key)).toEqual([1]);
    expect(session.press(0, 3000)?.judgment).toBe("perfect");
    expect(session.press(1, 3060)?.judgment).toBe("great");
    expect(session.resultForKey(0)).toMatchObject({ complete: true, judged: 2, total: 2, points: 6, accuracy: 100 });
    expect(session.resultForKey(1)).toMatchObject({ complete: true, judged: 2, total: 2, points: 2, accuracy: 33,
      counts: { perfect: 0, great: 1, good: 0, miss: 1 } });
    expect(session.result()).toMatchObject({ complete: true, total: 4, points: 8 });
  });

  it("resolves a Hold on release using the weaker endpoint and misses abandoned holds", () => {
    const good = new DuohertzSession(chart([{ id: "h", type: "hold", t: 1, end: 2, key: 0 }]), timing);
    expect(good.press(0, 1000)).toBeNull();
    expect(good.release(0, 2090)?.judgment).toBe("good");
    expect(good.result()).toMatchObject({ complete: true, points: 1 });

    const abandoned = new DuohertzSession(chart([{ id: "h", type: "hold", t: 1, end: 2, key: 0 }]), timing);
    abandoned.press(0, 1000);
    expect(abandoned.tick(2121).map((event) => event.judgment)).toEqual(["miss"]);
    expect(abandoned.release(0, 2122)).toBeNull();
    expect(abandoned.result()).toMatchObject({ complete: true, points: 0, failed: false });
  });

  it("requires an ordered finite timing profile", () => {
    expect(() => validateTimingProfile({ perfectMs: 40, greatMs: 40, goodMs: 120 })).toThrow();
    expect(() => validateTimingProfile({ perfectMs: 40, greatMs: 80, goodMs: Number.NaN })).toThrow();
  });
});
