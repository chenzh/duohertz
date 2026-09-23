import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FIRST_SHIFT } from "../data/firstShift";
import type { LastRun } from "../types/chart";
import { advanceShift, canCarrySignal, crewResponse, parseShiftProgress, shiftInputSurface, shiftLaneAction, shiftReceiptFor, type ShiftProgress } from "./firstShift";

function run(index = 0, overrides: Partial<LastRun> = {}): LastRun {
  const step = FIRST_SHIFT[index]!;
  return { v: 1, track_id: step.trackId, title: step.trackTitle, artist: "Test", tier: "easy", mode: "casual", score: 0,
    accuracy: 1, maxCombo: 1, grade: "D", fc: false, ap: false, failed: false,
    counts: { perfect: 0, great: 0, good: 1, miss: 9 }, totalNotes: 10, durationMs: 60000,
    endedAt: `2026-09-05T01:0${index}:00.000Z`, shiftStep: step.id, ...overrides };
}
const empty = (): ShiftProgress => ({ v: 1, completed: [] });

afterEach(() => vi.unstubAllGlobals());

describe("First shift progress", () => {
  it("keeps opening and recovery cues aligned with the available input surface", () => {
    expect(shiftInputSurface(false, false, false)).toBe("keys");
    expect(shiftInputSurface(true, false, false)).toBe("touch");
    expect(shiftInputSurface(true, true, false)).toBe("keys");
    expect(shiftInputSurface(true, true, true)).toBe("gamepad");
    expect(shiftLaneAction("touch")).toBe("tap a lane");
    expect(shiftLaneAction("keys")).toBe("press a lane key");
    expect(shiftLaneAction("gamepad")).toBe("press a lane button");
  });

  it("carries all three connections in order, including a low-grade zero-score GOOD hit", () => {
    let state = empty();
    for (let index = 0; index < 3; index++) {
      state = advanceShift(state, run(index));
      expect(state.completed).toHaveLength(index + 1);
      expect(shiftReceiptFor(run(index), state)?.id).toBe(FIRST_SHIFT[index]!.id);
    }
    expect(advanceShift(state, run(2))).toBe(state);
  });

  it("does not restore nodes for failed, idle, rehearsal, unrelated or out-of-order runs", () => {
    const state = empty();
    for (const candidate of [run(0, { failed: true }), run(0, { failed: undefined }), run(0, { mode: "practice" }),
      run(0, { counts: { perfect: 0, great: 0, good: 0, miss: 10 } }), run(0, { shiftStep: undefined }),
      run(0, { track_id: "bs-s1-01" }), run(1), run(2), run(0, { endedAt: "broken" })]) {
      expect(advanceShift(state, candidate)).toBe(state);
    }
  });

  it("supports full arcade clears without imposing a score grade", () => {
    expect(canCarrySignal(run(0, { mode: "arcade" }))).toBe(true);
  });

  it("does not count the same finish twice or attribute its receipt to another result", () => {
    const first = run();
    const state = advanceShift(empty(), first);
    expect(advanceShift(state, first)).toBe(state);
    expect(shiftReceiptFor(run(0, { endedAt: "2026-09-05T02:00:00.000Z" }), state)).toBeUndefined();
    expect(shiftReceiptFor(run(0, { shiftStep: undefined }), state)).toBeUndefined();
  });

  it("recovers malformed saves and retains only a valid ordered prefix", () => {
    for (const raw of [null, "{", "null", "[]", '{"v":2,"completed":[]}', '{"v":1,"completed":[null]}']) {
      expect(parseShiftProgress(raw)).toEqual(empty());
    }
    expect(parseShiftProgress(JSON.stringify({ v: 1, completed: [{ id: "yard", runId: "x" }] }))).toEqual(empty());
    expect(parseShiftProgress(JSON.stringify({ v: 1, completed: [{ id: "studio", runId: "a" }, { id: "yard", runId: "a" }] })).completed).toEqual([{ id: "studio", runId: "a" }]);
    const state = advanceShift(empty(), run());
    expect(parseShiftProgress(JSON.stringify(state))).toEqual(state);
  });

  it("answers failed and idle runs without claiming a successful broadcast", () => {
    expect(crewResponse(run(0, { failed: true, fc: true })).text).toContain("Rough take");
    expect(crewResponse(run(0, { mode: "practice" })).text).toContain("rehearsal");
    const idle = run(0, { counts: { perfect: 0, great: 0, good: 0, miss: 10 } });
    expect(crewResponse(idle, undefined, "touch").text).toContain("tap a lane");
    expect(crewResponse(idle, undefined, "keys").text).toContain("press a lane key");
    expect(crewResponse(idle, undefined, "gamepad").text).toContain("press a lane button");
    expect(crewResponse(run(0, { shiftStep: undefined }), "Chrome Yard").speaker).toBe("TORQUE");
  });
});

describe("First shift persistence", () => {
  beforeEach(() => vi.resetModules());

  it("survives reload and reading Results cannot restore another connection", async () => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) });
    const first = await import("./firstShift");
    first.recordShiftRun(run());
    vi.resetModules();
    const reloaded = await import("./firstShift");
    expect(reloaded.loadShiftProgress().completed).toHaveLength(1);
    expect(reloaded.shiftReceiptFor(run())?.id).toBe("studio");
    reloaded.recordShiftRun(run());
    expect(reloaded.loadShiftProgress().completed).toHaveLength(1);
    expect(reloaded.shiftIsVolatile()).toBe(false);
  });

  it("keeps the current visit working when writes are denied and labels it as unsaved", async () => {
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => { throw new Error("disabled"); } });
    const store = await import("./firstShift");
    store.recordShiftRun(run());
    store.recordShiftRun(run(1));
    expect(store.loadShiftProgress().completed).toHaveLength(2);
    expect(store.shiftIsVolatile()).toBe(true);
    expect(store.shiftReceiptFor(run(1))?.id).toBe("yard");
    expect(store.shiftStorageNotice()).toContain("lasts for this visit");
  });

  it("explains recovery from a broken save without claiming the missing connections are restored", async () => {
    vi.stubGlobal("localStorage", { getItem: () => '{"v":1,"completed":[{"id":"studio","runId":"a"},null]}' });
    const store = await import("./firstShift");
    expect(store.loadShiftProgress().completed).toHaveLength(1);
    expect(store.shiftStorageNotice()).toContain("Kept 1 of 3 connections");
  });
});
