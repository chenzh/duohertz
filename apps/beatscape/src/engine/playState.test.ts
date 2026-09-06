import { describe, expect, it } from "vitest";
import { GameSession } from "./playState";
import type { ChartJSON } from "../types/chart";

const slideChart: ChartJSON = {
  track_id: "test-slide",
  tier: "standard",
  format: 1,
  bpm: 120,
  ar: 28,
  audio_offset_ms: 0,
  total_notes: 2,
  notes: [{ type: "slide", lane: 0, to: 2, t: 1, end: 1.5 }],
};

describe("GameSession feel", () => {
  it("slide stays active after head until tail is judged", () => {
    const s = new GameSession(slideChart, "arcade");
    const head = s.press(0, 1000);
    expect(head?.judgment).not.toBe("miss");
    expect(s.isComplete).toBe(false);

    const tail = s.press(2, 1500);
    expect(tail).not.toBeNull();
    expect(s.isComplete).toBe(true);
  });

  it("practice slow-mo triggers after 3 consecutive misses", () => {
    const tapChart: ChartJSON = {
      track_id: "test",
      tier: "easy",
      format: 1,
      bpm: 120,
      ar: 28,
      audio_offset_ms: 0,
      total_notes: 3,
      notes: [
        { type: "tap", lane: 0, t: 1 },
        { type: "tap", lane: 1, t: 2 },
        { type: "tap", lane: 2, t: 3 },
      ],
    };
    const s = new GameSession(tapChart, "practice");
    s.tick(1060);
    s.tick(2060);
    s.tick(3060);
    expect(s.consumeSlowTrigger()).toBe(true);
  });
});

function chordChart(lanes: Array<0 | 1 | 2 | 3>): ChartJSON {
  return {
    track_id: "test-chord",
    tier: "standard",
    format: 1,
    bpm: 120,
    ar: 28,
    audio_offset_ms: 0,
    total_notes: lanes.length,
    notes: [{ id: "c1", type: "chord", lanes, t: 1 }],
  };
}

describe("touch chord assist", () => {
  it("banks the partner lane when one thumb cannot reach both", () => {
    const s = new GameSession(chordChart([0, 1]), "arcade", { chordAssist: true });
    s.press(0, 1000);
    s.tick(1100);
    expect(s.judgments.perfect).toBe(1);
    expect(s.judgments.great).toBe(1);
    expect(s.judgments.miss).toBe(0);
  });

  it("drops the lane when assist is off", () => {
    const s = new GameSession(chordChart([0, 1]), "arcade");
    s.press(0, 1000);
    s.tick(1100);
    expect(s.judgments.miss).toBe(1);
    expect(s.judgments.great).toBe(0);
  });

  it("does not rescue a cross-hand chord — that one is fair", () => {
    const s = new GameSession(chordChart([1, 2]), "arcade", { chordAssist: true });
    s.press(1, 1000);
    s.tick(1100);
    expect(s.judgments.miss).toBe(1);
    expect(s.judgments.great).toBe(0);
  });

  it("assists the right hand the same way", () => {
    const s = new GameSession(chordChart([2, 3]), "arcade", { chordAssist: true });
    s.press(3, 1000);
    s.tick(1100);
    expect(s.judgments.great).toBe(1);
    expect(s.judgments.miss).toBe(0);
  });

  it("never rescues a lane whose partner also missed", () => {
    const s = new GameSession(chordChart([0, 1]), "arcade", { chordAssist: true });
    s.tick(1100);
    expect(s.judgments.miss).toBe(2);
    expect(s.judgments.great).toBe(0);
  });

  it("keeps an all-perfect run honest", () => {
    const s = new GameSession(chordChart([0, 1]), "arcade", { chordAssist: true });
    s.press(0, 1000);
    s.tick(1100);
    const r = s.getResult();
    expect(r.allPerfect).toBe(false);
    expect(r.fullCombo).toBe(true);
  });
});

function tapChartAt(times: number[], lanes: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3]): ChartJSON {
  return {
    track_id: "test-timing",
    tier: "standard",
    format: 1,
    bpm: 120,
    ar: 28,
    audio_offset_ms: 0,
    total_notes: times.length,
    notes: times.map((t, i) => ({ type: "tap", lane: lanes[i] ?? 0, t })),
  };
}

describe("GameSession timing profile (T3)", () => {
  it("counts early and late hits separately and signs the mean", () => {
    const s = new GameSession(tapChartAt([1, 2, 3]), "arcade");
    s.press(0, 990); // -10ms → early
    s.press(1, 2010); // +10ms → late
    s.press(2, 3000); // exact → neither
    const t = s.getResult().timing;
    expect(t).toEqual({ early: 1, late: 1, meanMs: 0 });
  });

  it("reports a positive mean when the player hits late", () => {
    const s = new GameSession(tapChartAt([1, 2]), "arcade");
    s.press(0, 1020); // +20ms
    s.press(1, 2030); // +30ms (a press far from any note is an empty press, not a hit)
    const t = s.getResult().timing;
    expect(t?.late).toBe(2);
    expect(t?.early).toBe(0);
    expect(t?.meanMs).toBeCloseTo(25, 5);
  });

  it("excludes misses — an unhit note has no trustworthy delta", () => {
    const s = new GameSession(tapChartAt([1, 2]), "arcade");
    s.press(0, 1005);
    s.tick(2200); // note 2 auto-misses
    const t = s.getResult().timing;
    expect(s.judgments.miss).toBe(1);
    expect(t).toEqual({ early: 0, late: 1, meanMs: 5 });
  });

  it("omits the profile when nothing was hit", () => {
    const s = new GameSession(tapChartAt([1]), "arcade");
    s.tick(1200);
    expect(s.getResult().timing).toBeUndefined();
  });
});
