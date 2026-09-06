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
import { laneHand } from "../input/touchInput";

export type SessionOptions = {
  /**
   * Touch-only forgiveness for two-thumb play.
   *
   * Two thumbs cover four lanes, one hand per pair. When a chart stacks a chord
   * on a single hand (lanes 0+1 or 2+3), no thumb can hold both — the lane goes
   * unplayed and the player eats a miss they never had a chance at. With assist
   * on, a lane whose same-hand partner was struck is banked as GREAT instead of
   * dropped. Chords that split across hands are untouched: those are fair.
   *
   * Banked rather than perfect on purpose — it keeps an all-perfect run honest.
   */
  chordAssist?: boolean;
};

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
  /** Signed ms: negative = early, positive = late. */
  deltaMs: number;
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
  /**
   * The same notes sorted by head time. `tick` and the draw loop walk this
   * from `cursor` so only the live window is touched. `notes` keeps its chart
   * order because `press` resolves ties by array order.
   */
  readonly order: RTNote[];
  /** First index in `order` that is not fully judged yet — never walks back. */
  cursor = 0;
  readonly totalNotes: number;
  readonly mode: PlayMode;
  readonly chordAssist: boolean;

  score = 0;
  combo = 0;
  maxCombo = 0;
  hp = 100;
  judgments: Record<Judgment, number> = ZERO_COUNTS();
  missEvents: Array<{ tMs: number; lane: number }> = [];
  failed = false;
  consecutiveMiss = 0;

  /**
   * Signed timing profile for the results error bar (T3). `deltaMs = songMs - noteMs`,
   * so negative = early, positive = late. Only landed notes contribute: a missed
   * note has no trustworthy delta, so misses stay out of all three numbers.
   */
  timingEarly = 0;
  timingLate = 0;
  timingSumMs = 0;
  timingCount = 0;

  /** Judged notes — maintained instead of scanning `notes.every(n => n.done)`. */
  private doneCount = 0;
  /**
   * `tick`'s return buffer. Reused every frame: consumers must read it before
   * the next tick (the play loop does — it only iterates it).
   */
  private readonly fxBuf: JudgeFx[] = [];
  private slowPending = false;

  constructor(chart: ChartJSON, mode: PlayMode, options: SessionOptions = {}) {
    this.mode = mode;
    this.chordAssist = options.chordAssist === true;
    this.notes = chart.notes.map((def) => ({
      def,
      tMs: (def.t ?? 0) * 1000,
      endMs: ("end" in def && def.end ? def.end : def.t) * 1000,
      head: null,
      tail: null,
      chord: {},
      done: false,
    }));
    // Stable sort: charts already arrive time-ordered, so this is a no-op for
    // real data and only guarantees the cursor window is meaningful.
    this.order = [...this.notes].sort((a, b) => a.tMs - b.tMs);
    this.totalNotes = chart.total_notes || countTotalNotes(chart.notes);
  }

  get isComplete(): boolean {
    return this.doneCount >= this.notes.length;
  }

  /** Mark a note judged and keep `doneCount` in step (idempotent). */
  private markDone(n: RTNote): void {
    if (n.done) return;
    n.done = true;
    this.doneCount++;
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
    this.register(j, j === "miss" ? { lane, tMs: songMs } : undefined, delta);

    if (sub === "head") {
      chosen.head = j;
      if (chosen.def.type === "tap") this.markDone(chosen);
      if (chosen.def.type === "slide" && j === "miss") this.markDone(chosen);
    } else if (sub === "chord") {
      chosen.chord[lane] = j;
      if (chosen.def.type === "chord" && chosen.def.lanes.every((l) => chosen.chord[l] != null))
        this.markDone(chosen);
    } else {
      chosen.tail = j;
      this.markDone(chosen);
    }
    return { lane, judgment: j, deltaMs: delta };
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
      this.register(j, j === "miss" ? { lane, tMs: songMs } : undefined, delta);
      n.tail = j;
      this.markDone(n);
      return { lane, judgment: j, deltaMs: delta };
    }
    return null;
  }

  /** Auto-miss notes whose window has fully passed. Returns FX for rendering. */
  tick(songMs: number): JudgeFx[] {
    // Reused buffer (see `fxBuf`): consumed synchronously by the play loop.
    const applied = this.fxBuf;
    applied.length = 0;
    if (this.failed || this.isComplete) return applied;
    const good = goodWindowMs(this.mode);
    const order = this.order;
    for (let i = this.cursor; i < order.length; i++) {
      const n = order[i]!;
      if (n.done) continue;
      const d = n.def;
      if (d.type === "tap") {
        if (n.head === null && songMs - n.tMs > good) {
          n.head = "miss";
          this.markDone(n);
          this.register("miss", { lane: d.lane, tMs: songMs });
          applied.push({ lane: d.lane, judgment: "miss", deltaMs: songMs - n.tMs });
        }
      } else if (d.type === "chord") {
        for (const l of d.lanes) {
          if (n.chord[l] == null && songMs - n.tMs > good) {
            if (this.sameHandPartnerStruck(n, l)) {
              n.chord[l] = "great";
              this.register("great");
              applied.push({ lane: l, judgment: "great", deltaMs: songMs - n.tMs });
              continue;
            }
            n.chord[l] = "miss";
            this.register("miss", { lane: l, tMs: songMs });
            applied.push({ lane: l, judgment: "miss", deltaMs: songMs - n.tMs });
          }
        }
        if (d.lanes.every((l) => n.chord[l] != null)) this.markDone(n);
      } else if (d.type === "hold") {
        if (n.head === null && songMs - n.tMs > good) {
          n.head = "miss";
          n.tail = "miss";
          this.markDone(n);
          this.register("miss", { lane: d.lane, tMs: songMs });
          this.register("miss", { lane: d.lane, tMs: songMs });
          applied.push({ lane: d.lane, judgment: "miss", deltaMs: songMs - n.tMs });
        } else if (n.head !== null && n.tail === null && songMs - n.endMs > good + 20) {
          n.tail = "miss";
          this.markDone(n);
          this.register("miss", { lane: d.lane, tMs: songMs });
          applied.push({ lane: d.lane, judgment: "miss", deltaMs: songMs - n.endMs });
        }
      } else if (d.type === "slide") {
        if (n.head === null && songMs - n.tMs > good) {
          n.head = "miss";
          this.markDone(n);
          this.register("miss", { lane: d.lane, tMs: songMs });
          applied.push({ lane: d.lane, judgment: "miss", deltaMs: songMs - n.tMs });
        } else if (n.head !== null && n.tail === null && songMs - n.endMs > good + 20) {
          n.tail = "miss";
          this.markDone(n);
          this.register("miss", { lane: d.to, tMs: songMs });
          applied.push({ lane: d.to, judgment: "miss", deltaMs: songMs - n.endMs });
        }
      }
    }
    // Retire the judged head of the window. A hold stays un-done long after its
    // head time (the tail is still playable), so only advance over notes that
    // are finished — never over time.
    while (this.cursor < order.length && order[this.cursor]!.done) this.cursor++;
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
      missEvents: [...this.missEvents],
      timing: this.timingCount
        ? {
            early: this.timingEarly,
            late: this.timingLate,
            meanMs: this.timingSumMs / this.timingCount,
          }
        : undefined,
    };
  }

  /**
   * True when this chord lane is unplayed but another lane under the same thumb
   * was struck. Only ever consulted when `chordAssist` is on.
   */
  private sameHandPartnerStruck(n: RTNote, lane: number): boolean {
    if (!this.chordAssist) return false;
    const d = n.def;
    if (d.type !== "chord") return false;
    const hand = laneHand(lane);
    for (const other of d.lanes) {
      if (other === lane) continue;
      if (laneHand(other) !== hand) continue;
      const j = n.chord[other];
      if (j != null && j !== "miss") return true;
    }
    return false;
  }

  private register(j: Judgment, meta?: { lane: number; tMs: number }, deltaMs?: number): void {
    this.judgments[j]++;
    if (j === "miss" && meta) {
      this.missEvents.push({ lane: meta.lane, tMs: meta.tMs });
    } else if (typeof deltaMs === "number") {
      // Landed note: keep the signed offset for the results error bar (T3).
      this.timingSumMs += deltaMs;
      this.timingCount++;
      if (deltaMs < 0) this.timingEarly++;
      else if (deltaMs > 0) this.timingLate++;
    }
    if (j === "miss" || j === "good") {
      this.combo = 0;
      if (this.mode === "arcade") {
        this.hp = Math.max(0, Math.min(100, this.hp + hpDelta(j)));
        if (this.hp <= 0) this.failed = true;
      }
      if (j === "miss" && this.mode === "practice") {
        this.consecutiveMiss++;
        if (this.consecutiveMiss >= 3) {
          this.slowPending = true;
          this.consecutiveMiss = 0;
        }
      } else {
        this.consecutiveMiss = 0;
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
