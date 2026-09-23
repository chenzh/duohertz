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
  total_notes: 1,
  notes: [{ type: "slide", lane: 0, to: 1, t: 1, end: 1.5 }],
};

describe("GameSession feel", () => {
  it("awards Good its documented base score while breaking combo", () => {
    const chart: ChartJSON = {
      track_id: "test-good-score",
      tier: "easy",
      format: 1,
      bpm: 120,
      ar: 28,
      audio_offset_ms: 0,
      total_notes: 2,
      notes: [
        { type: "tap", lane: 0, t: 1 },
        { type: "tap", lane: 1, t: 2 },
      ],
    };
    const s = new GameSession(chart, "arcade");

    expect(s.press(0, 1000)).toMatchObject({ judgment: "perfect" });
    expect(s.press(1, 2040)).toMatchObject({ judgment: "good" });
    expect(s.getResult()).toMatchObject({
      score: 400,
      accuracy: 70,
      maxCombo: 1,
      fullCombo: false,
      judgments: { perfect: 1, great: 0, good: 1, miss: 0 },
    });
    expect(s.combo).toBe(0);
  });

  it("records a break even when a same-frame hit immediately rebuilds combo", () => {
    const chart: ChartJSON = {
      track_id: "test-combo-break-event",
      tier: "easy",
      format: 1,
      bpm: 120,
      audio_offset_ms: 0,
      ar: 4,
      total_notes: 4,
      notes: [
        { id: "warmup-1", type: "tap", lane: 0, t: 1 },
        { id: "warmup-2", type: "tap", lane: 1, t: 1.5 },
        { id: "break", type: "tap", lane: 2, t: 2 },
        { id: "recover", type: "tap", lane: 3, t: 2.06 },
      ],
    };
    const s = new GameSession(chart, "casual");

    s.press(0, 1000);
    s.press(1, 1500);
    s.press(2, 2060);
    s.press(3, 2060);

    expect(s.combo).toBe(1);
    expect(s.comboBreaks).toBe(1);
  });

  it("judges Chord lanes independently without a hidden inter-key deadline", () => {
    const chart: ChartJSON = {
      track_id: "test-chord-window",
      tier: "standard",
      format: 1,
      bpm: 120,
      ar: 28,
      audio_offset_ms: 0,
      total_notes: 2,
      notes: [{ id: "chord", type: "chord", lanes: [0, 3], t: 1 }],
    };
    const s = new GameSession(chart, "arcade");

    expect(s.press(0, 970)).toMatchObject({ judgment: "great", deltaMs: -30 });
    expect(s.press(3, 1030)).toMatchObject({ judgment: "great", deltaMs: 30 });
    expect(s.getResult()).toMatchObject({
      score: 400,
      accuracy: 75,
      maxCombo: 2,
      judgments: { perfect: 0, great: 2, good: 0, miss: 0 },
    });
  });

  it("emits one completed Chord summary using the worst lane judgment", () => {
    const chart: ChartJSON = {
      track_id: "test-chord-summary",
      tier: "standard",
      format: 1,
      bpm: 120,
      ar: 28,
      audio_offset_ms: 0,
      total_notes: 3,
      notes: [{ id: "chord", type: "chord", lanes: [0, 1, 2], t: 1 }],
    };
    const s = new GameSession(chart, "arcade");

    expect(s.press(0, 1000)?.chordFeedback).toEqual({ lanes: [0, 1, 2] });
    expect(s.press(1, 970)?.chordFeedback).toEqual({ lanes: [0, 1, 2] });
    expect(s.press(2, 1000)?.chordFeedback).toEqual({
      lanes: [0, 1, 2],
      summary: { lane: 1, judgment: "great", deltaMs: -30 },
    });
  });

  it("arms a Slide at its head and scores the completed gesture exactly once", () => {
    const s = new GameSession(slideChart, "arcade");
    const head = s.press(0, 1000);
    expect(head).toBeNull();
    expect(s.isComplete).toBe(false);
    expect(s.judgments).toEqual({ perfect: 0, great: 0, good: 0, miss: 0 });
    expect(s.score).toBe(0);
    expect(s.combo).toBe(0);

    const tail = s.press(1, 1500);
    expect(tail).toMatchObject({
      lane: 1,
      judgment: "perfect",
      deltaMs: 0,
      accent: "slide-complete",
    });
    expect(s.isComplete).toBe(true);
    expect(s.getResult()).toMatchObject({
      score: 300,
      accuracy: 100,
      maxCombo: 1,
      allPerfect: true,
      judgments: { perfect: 1, great: 0, good: 0, miss: 0 },
      totalNotes: 1,
    });
  });

  it("completes a Slide when its target lane is reached early and held through the endpoint", () => {
    const s = new GameSession(slideChart, "arcade");
    expect(s.press(0, 1000)).toBeNull();
    expect(s.isSlideTargetHeld(1)).toBe(false);
    expect(s.press(1, 1300)).toBeNull();
    expect(s.isSlideTargetHeld(1)).toBe(true);

    expect(s.tick(1499)).toEqual([]);
    expect(s.tick(1500)).toMatchObject([
      { lane: 1, judgment: "perfect", deltaMs: 0, scoreGain: 300 },
    ]);
    expect(s.isSlideTargetHeld(1)).toBe(false);
    expect(s.getResult()).toMatchObject({
      score: 300,
      accuracy: 100,
      maxCombo: 1,
      judgments: { perfect: 1, great: 0, good: 0, miss: 0 },
      totalNotes: 1,
    });
  });

  it("does not complete a Slide after leaving an early target before its endpoint", () => {
    const s = new GameSession(slideChart, "arcade");
    s.press(0, 1000);
    s.press(1, 1300);
    expect(s.release(1, 1400)).toBeNull();

    const [miss] = s.tick(1571);
    expect(miss).toMatchObject({ lane: 1, judgment: "miss", scoreGain: 0 });
    expect(miss?.accent).toBe("slide-hold-miss");
    expect(s.getResult().judgments).toEqual({ perfect: 0, great: 0, good: 0, miss: 1 });
  });

  it("only rearms a Slide destination that was held before an interruption", () => {
    const untouched = new GameSession(slideChart, "arcade");
    untouched.press(0, 1000);
    expect(untouched.rearmSlideTarget(1)).toBe(false);

    const interrupted = new GameSession(slideChart, "arcade");
    interrupted.press(0, 1000);
    interrupted.press(1, 1300);
    interrupted.clearHeldInputs();
    expect(interrupted.tick(1500)).toEqual([]);
    expect(interrupted.rearmSlideTarget(1)).toBe(true);
    expect(interrupted.tick(1500)).toMatchObject([
      { lane: 1, judgment: "perfect", deltaMs: 0, scoreGain: 300 },
    ]);
  });

  it("uses the worse endpoint as the Slide's single completion judgment", () => {
    const s = new GameSession(slideChart, "arcade");
    expect(s.press(0, 1045)).toBeNull();

    expect(s.press(1, 1500)).toMatchObject({ judgment: "good", deltaMs: 45 });
    expect(s.getResult()).toMatchObject({
      accuracy: 40,
      judgments: { perfect: 0, great: 0, good: 1, miss: 0 },
      timing: { early: 0, late: 1, meanMs: 45 },
    });
  });

  it("accepts the Slide tail across the documented +20ms release window", () => {
    const s = new GameSession(slideChart, "arcade");
    s.press(0, 1000);

    expect(s.press(1, 1565)).toMatchObject({ judgment: "good", deltaMs: 65 });
    expect(s.isComplete).toBe(true);
    expect(s.getResult().judgments).toEqual({ perfect: 0, great: 0, good: 1, miss: 0 });
  });

  it("counts either an unstarted or unfinished Slide as one miss", () => {
    const unstarted = new GameSession(slideChart, "arcade");
    const [unstartedMiss] = unstarted.tick(1051);
    expect(unstartedMiss?.accent).toBeUndefined();
    expect(unstarted.getResult().judgments).toEqual({ perfect: 0, great: 0, good: 0, miss: 1 });

    const unfinished = new GameSession(slideChart, "arcade");
    unfinished.press(0, 1000);
    const [unfinishedMiss] = unfinished.tick(1571);
    expect(unfinishedMiss?.accent).toBe("slide-target-miss");
    expect(unfinished.getResult().judgments).toEqual({ perfect: 0, great: 0, good: 0, miss: 1 });
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

  it("builds a self-contained section-practice slice", () => {
    const chart: ChartJSON = {
      track_id: "test-section",
      tier: "standard",
      format: 1,
      bpm: 120,
      ar: 28,
      audio_offset_ms: 0,
      total_notes: 5,
      notes: [
        { id: "intro", type: "tap", lane: 0, t: 1 },
        { id: "drop-hold", type: "hold", lane: 1, t: 4, end: 5 },
        { id: "drop-chord", type: "chord", lanes: [2, 3], t: 6 },
      ],
    };
    const s = new GameSession(chart, "practice", {
      startAtMs: 4000,
      endAtMs: 6000,
      sectionPractice: true,
    });

    expect(s.notes.map((note) => note.def.id)).toEqual(["drop-hold"]);
    expect(s.totalNotes).toBe(2);
    expect(s.getResult().seekedFrom).toBe(4);
    expect(s.getResult().seekedUntil).toBe(6);
  });

  it("marks an intro-section retry without removing its notes", () => {
    const s = new GameSession(slideChart, "practice", {
      startAtMs: 0,
      endAtMs: 2000,
      sectionPractice: true,
    });
    expect(s.notes).toHaveLength(1);
    expect(s.getResult().seekedFrom).toBe(0);
    expect(s.getResult().seekedUntil).toBe(2);
  });

  it("only rearms a landed Hold that is still waiting for its tail", () => {
    const holdChart: ChartJSON = {
      track_id: "test-hold-rearm",
      tier: "easy",
      format: 1,
      bpm: 120,
      ar: 4,
      audio_offset_ms: 0,
      total_notes: 2,
      notes: [{ type: "hold", lane: 1, t: 1, end: 2 }],
    };
    const s = new GameSession(holdChart, "casual");

    expect(s.canRearmHold(1)).toBe(false);
    s.press(1, 1000);
    expect(s.canRearmHold(0)).toBe(false);
    expect(s.canRearmHold(1)).toBe(true);
    expect(s.release(1, 2000)).toMatchObject({
      judgment: "perfect",
      accent: "hold-release",
    });
    expect(s.canRearmHold(1)).toBe(false);
  });

  it("charges the documented 5 HP penalty for a missed Hold tail", () => {
    const holdChart: ChartJSON = {
      track_id: "test-hold-tail-hp",
      tier: "easy",
      format: 1,
      bpm: 120,
      ar: 4,
      audio_offset_ms: 0,
      total_notes: 2,
      notes: [{ type: "hold", lane: 0, t: 1, end: 2 }],
    };
    const s = new GameSession(holdChart, "arcade");

    expect(s.press(0, 1000)).toMatchObject({ judgment: "perfect" });
    const missedTail = s.release(0, 2100);
    expect(missedTail).toMatchObject({
      judgment: "miss",
      deltaMs: 100,
      accent: "hold-release-miss",
    });
    expect(s.hp).toBe(95);
    expect(s.getResult()).toMatchObject({
      score: 300,
      judgments: { perfect: 1, great: 0, good: 0, miss: 1 },
    });

    const heldPastTail = new GameSession(holdChart, "arcade");
    heldPastTail.press(0, 1000);
    expect(heldPastTail.tick(2071)).toMatchObject([
      { judgment: "miss", deltaMs: 71, accent: "hold-release-miss" },
    ]);
  });

  it("charges one head miss and the lighter tail miss when a Hold is never started", () => {
    const holdChart: ChartJSON = {
      track_id: "test-hold-timeout-hp",
      tier: "easy",
      format: 1,
      bpm: 120,
      ar: 4,
      audio_offset_ms: 0,
      total_notes: 2,
      notes: [{ type: "hold", lane: 0, t: 1, end: 2 }],
    };
    const s = new GameSession(holdChart, "arcade");

    s.tick(1051);

    expect(s.hp).toBe(88);
    expect(s.getResult().judgments).toEqual({ perfect: 0, great: 0, good: 0, miss: 2 });
  });

  it("stops an overdue batch on the exact Miss that depletes Arcade HP", () => {
    const warmup = Array.from({ length: 14 }, (_, index) => ({
      id: `warmup-${index}`,
      type: "tap" as const,
      lane: (index % 4) as 0 | 1 | 2 | 3,
      t: (index + 1) / 10,
    }));
    const chart: ChartJSON = {
      track_id: "test-arcade-batch-failure",
      tier: "easy",
      format: 1,
      bpm: 120,
      ar: 4,
      audio_offset_ms: 0,
      total_notes: 20,
      notes: [
        ...warmup,
        ...Array.from({ length: 6 }, (_, index) => ({
          id: `pileup-${index}`,
          type: "tap" as const,
          lane: (index % 4) as 0 | 1 | 2 | 3,
          t: 2,
        })),
      ],
    };
    const s = new GameSession(chart, "arcade");
    for (const note of warmup) s.tick(note.t * 1000 + 51);
    expect(s.hp).toBe(2);

    const failureFx = s.tick(2051);

    expect(s.failed).toBe(true);
    expect(s.hp).toBe(0);
    expect(failureFx).toHaveLength(1);
    expect(s.getResult().judgments).toEqual({ perfect: 0, great: 0, good: 0, miss: 15 });
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
  it("reports the exact banked score gain before a later miss resets combo", () => {
    const warmup = Array.from({ length: 49 }, (_, index) => ({
      id: `warmup-${index}`,
      type: "tap" as const,
      lane: 2 as const,
      t: (index + 1) / 10,
    }));
    const chart: ChartJSON = {
      track_id: "test-chord-score-gain",
      tier: "standard",
      format: 1,
      bpm: 120,
      ar: 28,
      audio_offset_ms: 0,
      total_notes: 52,
      notes: [
        ...warmup,
        { id: "assisted", type: "chord", lanes: [0, 1], t: 6 },
        { id: "same-frame-miss", type: "tap", lane: 3, t: 6 },
      ],
    };
    const s = new GameSession(chart, "arcade", { chordAssist: true });
    for (const note of warmup) s.press(note.lane, note.t * 1000);
    expect(s.combo).toBe(49);

    expect(s.press(0, 6000)).toMatchObject({ judgment: "perfect", scoreGain: 600 });
    const beforeTick = s.score;
    const fx = s.tick(6051);

    expect(s.score - beforeTick).toBe(400);
    expect(fx).toMatchObject([
      { lane: 1, judgment: "great", scoreGain: 400, accent: "chord-assist" },
      { lane: 3, judgment: "miss", scoreGain: 0 },
    ]);
    expect(s.combo).toBe(0);
  });

  it("banks the partner lane when one thumb cannot reach both", () => {
    const s = new GameSession(chordChart([0, 1]), "arcade", { chordAssist: true });
    s.press(0, 1000);
    expect(s.tick(1100)).toMatchObject([
      {
        lane: 1,
        judgment: "great",
        accent: "chord-assist",
        chordFeedback: {
          lanes: [0, 1],
          summary: {
            lane: 1,
            judgment: "great",
            deltaMs: 100,
            accent: "chord-assist",
          },
        },
      },
    ]);
    expect(s.judgments.perfect).toBe(1);
    expect(s.judgments.great).toBe(1);
    expect(s.judgments.miss).toBe(0);
  });

  it("never assists a keyboard or mouse chord press on a touch-capable device", () => {
    const s = new GameSession(chordChart([0, 1]), "arcade", { chordAssist: true });
    s.press(0, 1000, { touchChordAssist: false });
    s.tick(1100);
    expect(s.judgments.perfect).toBe(1);
    expect(s.judgments.great).toBe(0);
    expect(s.judgments.miss).toBe(1);
  });

  it("drops the lane when assist is off", () => {
    const s = new GameSession(chordChart([0, 1]), "arcade");
    s.press(0, 1000);
    s.tick(1100);
    expect(s.judgments.miss).toBe(1);
    expect(s.judgments.great).toBe(0);
  });

  it("changes assist for future chords without rewriting prior judgments", () => {
    const chart: ChartJSON = {
      ...chordChart([0, 1]),
      total_notes: 4,
      notes: [
        { id: "before", type: "chord", lanes: [0, 1], t: 1 },
        { id: "after", type: "chord", lanes: [0, 1], t: 2 },
      ],
    };
    const s = new GameSession(chart, "arcade");
    s.press(0, 1000, { touchChordAssist: true });
    s.tick(1100);
    expect(s.judgments).toMatchObject({ perfect: 1, great: 0, miss: 1 });

    s.setChordAssist(true);
    s.press(0, 2000, { touchChordAssist: true });
    s.tick(2100);

    expect(s.judgments).toMatchObject({ perfect: 2, great: 1, miss: 1 });
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
