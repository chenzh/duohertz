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
} from "./judge";

export type NoteState = {
  note: ChartNote;
  headJudged?: Judgment;
  tailJudged?: Judgment;
  /** chord: per-lane head judgment */
  chordLanes?: Partial<Record<0 | 1 | 2 | 3, Judgment>>;
  missed?: boolean;
};

export type LivePlay = {
  notes: NoteState[];
  combo: number;
  maxCombo: number;
  score: number;
  hp: number;
  judgments: Record<Judgment, number>;
  failed: boolean;
  finished: boolean;
  popups: Array<{ id: number; text: string; lane: number; at: number; judgment: Judgment }>;
  popupId: number;
  practiceSlowUntil: number;
  consecutiveMiss: number;
  lastFx?: { lane: number; judgment: Judgment; at: number };
  comboMilestone?: number;
  totalNotes: number;
};

export function countTotalNotes(notes: ChartNote[]): number {
  let n = 0;
  for (const note of notes) {
    if (note.type === "tap" || note.type === "slide") n += 1;
    else if (note.type === "hold") n += 2;
    else if (note.type === "chord") n += note.lanes.length;
  }
  return n;
}

export function initPlay(chart: ChartJSON, _mode: PlayMode): LivePlay {
  return {
    notes: chart.notes.map((note) => ({ note })),
    combo: 0,
    maxCombo: 0,
    score: 0,
    hp: 100,
    judgments: { perfect: 0, great: 0, good: 0, miss: 0 },
    failed: false,
    finished: false,
    popups: [],
    popupId: 0,
    practiceSlowUntil: 0,
    consecutiveMiss: 0,
    totalNotes: chart.total_notes || countTotalNotes(chart.notes),
  };
}

function breaksCombo(j: Judgment): boolean {
  return j === "miss" || j === "good";
}

function applyJudgment(play: LivePlay, j: Judgment, mode: PlayMode, tail = false): LivePlay {
  const next = { ...play, judgments: { ...play.judgments } };
  next.judgments[j]++;
  if (breaksCombo(j)) {
    next.combo = 0;
    if (j === "miss") next.consecutiveMiss++;
    if (mode === "arcade") next.hp = Math.max(0, next.hp + hpDelta(j, tail));
    if (mode === "practice" && j === "miss" && next.consecutiveMiss >= 3) {
      next.practiceSlowUntil = performance.now() + 5000;
      next.consecutiveMiss = 0;
    }
    if (mode === "arcade" && next.hp <= 0) next.failed = true;
    return next;
  }
  next.consecutiveMiss = 0;
  next.combo++;
  next.maxCombo = Math.max(next.maxCombo, next.combo);
  const mult = comboMultiplier(next.combo);
  next.score += judgmentScore(j) * mult;
  if (mode === "arcade") next.hp = Math.min(100, next.hp + hpDelta(j, tail));
  return next;
}

function noteLane(note: ChartNote): number | null {
  if (note.type === "chord") return null;
  return note.lane;
}

function chordDone(ns: NoteState): boolean {
  if (ns.note.type !== "chord") return false;
  const lanes = ns.note.lanes;
  const judged = ns.chordLanes ?? {};
  return lanes.every((l) => judged[l] != null);
}

