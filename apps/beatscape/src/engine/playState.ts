import type { ChartJSON, ChartNote, Judgment, PlayMode, PlayResult } from "../types/chart";
import {
  accuracyPercent,
  comboMultiplier,
  goodWindowMs,
  gradeFromAccuracy,
  hpDelta,
  isAllPerfect,
  isFullCombo,
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
  /** Omit chart objects before this absolute chart time for section practice. */
  startAtMs?: number;
  /** Exclude chart objects whose head starts at or after this absolute chart time. */
  endAtMs?: number;
  /** Distinguishes an intentional intro-section retry (`startAtMs: 0`) from a full run. */
  sectionPractice?: boolean;
};

export type PressOptions = {
  /**
   * Whether this physical press came from a touch contact eligible for the
   * two-thumb chord assist. Keyboard and mouse presses must pass false even on
   * a hybrid device whose primary pointer is coarse.
   *
   * Defaults to true for direct engine callers after SessionOptions has
   * explicitly enabled the assist; PlayField always supplies the real source.
   */
  touchChordAssist?: boolean;
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

export type JudgeFxAccent =
  | "hold-release"
  | "hold-release-miss"
  | "slide-complete"
  | "slide-target-miss"
  | "slide-hold-miss"
  | "chord-assist";

interface RTNote {
  def: ChartNote;
  tMs: number; // head hit time (ms)
  endMs: number; // tail / completion time (ms)
  head: Judgment | null;
  /** Signed timing captured while a Slide waits for its completion lane. */
  headDeltaMs: number | null;
  tail: Judgment | null; // hold tail OR slide completion
  /** The player reached a Slide's destination early and is still holding it. */
  tailHeld: boolean;
  /** The player reached a Slide's destination at least once during this gesture. */
  tailReached: boolean;
  /** Pause cleared an early destination hold that may be safely re-grabbed. */
  tailNeedsRearm: boolean;
  chord: Partial<Record<number, Judgment>>;
  /** Signed timing for each independently judged Chord lane. */
  chordDeltaMs: Partial<Record<number, number>>;
  /** Presentation-only lane cues used to build one readable Chord summary. */
  chordAccents: Partial<Record<number, JudgeFxAccent>>;
  /** Chord lanes whose landed press came from a real touch contact. */
  touchChordLanes: Partial<Record<number, boolean>>;
  done: boolean;
}

export interface JudgeFx {
  lane: number;
  judgment: Judgment;
  /** Signed ms: negative = early, positive = late. */
  deltaMs: number;
  /** Exact points committed by this judgment before any later event mutates combo. */
  scoreGain: number;
  /** Optional non-scoring cue that helps the presentation identify a gesture endpoint. */
  accent?: JudgeFxAccent;
  /**
   * Chord lanes still score and burst independently, but presentation waits
   * for one group summary so adjacent mobile labels never stack into noise.
   */
  chordFeedback?: {
    lanes: Array<0 | 1 | 2 | 3>;
    summary?: {
      lane: number;
      judgment: Judgment;
      deltaMs: number;
      accent?: JudgeFxAccent;
    };
  };
}

const ZERO_COUNTS = (): Record<Judgment, number> => ({
  perfect: 0,
  great: 0,
  good: 0,
  miss: 0,
});

const JUDGMENT_SEVERITY: Record<Judgment, number> = {
  perfect: 0,
  great: 1,
  good: 2,
  miss: 3,
};

/** A Slide is one score object, but both endpoints must matter. */
function resolveSlideJudgment(
  head: Judgment,
  headDeltaMs: number,
  tail: Judgment,
  tailDeltaMs: number,
): { judgment: Judgment; deltaMs: number } {
  return JUDGMENT_SEVERITY[head] > JUDGMENT_SEVERITY[tail]
    ? { judgment: head, deltaMs: headDeltaMs }
    : { judgment: tail, deltaMs: tailDeltaMs };
}

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
  private chordAssist: boolean;
  readonly startAtMs: number;
  readonly endAtMs: number | undefined;
  readonly sectionPractice: boolean;

  score = 0;
  combo = 0;
  /** Monotonic event serial; presentation consumes breaks without inferring from final combo. */
  comboBreaks = 0;
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
    this.sectionPractice = options.sectionPractice === true;
    this.startAtMs = Number.isFinite(options.startAtMs)
      ? Math.max(0, options.startAtMs ?? 0)
      : 0;
    this.endAtMs = this.sectionPractice && Number.isFinite(options.endAtMs) && (options.endAtMs ?? 0) > this.startAtMs
      ? options.endAtMs
      : undefined;
    const playableNotes = this.sectionPractice
      ? chart.notes.filter((def) => {
          const headMs = def.t * 1000;
          return headMs >= this.startAtMs && (this.endAtMs === undefined || headMs < this.endAtMs);
        })
      : chart.notes;
    this.notes = playableNotes.map((def) => ({
      def,
      tMs: (def.t ?? 0) * 1000,
      endMs: ("end" in def && def.end ? def.end : def.t) * 1000,
      head: null,
      headDeltaMs: null,
      tail: null,
      tailHeld: false,
      tailReached: false,
      tailNeedsRearm: false,
      chord: {},
      chordDeltaMs: {},
      chordAccents: {},
      touchChordLanes: {},
      done: false,
    }));
    // Stable sort: charts already arrive time-ordered, so this is a no-op for
    // real data and only guarantees the cursor window is meaningful.
    this.order = [...this.notes].sort((a, b) => a.tMs - b.tMs);
    // A section slice owns its own denominator. Reusing chart.total_notes here
    // would make a perfect drop-only run report ~30% accuracy.
    this.totalNotes = this.sectionPractice
      ? countTotalNotes(playableNotes)
      : chart.total_notes || countTotalNotes(chart.notes);
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

  /**
   * Apply the touch-accessibility preference to notes that have not finished
   * judging yet. Existing judgments and score state are deliberately left
   * untouched, so a paused settings change never rewrites the run.
   */
  setChordAssist(enabled: boolean): void {
    this.chordAssist = enabled;
  }

  /**
   * Whether a previously landed Hold head is still waiting for its tail.
   *
   * Pause and OS interruptions deliberately clear physical input ownership so
   * a missing keyup/pointerup cannot leave a lane stuck. During the 3-second
   * resume countdown, this lets the player safely re-grab only that interrupted
   * Hold; fresh notes remain inert until GO.
   */
  canRearmHold(lane: number): boolean {
    return this.notes.some((note) => (
      !note.done
      && note.def.type === "hold"
      && note.def.lane === lane
      && note.head !== null
      && note.head !== "miss"
      && note.tail === null
    ));
  }

  /**
   * Re-grab an armed Slide destination during a safe resume countdown.
   * The song clock is frozen then, so this restores physical ownership only;
   * `tick()` still waits for the real endpoint before awarding anything.
   */
  rearmSlideTarget(lane: number): boolean {
    const target = this.nextArmedSlideTarget(lane, true);
    if (!target) return false;
    target.tailHeld = true;
    target.tailReached = true;
    target.tailNeedsRearm = false;
    return true;
  }

  /** Pause/blur clears physical ownership; an early Slide target must follow it. */
  clearHeldInputs(): void {
    for (const note of this.notes) {
      if (note.tailHeld) note.tailNeedsRearm = true;
      note.tailHeld = false;
    }
  }

  /** Whether this lane currently owns an early Slide destination. */
  isSlideTargetHeld(lane: number): boolean {
    return this.notes.some((note) => (
      !note.done
      && note.def.type === "slide"
      && note.def.to === lane
      && note.tailHeld
      && note.tail === null
    ));
  }

  press(lane: number, songMs: number, options: PressOptions = {}): JudgeFx | null {
    if (this.failed || this.isComplete) return null;
    const good = goodWindowMs(this.mode);
    let best: RTNote | null = null;
    let earlySlideTarget: RTNote | null = null;
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
          // Reaching the destination before its timestamp is a continuous
          // Slide gesture, not an empty press. Latch it and let `tick()` award
          // the endpoint only if the player is still there when the trail
          // ends. This covers both a held key and a thumb that stopped moving.
          if (songMs < n.endMs) {
            if (!earlySlideTarget || n.endMs < earlySlideTarget.endMs) earlySlideTarget = n;
            continue;
          }
          sub = "tail";
          delta = songMs - n.endMs;
        }
      }
      if (sub === null) continue;
      // Hold and Slide tails share the documented +20ms release snap. The
      // previous selector rejected Slide inputs before judgeHoldTail could use
      // that extra window.
      const eligibleWindow = sub === "tail" ? good + 20 : good;
      if (Math.abs(delta) > eligibleWindow) continue;
      if (Math.abs(delta) < Math.abs(bestDelta)) {
        best = n;
        bestSub = sub;
        bestDelta = delta;
      }
    }

    if (earlySlideTarget) {
      earlySlideTarget.tailHeld = true;
      earlySlideTarget.tailReached = true;
      earlySlideTarget.tailNeedsRearm = false;
    }

    if (!best) return null; // empty press → no penalty, no combo break

    const chosen = best;
    const sub = bestSub;
    const delta = sub === "tail" ? songMs - chosen.endMs : songMs - chosen.tMs;
    const endpointJudgment: Judgment = sub === "tail"
      ? judgeHoldTail(delta, this.mode)
      : judgeDelta(delta, this.mode);

    // Slide heads arm and visually promote the trajectory, but the gesture is
    // one PRD judgment object. Defer combo, score, HP, timing and hit FX until
    // the destination lands; PlayField still supplies its normal key tick and
    // lane flash for immediate physical feedback.
    if (chosen.def.type === "slide" && sub === "head") {
      chosen.head = endpointJudgment;
      chosen.headDeltaMs = delta;
      return null;
    }

    if (chosen.def.type === "slide" && sub === "tail") {
      return this.completeSlide(chosen, lane, endpointJudgment, delta);
    }

    const resolved = { judgment: endpointJudgment, deltaMs: delta };
    const j = resolved.judgment;
    const scoreGain = this.register(
      j,
      j === "miss" ? { lane, tMs: songMs } : undefined,
      resolved.deltaMs,
    );

    if (sub === "head") {
      chosen.head = j;
      if (chosen.def.type === "tap") this.markDone(chosen);
    } else if (sub === "chord") {
      chosen.chord[lane] = j;
      chosen.chordDeltaMs[lane] = resolved.deltaMs;
      delete chosen.chordAccents[lane];
      chosen.touchChordLanes[lane] = options.touchChordAssist !== false;
      if (chosen.def.type === "chord" && chosen.def.lanes.every((l) => chosen.chord[l] != null))
        this.markDone(chosen);
    } else {
      chosen.tail = j;
      this.markDone(chosen);
    }
    return {
      lane,
      judgment: j,
      deltaMs: resolved.deltaMs,
      scoreGain,
      ...(sub === "chord" ? { chordFeedback: this.chordFeedback(chosen) } : {}),
    };
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
      const scoreGain = this.register(
        j,
        j === "miss" ? { lane, tMs: songMs } : undefined,
        delta,
        { holdTailMiss: j === "miss" },
      );
      n.tail = j;
      this.markDone(n);
      return {
        lane,
        judgment: j,
        deltaMs: delta,
        scoreGain,
        accent: j === "miss" ? "hold-release-miss" : "hold-release",
      };
    }

    for (const n of this.notes) {
      if (
        n.done
        || n.def.type !== "slide"
        || n.def.to !== lane
        || n.tail !== null
        || !n.tailHeld
      ) continue;
      n.tailHeld = false;
      n.tailNeedsRearm = false;
      const delta = songMs - n.endMs;
      // Leaving well before the completion window abandons the destination;
      // the normal timeout will turn the unfinished Slide into one Miss.
      if (delta < -(good + 20)) return null;
      const endpointJudgment = Math.abs(delta) <= good + 20
        ? judgeHoldTail(delta, this.mode)
        : "miss";
      return this.completeSlide(n, lane, endpointJudgment, delta);
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
      if (
        d.type === "slide"
        && n.head !== null
        && n.tail === null
        && n.tailHeld
        && songMs >= n.endMs
      ) {
        const fx = this.completeSlide(n, d.to, "perfect", 0);
        applied.push(fx);
        if (this.failed) return applied;
        continue;
      }
      if (d.type === "tap") {
        if (n.head === null && songMs - n.tMs > good) {
          n.head = "miss";
          this.markDone(n);
          const scoreGain = this.register("miss", { lane: d.lane, tMs: songMs });
          applied.push({ lane: d.lane, judgment: "miss", deltaMs: songMs - n.tMs, scoreGain });
          if (this.failed) return applied;
        }
      } else if (d.type === "chord") {
        for (const l of d.lanes) {
          if (n.chord[l] == null && songMs - n.tMs > good) {
            if (this.sameHandPartnerStruck(n, l)) {
              n.chord[l] = "great";
              n.chordDeltaMs[l] = songMs - n.tMs;
              n.chordAccents[l] = "chord-assist";
              const scoreGain = this.register("great");
              applied.push({
                lane: l,
                judgment: "great",
                deltaMs: songMs - n.tMs,
                scoreGain,
                accent: "chord-assist",
                chordFeedback: this.chordFeedback(n),
              });
              if (this.failed) return applied;
              continue;
            }
            n.chord[l] = "miss";
            n.chordDeltaMs[l] = songMs - n.tMs;
            delete n.chordAccents[l];
            const scoreGain = this.register("miss", { lane: l, tMs: songMs });
            applied.push({
              lane: l,
              judgment: "miss",
              deltaMs: songMs - n.tMs,
              scoreGain,
              chordFeedback: this.chordFeedback(n),
            });
            if (this.failed) return applied;
          }
        }
        if (d.lanes.every((l) => n.chord[l] != null)) this.markDone(n);
      } else if (d.type === "hold") {
        if (n.head === null && songMs - n.tMs > good) {
          n.head = "miss";
          n.tail = "miss";
          this.markDone(n);
          const scoreGain = this.register("miss", { lane: d.lane, tMs: songMs });
          this.register("miss", { lane: d.lane, tMs: songMs }, undefined, { holdTailMiss: true });
          applied.push({ lane: d.lane, judgment: "miss", deltaMs: songMs - n.tMs, scoreGain });
          if (this.failed) return applied;
        } else if (n.head !== null && n.tail === null && songMs - n.endMs > good + 20) {
          n.tail = "miss";
          this.markDone(n);
          const scoreGain = this.register(
            "miss",
            { lane: d.lane, tMs: songMs },
            undefined,
            { holdTailMiss: true },
          );
          applied.push({
            lane: d.lane,
            judgment: "miss",
            deltaMs: songMs - n.endMs,
            scoreGain,
            accent: "hold-release-miss",
          });
          if (this.failed) return applied;
        }
      } else if (d.type === "slide") {
        if (n.head === null && songMs - n.tMs > good) {
          n.head = "miss";
          this.markDone(n);
          const scoreGain = this.register("miss", { lane: d.lane, tMs: songMs });
          applied.push({ lane: d.lane, judgment: "miss", deltaMs: songMs - n.tMs, scoreGain });
          if (this.failed) return applied;
        } else if (n.head !== null && n.tail === null && songMs - n.endMs > good + 20) {
          n.tail = "miss";
          this.markDone(n);
          const scoreGain = this.register("miss", { lane: d.to, tMs: songMs });
          applied.push({
            lane: d.to,
            judgment: "miss",
            deltaMs: songMs - n.endMs,
            scoreGain,
            accent: n.tailReached ? "slide-hold-miss" : "slide-target-miss",
          });
          if (this.failed) return applied;
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
    const fullCombo = isFullCombo(this.judgments, this.totalNotes);
    const allPerfect = isAllPerfect(this.judgments, this.totalNotes);
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
      ...(this.sectionPractice ? { seekedFrom: this.startAtMs / 1000 } : {}),
      ...(this.endAtMs !== undefined ? { seekedUntil: this.endAtMs / 1000 } : {}),
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
      if (j != null && j !== "miss" && n.touchChordLanes[other]) return true;
    }
    return false;
  }

  /** Build the single player-facing verdict once every Chord lane is known. */
  private chordFeedback(n: RTNote): NonNullable<JudgeFx["chordFeedback"]> {
    const d = n.def;
    if (d.type !== "chord") return { lanes: [] };
    if (!d.lanes.every((lane) => n.chord[lane] != null)) return { lanes: d.lanes };

    let summaryLane = d.lanes[0]!;
    for (const lane of d.lanes.slice(1)) {
      const candidate = n.chord[lane]!;
      const current = n.chord[summaryLane]!;
      if (
        JUDGMENT_SEVERITY[candidate] > JUDGMENT_SEVERITY[current]
        || (
          candidate === current
          && Math.abs(n.chordDeltaMs[lane] ?? 0) > Math.abs(n.chordDeltaMs[summaryLane] ?? 0)
        )
      ) summaryLane = lane;
    }
    const accent = n.chordAccents[summaryLane];
    return {
      lanes: d.lanes,
      summary: {
        lane: summaryLane,
        judgment: n.chord[summaryLane]!,
        deltaMs: n.chordDeltaMs[summaryLane] ?? 0,
        ...(accent ? { accent } : {}),
      },
    };
  }

  private nextArmedSlideTarget(lane: number, needsRearm = false): RTNote | null {
    let target: RTNote | null = null;
    for (const note of this.notes) {
      if (
        note.done
        || note.def.type !== "slide"
        || note.def.to !== lane
        || note.head === null
        || note.tail !== null
        || (needsRearm && !note.tailNeedsRearm)
      ) continue;
      if (!target || note.endMs < target.endMs) target = note;
    }
    return target;
  }

  private completeSlide(
    note: RTNote,
    lane: number,
    endpointJudgment: Judgment,
    endpointDeltaMs: number,
  ): JudgeFx {
    const resolved = resolveSlideJudgment(
      note.head ?? "miss",
      note.headDeltaMs ?? endpointDeltaMs,
      endpointJudgment,
      endpointDeltaMs,
    );
    const scoreGain = this.register(
      resolved.judgment,
      resolved.judgment === "miss" ? { lane, tMs: note.endMs + endpointDeltaMs } : undefined,
      resolved.deltaMs,
    );
    note.tail = resolved.judgment;
    note.tailHeld = false;
    note.tailNeedsRearm = false;
    this.markDone(note);
    return {
      lane,
      judgment: resolved.judgment,
      deltaMs: resolved.deltaMs,
      scoreGain,
      ...(resolved.judgment === "miss" ? {} : { accent: "slide-complete" as const }),
    };
  }

  private register(
    j: Judgment,
    meta?: { lane: number; tMs: number },
    deltaMs?: number,
    options: { holdTailMiss?: boolean } = {},
  ): number {
    const scoreBefore = this.score;
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
      if (this.combo > 0) this.comboBreaks++;
      // Good breaks the streak, but still earns its documented 100 base points.
      // Apply it at the reset x1 multiplier; Miss remains worth zero.
      this.score += judgmentScore(j);
      this.combo = 0;
      if (this.mode === "arcade") {
        this.hp = Math.max(0, Math.min(100, this.hp + hpDelta(j, options.holdTailMiss === true)));
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
    return this.score - scoreBefore;
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
