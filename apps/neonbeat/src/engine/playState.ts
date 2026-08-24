import type { ChartJSON, ChartNote, Judgment, PlayMode, PlayResult } from "../types/chart";
import {
  comboMultiplier,
  gradeFromAccuracy,
  hpDelta,
  judgeDelta,
  judgmentScore,
} from "./judge";

export type NoteState = {
  note: ChartNote;
  headJudged?: Judgment;
  tailJudged?: Judgment;
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
};

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
  };
}

function applyJudgment(play: LivePlay, j: Judgment, mode: PlayMode, tail = false): LivePlay {
  const next = { ...play, judgments: { ...play.judgments } };
  next.judgments[j]++;
  if (j === "miss") {
    next.combo = 0;
    next.consecutiveMiss++;
    if (mode === "arcade") next.hp = Math.max(0, next.hp + hpDelta(j, tail));
    if (mode === "practice" && next.consecutiveMiss >= 3) {
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
    if (n.lane !== lane) continue;
    if (n.type === "tap" && ns.headJudged) continue;
    if (n.type === "hold" && ns.headJudged && ns.tailJudged) continue;
    const target = n.type === "tap" ? n.t : ns.headJudged ? n.end_t : n.t;
    const delta = now - target;
    if (Math.abs(delta) < Math.abs(bestDelta)) {
      bestDelta = delta;
      bestIdx = i;
    }
  }

  if (bestIdx < 0) return next;

  const ns = next.notes[bestIdx]!;
  const n = ns.note;
  if (n.type === "hold" && ns.headJudged) {
    const j = judgeDelta(now - n.end_t, mode);
    if (j === "miss") return pushPopup(applyJudgment(next, "miss", mode, true), "miss", lane);
    const notes = [...next.notes];
    notes[bestIdx] = { ...ns, tailJudged: j };
    next = applyJudgment({ ...next, notes }, j, mode, true);
    return pushPopup(next, j, lane);
  }

  const j = judgeDelta(now - n.t, mode);
  if (j === "miss") return pushPopup(applyJudgment(next, "miss", mode), "miss", lane);
  const notes = [...next.notes];
  if (n.type === "hold") notes[bestIdx] = { ...ns, headJudged: j };
  else notes[bestIdx] = { ...ns, headJudged: j };
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
    const j = judgeDelta(now - n.end_t, mode);
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
  let next = play;
  for (let i = 0; i < next.notes.length; i++) {
    const ns = next.notes[i]!;
    const n = ns.note;
    if (ns.missed || ns.headJudged) continue;
    if (now - n.t > 80) {
      const notes = [...next.notes];
      notes[i] = { ...ns, missed: true, headJudged: "miss" };
      next = applyJudgment({ ...next, notes }, "miss", mode);
    }
  }
  for (let i = 0; i < next.notes.length; i++) {
    const ns = next.notes[i]!;
    const n = ns.note;
    if (n.type !== "hold" || !ns.headJudged || ns.tailJudged || ns.missed) continue;
    if (now - n.end_t > 80) {
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
    j !== "miss" && [25, 50, 100].includes(play.combo) ? play.combo : play.comboMilestone;
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
  const total = play.judgments.perfect + play.judgments.great + play.judgments.good + play.judgments.miss;
  const weighted =
    play.judgments.perfect * 100 +
    play.judgments.great * 70 +
    play.judgments.good * 40;
  const accuracy = total ? weighted / (total * 100) : 0;
  const fullCombo = play.judgments.miss === 0 && total > 0;
  return {
    score: play.score,
    accuracy: Math.round(accuracy * 1000) / 10,
    maxCombo: play.maxCombo,
    grade: gradeFromAccuracy(accuracy * 100),
    fullCombo,
    failed: play.failed,
    judgments: play.judgments,
  };
}

export function speedMultiplier(mode: PlayMode, casualSpeed: number, practiceSlowUntil: number): number {
  if (mode === "practice" && performance.now() < practiceSlowUntil) return 0.5;
  if (mode === "casual") return casualSpeed;
  return 1;
}

export function approachLeadMs(approachRate: number, leadMs = 1400): number {
  return leadMs / (approachRate / 24);
}

export function noteY(
  noteMs: number,
  songMs: number,
  receptorY: number,
  leadMs: number,
  approachRate: number,
): number {
  const arScale = approachRate / 24;
  const lead = leadMs / arScale;
  const delta = noteMs - songMs;
  if (delta >= 0) return receptorY - (delta / lead) * receptorY;
  return receptorY + (-delta / lead) * 28;
}
