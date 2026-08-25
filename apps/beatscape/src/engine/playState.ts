import type { ChartJSON, ChartNote, Judgment, PlayMode, PlayResult } from "../types/chart";
import {
  accuracyPercent,
  comboMultiplier,
  goodWindowMs,
  gradeFromAccuracy,
  hpDelta,
  judgeDelta,
  judgeHoldTail,
  judgmentScore,
  maxScore,
} from "./judge";

/** Total judgment objects a chart contributes (PRD §4.4). */
export function countTotalNotes(notes: ChartNote[]): number {
  let n = 0;
  for (const note of notes) {
    if (note.type === "tap" || note.type === "slide") n += 1;
    else if (note.type === "hold") n += 2;
    else if (note.type === "chord") n += note.lanes.length;
  }
  return n;
}

type SubJudgment = "head" | "tail" | "chord";

interface RTNote {
  def: ChartNote;
  tMs: number; // head hit time (ms)
  endMs: number; // tail / completion time (ms)
  head: Judgment | null;
  tail: Judgment | null; // hold tail OR slide completion
  chord: Partial<Record<number, Judgment>>;
  done: boolean;
}

export interface JudgeFx {
  lane: number;
  judgment: Judgment;
}

const ZERO_COUNTS = (): Record<Judgment, number> => ({
  perfect: 0,
  great: 0,
  good: 0,
  miss: 0,
});

/**
 * Live game session. The single runtime object that owns note state, scoring,
 * combo and HP. Pure logic driven by an external clock (Conductor); it never
 * touches the DOM or audio itself.
 */
export class GameSession {
  readonly notes: RTNote[];
  readonly totalNotes: number;
  readonly mode: PlayMode;

  score = 0;
  combo = 0;
  maxCombo = 0;
  hp = 100;
  judgments: Record<Judgment, number> = ZERO_COUNTS();
  failed = false;
  consecutiveMiss = 0;

  private slowPending = false;

  constructor(chart: ChartJSON, mode: PlayMode) {
    this.mode = mode;
    this.notes = chart.notes.map((def) => ({
      def,
      tMs: (def.t ?? 0) * 1000,
      endMs: ("end" in def && def.end ? def.end : def.t) * 1000,
      head: null,
      tail: null,
      chord: {},
      done: false,
    }));
    this.totalNotes = chart.total_notes || countTotalNotes(chart.notes);
  }

  get isComplete(): boolean {
    return this.notes.every((n) => n.done);
  }

  /** PlayField consumes this once when 3 consecutive misses occur (Practice). */
  consumeSlowTrigger(): boolean {
    if (this.slowPending) {
      this.slowPending = false;
      return true;
    }
    return false;
  }

  press(lane: number, songMs: number): JudgeFx | null {
    if (this.failed || this.isComplete) return null;
    const good = goodWindowMs(this.mode);
    let best: RTNote | null = null;
    let bestSub: SubJudgment = "head";
    let bestDelta = Infinity;

    for (const n of this.notes) {
      if (n.done) continue;
      const d = n.def;
      let sub: SubJudgment | null = null;
      let delta = 0;
      if (d.type === "tap" || d.type === "hold") {
        if (d.lane === lane && n.head === null) {
          sub = "head";
          delta = songMs - n.tMs;
        }
      } else if (d.type === "chord") {
        if (d.lanes.includes(lane as 0 | 1 | 2 | 3) && n.chord[lane] == null) {
          sub = "chord";
          delta = songMs - n.tMs;
        }
      } else if (d.type === "slide") {
        if (n.head === null && d.lane === lane) {
          sub = "head";
          delta = songMs - n.tMs;
        } else if (n.head !== null && n.tail === null && d.to === lane) {
          sub = "tail";
          delta = songMs - n.endMs;
        }
      }
      if (sub === null) continue;
      if (Math.abs(delta) > good) continue;
      if (Math.abs(delta) < Math.abs(bestDelta)) {
        best = n;
        bestSub = sub;
        bestDelta = delta;
      }
    }

    if (!best) return null; // empty press → no penalty, no combo break

    const chosen = best;
    const sub = bestSub;
    const delta = sub === "tail" ? songMs - chosen.endMs : songMs - chosen.tMs;
    const j: Judgment = sub === "tail" ? judgeHoldTail(delta, this.mode) : judgeDelta(delta, this.mode);
    this.register(j);

    if (sub === "head") {
      chosen.head = j;
      if (chosen.def.type === "tap" || chosen.def.type === "slide") chosen.done = true;
    } else if (sub === "chord") {
      chosen.chord[lane] = j;
      if (chosen.def.type === "chord" && chosen.def.lanes.every((l) => chosen.chord[l] != null))
        chosen.done = true;
    } else {
      chosen.tail = j;
      chosen.done = true;
    }
    return { lane, judgment: j };
  }

