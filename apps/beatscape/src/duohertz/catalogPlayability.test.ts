import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDuohertzChart, type DuohertzChart, type KeyIndex } from "./chart";
import { DuohertzSession } from "./session";

type Action = { timeMs: number; key: KeyIndex; kind: "press" | "release" };
const candidates = new URL("../../candidates/duohertz/", import.meta.url);
const timing = { perfectMs: 60, greatMs: 105, goodMs: 155 };

function actionsFor(chart: DuohertzChart): Action[] {
  const actions: Action[] = [];
  const tap = (key: KeyIndex, timeMs: number) => {
    actions.push({ timeMs, key, kind: "press" });
    actions.push({ timeMs: timeMs + 1, key, kind: "release" });
  };
  for (const note of chart.notes) {
    const headMs = note.t * 1000;
    if (note.type === "tap") tap(note.key, headMs);
    else if (note.type === "chord") for (const key of note.keys) tap(key, headMs);
    else {
      actions.push({ timeMs: headMs, key: note.key, kind: "press" });
      actions.push({ timeMs: note.end * 1000, key: note.key, kind: "release" });
    }
  }
  return actions.sort((a, b) => a.timeMs - b.timeMs
    || Number(a.kind === "press") - Number(b.kind === "press") || a.key - b.key);
}

function currentCharts(): { id: string; tier: string; chart: DuohertzChart }[] {
  const charts = [];
  for (const directory of readdirSync(candidates, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^dh-\d{3}-/.test(entry.name))) {
    const root = new URL(`${directory.name}/`, candidates);
    const manifest = JSON.parse(readFileSync(new URL("manifest.json", root), "utf8"));
    for (const tier of ["easy", "standard", "hard"] as const) {
      const bytes = readFileSync(new URL(`${tier}.json`, root));
      const digest = createHash("sha256").update(bytes).digest("hex");
      if (digest !== manifest.files_sha256[`${tier}.json`]) {
        throw new Error(`Chart changed after its manifest: ${directory.name}/${tier}`);
      }
      const chart = parseDuohertzChart(JSON.parse(bytes.toString("utf8")));
      if (chart.track_id !== directory.name || chart.tier !== tier || chart.bpm !== manifest.bpm
        || chart.notes.some((note) => (note.type === "hold" ? note.end : note.t) >= manifest.duration_sec)) {
        throw new Error(`Chart identity or duration mismatch: ${directory.name}/${tier}`);
      }
      charts.push({ id: directory.name, tier, chart });
    }
  }
  return charts;
}

describe("current duohertz candidate chart playability", () => {
  it("can settle every current one/two-key chart from exact authored inputs, with independent Duo results", () => {
    const charts = currentCharts();
    expect(charts).toHaveLength(315);
    const failures: string[] = [];
    for (const { id, tier, chart } of charts) {
      const session = new DuohertzSession(chart, timing);
      const active = new Set<KeyIndex>();
      for (const action of actionsFor(chart)) {
        const overdue = session.tick(action.timeMs);
        if (overdue.length) failures.push(`${id}/${tier}: overdue before ${action.kind} at ${action.timeMs}ms`);
        if (action.kind === "press") {
          if (active.has(action.key)) failures.push(`${id}/${tier}: key ${action.key} already held`);
          active.add(action.key);
          session.press(action.key, action.timeMs);
        } else {
          if (!active.delete(action.key)) failures.push(`${id}/${tier}: key ${action.key} was not held`);
          session.release(action.key, action.timeMs);
        }
      }
      const finishMs = Math.max(...chart.notes.map((note) => (note.type === "hold" ? note.end : note.t) * 1000)) + 10_000;
      const late = session.tick(finishMs);
      const result = session.result();
      if (late.length || active.size || !result.complete || result.judged !== chart.total_notes
        || result.counts.perfect !== chart.total_notes || result.points !== chart.total_notes * 3) {
        failures.push(`${id}/${tier}: ${JSON.stringify({ result, late: late.length, active: active.size })}`);
      }
      if (chart.input_count === 2) {
        for (const key of [0, 1] as const) {
          const player = session.resultForKey(key);
          if (!player.complete || player.total === 0 || player.counts.perfect !== player.total
            || player.points !== player.total * 3) {
            failures.push(`${id}/${tier}/player${key + 1}: ${JSON.stringify(player)}`);
          }
        }
      }
      const unattended = new DuohertzSession(chart, timing);
      unattended.tick(finishMs);
      const missed = unattended.result();
      if (!missed.complete || missed.judged !== chart.total_notes || missed.counts.miss !== chart.total_notes
        || missed.failed) {
        failures.push(`${id}/${tier}/unattended: ${JSON.stringify(missed)}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
