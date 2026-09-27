import type { DuohertzChart, DuohertzNote, KeyIndex } from "./chart";

export type DuohertzJudgment = "perfect" | "great" | "good" | "miss";
export type TimingProfile = { perfectMs: number; greatMs: number; goodMs: number };
export type JudgmentEvent = {
  noteId: string;
  key: KeyIndex;
  judgment: DuohertzJudgment;
  deltaMs: number | null;
  points: number;
};

type RuntimeNote = {
  def: DuohertzNote;
  resolved: [boolean, boolean];
  holdHead: { judgment: DuohertzJudgment; deltaMs: number } | null;
};

const RANK: Record<DuohertzJudgment, number> = { perfect: 0, great: 1, good: 2, miss: 3 };
const POINTS: Record<DuohertzJudgment, number> = { perfect: 3, great: 2, good: 1, miss: 0 };

export function validateTimingProfile(profile: TimingProfile): void {
  if (!Number.isFinite(profile.perfectMs) || !Number.isFinite(profile.greatMs)
    || !Number.isFinite(profile.goodMs) || profile.perfectMs <= 0
    || profile.perfectMs >= profile.greatMs || profile.greatMs >= profile.goodMs) {
    throw new Error("Timing windows must be finite, positive and increasing");
  }
}

function judge(deltaMs: number, profile: TimingProfile): DuohertzJudgment {
  const distance = Math.abs(deltaMs);
  if (distance <= profile.perfectMs) return "perfect";
  if (distance <= profile.greatMs) return "great";
  if (distance <= profile.goodMs) return "good";
  return "miss";
}

/** Pure one/two-key prototype. Audio clock and input source ownership belong to its caller. */
export class DuohertzSession {
  readonly chart: DuohertzChart;
  readonly timing: TimingProfile;
  private readonly notes: RuntimeNote[];
  private readonly held = new Map<KeyIndex, RuntimeNote>();
  private readonly events: JudgmentEvent[] = [];
  private readonly counts: Record<DuohertzJudgment, number> = { perfect: 0, great: 0, good: 0, miss: 0 };
  private points = 0;

  constructor(chart: DuohertzChart, timing: TimingProfile) {
    validateTimingProfile(timing);
    this.chart = chart;
    this.timing = timing;
    this.notes = chart.notes.map((def) => ({ def, resolved: [false, false], holdHead: null }));
  }

  private finish(note: RuntimeNote, key: KeyIndex, judgment: DuohertzJudgment, deltaMs: number | null): JudgmentEvent {
    note.resolved[key] = true;
    const event = { noteId: note.def.id, key, judgment, deltaMs, points: POINTS[judgment] };
    this.events.push(event);
    this.counts[judgment]++;
    this.points += event.points;
    return event;
  }

  /** Returns a judgment only when a Tap/Chord key is resolved; Hold resolves on release. */
  press(key: KeyIndex, songTimeMs: number): JudgmentEvent | null {
    if ((key !== 0 && key !== 1) || key >= this.chart.input_count || !Number.isFinite(songTimeMs) || this.held.has(key)) return null;
    let candidate: RuntimeNote | null = null;
    let bestDistance = Infinity;
    for (const note of this.notes) {
      const def = note.def;
      if (note.resolved[key] || (def.type === "chord" ? !def.keys.includes(key) : def.key !== key)) continue;
      if (def.type === "hold" && note.holdHead) continue;
      const distance = Math.abs(songTimeMs - def.t * 1000);
      if (distance > this.timing.goodMs || distance >= bestDistance) continue;
      candidate = note;
      bestDistance = distance;
    }
    if (!candidate) return null;
    const deltaMs = songTimeMs - candidate.def.t * 1000;
    const judgment = judge(deltaMs, this.timing);
    if (candidate.def.type === "hold") {
      candidate.holdHead = { judgment, deltaMs };
      this.held.set(key, candidate);
      return null;
    }
    return this.finish(candidate, key, judgment, deltaMs);
  }

  release(key: KeyIndex, songTimeMs: number): JudgmentEvent | null {
    if (key !== 0 && key !== 1) return null;
    const note = this.held.get(key);
    if (!note || note.def.type !== "hold" || !note.holdHead || !Number.isFinite(songTimeMs)) return null;
    this.held.delete(key);
    const tailDelta = songTimeMs - note.def.end * 1000;
    const tailJudgment = judge(tailDelta, this.timing);
    const head = note.holdHead;
    const useHead = RANK[head.judgment] > RANK[tailJudgment];
    return this.finish(note, key, useHead ? head.judgment : tailJudgment, useHead ? head.deltaMs : tailDelta);
  }

  /** Resolve overdue keys once. A held note is one object and cannot score twice. */
  tick(songTimeMs: number): JudgmentEvent[] {
    if (!Number.isFinite(songTimeMs)) return [];
    const missed: JudgmentEvent[] = [];
    for (const note of this.notes) {
      const def = note.def;
      if (def.type === "chord") {
        if (songTimeMs <= def.t * 1000 + this.timing.goodMs) continue;
        for (const key of def.keys) {
          if (!note.resolved[key]) missed.push(this.finish(note, key, "miss", null));
        }
        continue;
      }
      const key = def.key;
      if (note.resolved[key]) continue;
      const deadline = def.type === "hold" && note.holdHead ? def.end : def.t;
      if (songTimeMs <= deadline * 1000 + this.timing.goodMs) continue;
      this.held.delete(key);
      missed.push(this.finish(note, key, "miss", null));
    }
    return missed;
  }

  result() {
    const judged = this.events.length;
    return {
      complete: judged === this.chart.total_notes,
      judged,
      total: this.chart.total_notes,
      points: this.points,
      accuracy: judged === 0 ? 0 : Math.round((this.points / (judged * 3)) * 100),
      counts: { ...this.counts },
      // duohertz's default path never fails a family player for missing notes.
      failed: false,
    };
  }

  /** In Duo, each person owns one authored key and receives an independent result. */
  resultForKey(key: KeyIndex) {
    if (key >= this.chart.input_count) throw new Error("No player owns this chart key");
    const total = this.chart.notes.reduce((count, note) =>
      count + (note.type === "chord" ? 1 : Number(note.key === key)), 0);
    const events = this.events.filter((event) => event.key === key);
    const points = events.reduce((sum, event) => sum + event.points, 0);
    const counts: Record<DuohertzJudgment, number> = { perfect: 0, great: 0, good: 0, miss: 0 };
    for (const event of events) counts[event.judgment]++;
    return {
      complete: events.length === total,
      judged: events.length,
      total,
      points,
      accuracy: events.length === 0 ? 0 : Math.round((points / (events.length * 3)) * 100),
      counts,
      failed: false,
    };
  }
}