export function pressLane(
  play: LivePlay,
  _chart: ChartJSON,
  lane: 0 | 1 | 2 | 3,
  songMs: number,
  offsetMs: number,
  mode: PlayMode,
): LivePlay {
  if (play.failed || play.finished) return play;
  const now = songMs - offsetMs;
  let next = play;
  let bestIdx = -1;
  let bestDelta = Infinity;

  for (let i = 0; i < next.notes.length; i++) {
    const ns = next.notes[i]!;
    const n = ns.note;
    if (n.type === "chord") {
      if (!n.lanes.includes(lane) || ns.chordLanes?.[lane]) continue;
      const delta = now - n.t;
      if (Math.abs(delta) < Math.abs(bestDelta)) {
        bestDelta = delta;
        bestIdx = i;
      }
      continue;
    }
    if (noteLane(n) !== lane) continue;
    if (n.type === "tap" && ns.headJudged) continue;
    if (n.type === "hold" && ns.headJudged && ns.tailJudged) continue;
    const target = n.type === "tap" ? n.t : ns.headJudged ? n.end : n.t;
    const delta = now - target;
    if (Math.abs(delta) < Math.abs(bestDelta)) {
      bestDelta = delta;
      bestIdx = i;
    }
  }

  if (bestIdx < 0) return next;

  const ns = next.notes[bestIdx]!;
  const n = ns.note;

  if (n.type === "chord") {
    const j = judgeDelta(now - n.t, mode);
    const notes = [...next.notes];
    const lanes = { ...(ns.chordLanes ?? {}), [lane]: j === "miss" ? "miss" : j };
    notes[bestIdx] = { ...ns, chordLanes: lanes };
    next = applyJudgment({ ...next, notes }, j, mode);
    return pushPopup(next, j, lane);
  }

  if (n.type === "hold" && ns.headJudged) {
    const j = judgeHoldTail(now - n.end, mode);
    if (j === "miss") return pushPopup(applyJudgment(next, "miss", mode, true), "miss", lane);
    const notes = [...next.notes];
    notes[bestIdx] = { ...ns, tailJudged: j };
    next = applyJudgment({ ...next, notes }, j, mode, true);
    return pushPopup(next, j, lane);
  }

  const j = judgeDelta(now - n.t, mode);
  if (j === "miss") return pushPopup(applyJudgment(next, "miss", mode), "miss", lane);
  const notes = [...next.notes];
  notes[bestIdx] = { ...ns, headJudged: j };
  next = applyJudgment({ ...next, notes }, j, mode);
  return pushPopup(next, j, lane);
}

export function releaseLane(
  play: LivePlay,
  lane: number,
  songMs: number,
  offsetMs: number,
  mode: PlayMode,
): LivePlay {
  const now = songMs - offsetMs;
  let next = play;
  for (let i = 0; i < next.notes.length; i++) {
    const ns = next.notes[i]!;
    const n = ns.note;
    if (n.type !== "hold" || n.lane !== lane) continue;
    if (!ns.headJudged || ns.tailJudged) continue;
    const j = judgeHoldTail(now - n.end, mode);
    const notes = [...next.notes];
    notes[i] = { ...ns, tailJudged: j === "miss" ? "miss" : j };
    next = applyJudgment({ ...next, notes }, j === "miss" ? "miss" : j, mode, j === "miss");
    return pushPopup(next, j === "miss" ? "miss" : j, lane);
  }
  return next;
}

export function tickMisses(
  play: LivePlay,
  songMs: number,
  offsetMs: number,
  mode: PlayMode,
): LivePlay {
  if (play.failed || play.finished) return play;
  const now = songMs - offsetMs;
  const missAfter = goodWindowMs(mode);
  let next = play;

  for (let i = 0; i < next.notes.length; i++) {
    const ns = next.notes[i]!;
    const n = ns.note;
    if (n.type === "chord") {
      const lanes = n.lanes;
      const judged = ns.chordLanes ?? {};
      if (chordDone(ns) || ns.missed) continue;
      if (now - n.t > missAfter) {
        const notes = [...next.notes];
        const full: Partial<Record<0 | 1 | 2 | 3, Judgment>> = { ...judged };
        for (const l of lanes) {
          if (!full[l]) {
            full[l] = "miss";
            next = applyJudgment(next, "miss", mode);
          }
        }
        notes[i] = { ...ns, chordLanes: full, missed: true };
        next = { ...next, notes };
      }
      continue;
    }
    if (ns.missed || ns.headJudged) continue;
    if (now - n.t > missAfter) {
      const notes = [...next.notes];
      notes[i] = { ...ns, missed: true, headJudged: "miss" };
      next = applyJudgment({ ...next, notes }, "miss", mode);
    }
  }

  for (let i = 0; i < next.notes.length; i++) {
    const ns = next.notes[i]!;
    const n = ns.note;
    if (n.type !== "hold" || !ns.headJudged || ns.tailJudged || ns.missed) continue;
    if (now - n.end > missAfter + 20) {
      const notes = [...next.notes];
      notes[i] = { ...ns, tailJudged: "miss", missed: true };
      next = applyJudgment({ ...next, notes }, "miss", mode, true);
    }
  }
  return next;
}

