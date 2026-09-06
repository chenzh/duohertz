import { describe, expect, it } from "vitest";
import { GameSession } from "../../engine/playState";
import type { ChartJSON, ChartNote } from "../../types/chart";
import { visibleNoteEnd } from "./visibleNoteEnd";

function sessionFor(notes: ChartNote[]) {
  const chart: ChartJSON = {
    track_id: "visible-window", tier: "hard", format: 1, bpm: 120,
    audio_offset_ms: 0, ar: 24, total_notes: 0, notes,
  };
  return new GameSession(chart, "casual");
}

function drawIds(session: GameSession, songMs: number, approachSec: number) {
  return session.order.slice(session.cursor, visibleNoteEnd(session, songMs, approachSec))
    .filter(note => !note.done).map(note => note.def.id);
}

describe("visible note draw window", () => {
  it("includes the exact spawn boundary and excludes future tap/chord/hold/slide heads", () => {
    const session = sessionFor([
      { id: "boundary", type: "tap", lane: 0, t: 6 },
      { id: "future-tap", type: "tap", lane: 1, t: 6.001 },
      { id: "future-chord", type: "chord", lanes: [0, 2], t: 7 },
      { id: "future-hold", type: "hold", lane: 1, t: 8, end: 14 },
      { id: "future-slide", type: "slide", lane: 0, to: 3, t: 9, end: 16 },
    ]);
    expect(drawIds(session, 3999, 2)).toEqual([]);
    expect(drawIds(session, 4000, 2)).toEqual(["boundary"]);
    expect(drawIds(session, 4001, 2)).toEqual(["boundary", "future-tap"]);
  });

  it("retains active long hold/slide tails while skipping completed notes inside their window", () => {
    const session = sessionFor([
      { id: "hold", type: "hold", lane: 0, t: 1, end: 20 },
      { id: "slide", type: "slide", lane: 1, to: 2, t: 2, end: 22 },
      { id: "done", type: "tap", lane: 3, t: 3 },
      { id: "visible-tap", type: "tap", lane: 3, t: 11 },
      { id: "visible-chord", type: "chord", lanes: [0, 2], t: 12 },
      { id: "future", type: "hold", lane: 1, t: 30, end: 40 },
    ]);
    session.press(0, 1000);
    session.press(1, 2000);
    session.tick(10000);
    expect(session.cursor).toBe(0);
    expect(drawIds(session, 10000, 2)).toEqual(["hold", "slide", "visible-tap", "visible-chord"]);
    expect(session.order.slice(0, 2).map(note => note.tail)).toEqual([null, null]);

    session.release(0, 20000);
    session.press(2, 22000);
    session.tick(22000);
    expect(session.order[session.cursor]!.def.id).toBe("future");
    expect(drawIds(session, 22000, 2)).toEqual([]);
  });

  it("uses the sorted order for unordered charts without changing original tie resolution order", () => {
    const session = sessionFor([
      { id: "future-first", type: "tap", lane: 3, t: 20 },
      { id: "tie-first", type: "tap", lane: 0, t: 6 },
      { id: "earlier", type: "tap", lane: 1, t: 5 },
      { id: "tie-second", type: "chord", lanes: [0, 2], t: 6 },
    ]);
    expect(drawIds(session, 4000, 2)).toEqual(["earlier", "tie-first", "tie-second"]);
    expect(session.notes.map(note => note.def.id)).toEqual(["future-first", "tie-first", "earlier", "tie-second"]);
    expect(session.cursor).toBe(0);
  });

  it("recomputes a shrinking or expanding window for countdown, offsets and approach changes", () => {
    const session = sessionFor([
      { id: "first", type: "tap", lane: 0, t: 0 },
      { id: "second", type: "tap", lane: 1, t: 1 },
      { id: "third", type: "tap", lane: 2, t: 2 },
    ]);
    expect(drawIds(session, -3000, 2)).toEqual([]);
    expect(drawIds(session, -2000, 2)).toEqual(["first"]);
    expect(drawIds(session, 0, 2)).toEqual(["first", "second", "third"]);
    expect(drawIds(session, 0, 0.5)).toEqual(["first"]);
    expect(drawIds(session, -1001, 2)).toEqual(["first"]);
    expect(drawIds(session, -1000, 2)).toEqual(["first", "second"]);
    expect(session.cursor).toBe(0);
  });

  it("handles empty and completed sessions, and starts from a fresh cursor on replay", () => {
    expect(visibleNoteEnd(sessionFor([]), 0, 2)).toBe(0);
    const notes: ChartNote[] = [{ id: "tap", type: "tap", lane: 0, t: 1 }];
    const session = sessionFor(notes);
    session.tick(2000);
    expect(session.cursor).toBe(1);
    expect(visibleNoteEnd(session, 2000, 2)).toBe(1);
    expect(drawIds(session, 2000, 2)).toEqual([]);
    expect(drawIds(sessionFor(notes), 0, 2)).toEqual(["tap"]);
  });

  it("finds a short visible window without scanning a dense chart's distant future", () => {
    let headReads = 0;
    const order = Array.from({ length: 16384 }, (_, index) => ({
      get tMs() { headReads++; return index * 100; },
    })) as GameSession["order"];
    expect(visibleNoteEnd({ order, cursor: 100 }, 10000, 0.3)).toBe(104);
    expect(headReads).toBeLessThanOrEqual(15);
  });
});