  /** Releasing a key only matters for holds (tail). */
  release(lane: number, songMs: number): JudgeFx | null {
    if (this.failed || this.isComplete) return null;
    const good = goodWindowMs(this.mode);
    for (const n of this.notes) {
      if (n.done || n.def.type !== "hold") continue;
      if (n.def.lane !== lane || n.head === null || n.tail !== null) continue;
      const delta = songMs - n.endMs;
      const j: Judgment = Math.abs(delta) <= good + 20 ? judgeHoldTail(delta, this.mode) : "miss";
      this.register(j);
      n.tail = j;
      n.done = true;
      return { lane, judgment: j };
    }
    return null;
  }

  /** Auto-miss notes whose window has fully passed. Returns FX for rendering. */
  tick(songMs: number): JudgeFx[] {
    if (this.failed || this.isComplete) return [];
    const good = goodWindowMs(this.mode);
    const applied: JudgeFx[] = [];
    for (const n of this.notes) {
      if (n.done) continue;
      const d = n.def;
      if (d.type === "tap") {
        if (n.head === null && songMs - n.tMs > good) {
          n.head = "miss";
          n.done = true;
          this.register("miss");
          applied.push({ lane: d.lane, judgment: "miss" });
        }
      } else if (d.type === "chord") {
        for (const l of d.lanes) {
          if (n.chord[l] == null && songMs - n.tMs > good) {
            n.chord[l] = "miss";
            this.register("miss");
            applied.push({ lane: l, judgment: "miss" });
          }
        }
        if (d.lanes.every((l) => n.chord[l] != null)) n.done = true;
      } else if (d.type === "hold") {
        if (n.head === null && songMs - n.tMs > good) {
          n.head = "miss";
          n.tail = "miss";
          n.done = true;
          this.register("miss");
          this.register("miss");
          applied.push({ lane: d.lane, judgment: "miss" });
        } else if (n.head !== null && n.tail === null && songMs - n.endMs > good + 20) {
          n.tail = "miss";
          n.done = true;
          this.register("miss");
          applied.push({ lane: d.lane, judgment: "miss" });
        }
      } else if (d.type === "slide") {
        if (n.head === null && songMs - n.tMs > good) {
          n.head = "miss";
          n.done = true;
          this.register("miss");
          applied.push({ lane: d.lane, judgment: "miss" });
        } else if (n.head !== null && n.tail === null && songMs - n.endMs > good + 20) {
          n.tail = "miss";
          n.done = true;
          this.register("miss");
          applied.push({ lane: d.to, judgment: "miss" });
        }
      }
    }
    return applied;
  }

  getResult(): PlayResult {
    const accuracy = accuracyPercent(this.judgments, this.totalNotes);
    const fullCombo = this.judgments.miss === 0 && this.totalNotes > 0;
    const allPerfect =
      this.judgments.perfect === this.totalNotes && this.totalNotes > 0 && this.judgments.miss === 0;
    return {
      score: this.score,
      accuracy,
      maxCombo: this.maxCombo,
      grade: gradeFromAccuracy(accuracy),
      fullCombo,
      allPerfect,
      failed: this.failed,
      judgments: { ...this.judgments },
      totalNotes: this.totalNotes,
    };
  }

  private register(j: Judgment): void {
    this.judgments[j]++;
    if (j === "miss" || j === "good") {
      this.combo = 0;
      this.consecutiveMiss = 0; // a non-miss breaks the consecutive-miss streak
      if (this.mode === "arcade") {
        this.hp = Math.max(0, Math.min(100, this.hp + hpDelta(j)));
        if (this.hp <= 0) this.failed = true;
      }
      if (this.mode === "practice" && j === "miss") {
        this.consecutiveMiss++;
        if (this.consecutiveMiss >= 3) {
          this.slowPending = true;
          this.consecutiveMiss = 0;
        }
      }
    } else {
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.score += judgmentScore(j) * comboMultiplier(this.combo);
      this.consecutiveMiss = 0;
      if (this.mode === "arcade") {
        this.hp = Math.max(0, Math.min(100, this.hp + hpDelta(j)));
      }
    }
  }
}

/** Lightweight constructor kept for the PRD acceptance tests. */
export function initPlay(chart: ChartJSON, mode: PlayMode): GameSession {
  return new GameSession(chart, mode);
}

/** Finalize a session into a result (kept for the PRD acceptance tests). */
export function finalize(session: GameSession): PlayResult {
  return session.getResult();
}

export { maxScore };