function pushPopup(play: LivePlay, j: Judgment, lane: number): LivePlay {
  const text = j === "miss" ? "MISS" : j.toUpperCase();
  const milestone =
    !breaksCombo(j) && [25, 50, 100].includes(play.combo) ? play.combo : play.comboMilestone;
  return {
    ...play,
    popupId: play.popupId + 1,
    lastFx: { lane, judgment: j, at: performance.now() },
    comboMilestone: milestone,
    popups: [
      ...play.popups.slice(-8),
      { id: play.popupId + 1, text, lane, at: performance.now(), judgment: j },
    ],
  };
}

export function finalize(play: LivePlay): PlayResult {
  const accuracy = accuracyPercent(play.judgments, play.totalNotes);
  const fullCombo = play.judgments.miss === 0 && play.totalNotes > 0;
  const allPerfect =
    play.judgments.perfect === play.totalNotes && play.totalNotes > 0 && play.judgments.miss === 0;
  return {
    score: play.score,
    accuracy,
    maxCombo: play.maxCombo,
    grade: gradeFromAccuracy(accuracy),
    fullCombo,
    allPerfect,
    failed: play.failed,
    judgments: play.judgments,
    totalNotes: play.totalNotes,
  };
}

/** Visual scroll only for Casual — audio stays 1.0× per PRD */
export function visualScrollBias(mode: PlayMode, casualSpeed: number): number {
  if (mode === "casual") return casualSpeed;
  return 1;
}

export function audioRate(mode: PlayMode, practiceSlowUntil: number): number {
  if (mode === "practice" && performance.now() < practiceSlowUntil) return 0.5;
  return 1;
}

export function approachLeadMs(ar: number, leadMs = 1400): number {
  return leadMs / (ar / 24);
}

/** Extra lead + lower visual AR for Easy / Casual readability */
export function approachLeadFor(chart: ChartJSON, mode: PlayMode, baseLead = 1400): number {
  let lead = baseLead;
  if (chart.tier === "easy") lead *= 1.45;
  if (chart.tier === "standard") lead *= 1.15;
  if (mode === "casual") lead *= 1.25;
  if (mode === "practice") lead *= 1.1;
  return lead;
}

export function visualArFor(chart: ChartJSON, mode: PlayMode): number {
  let ar = chart.ar;
  if (chart.tier === "easy") ar = Math.min(ar, 20);
  if (chart.tier === "standard") ar = Math.min(ar, 26);
  if (mode === "casual") ar = Math.max(14, ar - 2);
  return ar;
}

export function noteY(
  noteMs: number,
  songMs: number,
  receptorY: number,
  leadMs: number,
  ar: number,
  scrollBias = 1,
): number {
  const arScale = (ar / 24) * scrollBias;
  const lead = leadMs / arScale;
  const delta = noteMs - songMs;
  if (delta >= 0) return receptorY - (delta / lead) * receptorY;
  return receptorY + (-delta / lead) * 28;
}

export function noteTime(note: ChartNote): number {
  return note.t;
}

export function noteEndTime(note: ChartNote): number | null {
  if (note.type === "hold") return note.end;
  if (note.type === "slide") return note.end;
  return null;
}

export function noteLanes(note: ChartNote): Array<0 | 1 | 2 | 3> {
  if (note.type === "chord") return note.lanes;
  return [note.lane];
}
