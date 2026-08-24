import { describe, expect, it } from "vitest";
import { getPreset } from "../presets";
import { buildDemoCharts } from "../chart/autoChart";
import {
  beatMs,
  beatToMs,
  cuesToNotes,
  planDemoSong,
} from "../audio/demoSong";
import { approachLeadMs, initPlay, pressLane, releaseLane } from "../engine/playState";
import { judgeDelta } from "../engine/judge";
import type { ChartJSON } from "../types/chart";
import { TIER_AR } from "../presets";

const CHART_MAIN = getPreset("mg-chart-main")!;

describe("PRD §14.4 automated acceptance", () => {
  it("T-AUTO-03: standard demo note count in range", () => {
    const charts = buildDemoCharts(CHART_MAIN, "blob:test");
    const n = charts.standard.notes.length;
    expect(n).toBeGreaterThanOrEqual(40);
    expect(n).toBeLessThanOrEqual(220);
  });

  it("T-AUTO-04: first note timing @ 160 BPM demo", () => {
    const plan = planDemoSong(CHART_MAIN);
    const notes = cuesToNotes(plan, "standard");
    expect(notes.length).toBeGreaterThan(0);
    expect(notes[0]!.t).toBeGreaterThanOrEqual(1000);
    expect(notes[0]!.t).toBeLessThanOrEqual(2500);
  });
});

describe("PRD §14.2 fun acceptance (automated)", () => {
  const plan = planDemoSong(CHART_MAIN);
  const charts = buildDemoCharts(CHART_MAIN, "blob:test");
  const standard = charts.standard;

  it("T-FUN-04: lane 0 cues on kick beats, lane 3 on snare beats", () => {
    const isDrop = (beat: number) => {
      let sec = "intro";
      for (const s of plan.sections) {
        if (beat >= s.startBeat) sec = s.type;
      }
      return sec === "drop";
    };

    for (const c of plan.cues.filter(
      (x) => x.lane === 0 && x.type === "tap" && x.beat >= 8 && x.beat % 1 === 0,
    )) {
      const bb = c.beat % 4;
      const kick = bb === 0 || (isDrop(c.beat) && bb === 2);
      expect(kick).toBe(true);
    }
    for (const c of plan.cues.filter(
      (x) => x.lane === 3 && x.type === "tap" && x.beat >= 8 && x.beat % 1 === 0,
    )) {
      const bb = c.beat % 4;
      expect(bb === 1 || bb === 3).toBe(true);
    }
  });

  it("T-FUN-07: casual mode never sets failed via HP", () => {
    let play = initPlay(standard, "casual");
    for (let i = 0; i < 30; i++) {
      play = pressLane(play, standard, 0, 999999, 0, "casual");
    }
    expect(play.failed).toBe(false);
    expect(play.hp).toBe(100);
  });

  it("T-FUN-09: standard AR note visible ≥ 1.2s before receptor", () => {
    const lead = approachLeadMs(TIER_AR.standard);
    expect(lead).toBeGreaterThanOrEqual(1200);
  });

  it("T-FUN-10: demo ≤ 48s and drop ≤ 10s after audio start", () => {
    const durationSec = (plan.totalBeats * beatMs(plan.bpm)) / 1000;
    expect(durationSec).toBeLessThanOrEqual(48);

    const drop = standard.meta.sections?.find((s) => s.type === "drop");
    expect(drop).toBeDefined();
    expect(drop!.t / 1000).toBeLessThanOrEqual(10);
  });

  it("T-FUN-03: drop section metadata present for flash trigger", () => {
    expect(standard.meta.sections?.some((s) => s.type === "drop")).toBe(true);
    expect(standard.meta.sections![0]!.t).toBe(beatToMs(24, plan.bpm));
  });

  it("T-FUN-06: combo milestones include 25/50/100 in chart density", () => {
    expect(standard.notes.length).toBeGreaterThan(50);
  });
});

describe("PRD §14.1 functional acceptance (automated)", () => {
  it("T-02b: 15 consecutive misses fail arcade", () => {
    const charts = buildDemoCharts(CHART_MAIN, "blob:test");
    const chart = charts.standard;
    let play = initPlay(chart, "arcade");
    for (let i = 0; i < 15; i++) {
      play = pressLane(play, chart, 0, 999999 + i, 0, "arcade");
    }
    expect(play.failed).toBe(true);
    expect(play.hp).toBeLessThanOrEqual(0);
  });

  it("T-03b: hard chart denser than easy (same audio)", () => {
    const charts = buildDemoCharts(CHART_MAIN, "blob:test");
    expect(charts.hard.notes.length).toBeGreaterThan(charts.easy.notes.length);
  });

  it("T-02: hold head and tail judged", () => {
    const chart: ChartJSON = {
      version: "1.1",
      meta: {
        title: "hold-test",
        artist: "test",
        bpm: 120,
        offset_ms: 0,
        preset_id: "t",
        chart_tier: "standard",
        approach_rate: 28,
        audio_url: "",
        engine: "stable-audio-3",
      },
      notes: [{ id: "h1", t: 1000, lane: 1, type: "hold", end_t: 2000 }],
    };
    let play = initPlay(chart, "casual");
    play = pressLane(play, chart, 1, 1000, 0, "casual");
    expect(play.notes[0]!.headJudged).toBe("perfect");
    play = releaseLane(play, 1, 2000, 0, "casual");
    expect(play.notes[0]!.tailJudged).toBe("perfect");
  });

  it("T-08: Rhythm OP preset is vocal-capable", () => {
    const vocal = getPreset("mg-theme-vocal");
    expect(vocal?.mode).toBe("game_theme_vocal");
    expect(vocal?.engine).toBe("ace-step-1.5");
    expect(vocal?.lyrics).toBeTruthy();
  });

  it("T-10: judge windows are time-based per mode", () => {
    expect(judgeDelta(30, "casual")).toBe("perfect");
    expect(judgeDelta(30, "arcade")).toBe("great");
  });
});
