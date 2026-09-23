import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LaneInputTracker } from "../input/touchInput";
import { GameSession, maxScore } from "../engine/playState";
import { comboMultiplier } from "../engine/judge";
import type { ChartJSON, ChartNote } from "../types/chart";
import type { CatalogJSON } from "../types/catalog";

type InputAction = {
  atMs: number;
  lane: number;
  kind: "press" | "release";
  order: number;
};

const catalog = JSON.parse(
  readFileSync(new URL("../../public/catalog.json", import.meta.url), "utf8"),
) as CatalogJSON;

function chartActions(notes: ChartNote[]): InputAction[] {
  const actions: InputAction[] = [];
  const pressAndLift = (lane: number, atMs: number) => {
    actions.push({ atMs, lane, kind: "press", order: 1 });
    actions.push({ atMs: atMs + 1, lane, kind: "release", order: 2 });
  };
  for (const note of notes) {
    const headMs = note.t * 1000;
    if (note.type === "tap") pressAndLift(note.lane, headMs);
    if (note.type === "chord") for (const lane of note.lanes) pressAndLift(lane, headMs);
    if (note.type === "hold") {
      actions.push({ atMs: headMs, lane: note.lane, kind: "press", order: 1 });
      actions.push({ atMs: note.end * 1000, lane: note.lane, kind: "release", order: 0 });
    }
    if (note.type === "slide") {
      pressAndLift(note.lane, headMs);
      pressAndLift(note.to, note.end * 1000);
    }
  }
  return actions.sort((a, b) => a.atMs - b.atMs || a.order - b.order || a.lane - b.lane);
}

function playPerfect(chart: ChartJSON) {
  const session = new GameSession(chart, "arcade");
  const input = new LaneInputTracker();
  for (const action of chartActions(chart.notes)) {
    const source = `key:${action.lane}`;
    const transition = action.kind === "press"
      ? input.begin(source, action.lane, action.atMs)
      : input.end(source);
    if (transition.release !== null) session.release(transition.release, action.atMs);
    if (transition.press !== null) session.press(transition.press, action.atMs);
  }
  return { session, input };
}

function exactAllPerfectScore(totalNotes: number): number {
  let score = 0;
  for (let combo = 1; combo <= totalNotes; combo += 1) {
    score += 300 * comboMultiplier(combo);
  }
  return score;
}

describe("production catalog physical playability", () => {
  it("allows every chart to reach an all-perfect result through real input ownership", () => {
    const failures: string[] = [];
    for (const track of catalog.tracks) {
      for (const tier of ["easy", "standard", "hard"] as const) {
        const chartPath = track.charts[tier].split("?")[0].replace(/^\//, "");
        const chart = JSON.parse(
          readFileSync(new URL(`../../public/${chartPath}`, import.meta.url), "utf8"),
        ) as ChartJSON;
        const { session, input } = playPerfect(chart);
        const result = session.getResult();
        const okay = session.isComplete
          && result.allPerfect
          && result.judgments.perfect === chart.total_notes
          && result.score === exactAllPerfectScore(chart.total_notes)
          && result.score <= maxScore(chart.total_notes)
          && result.maxCombo === chart.total_notes
          && input.activeSourceCount() === 0;
        if (!okay) {
          failures.push(`${track.track_id}/${tier}: ${JSON.stringify({
            complete: session.isComplete,
            score: result.score,
            expectedScore: exactAllPerfectScore(chart.total_notes),
            maxCombo: result.maxCombo,
            totalNotes: chart.total_notes,
            judgments: result.judgments,
            activeSources: input.activeSourceCount(),
          })}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
