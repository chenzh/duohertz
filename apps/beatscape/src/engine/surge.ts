import type { Judgment } from "../types/chart";

/**
 * SIGNAL — the playfield atmosphere layer for high-accuracy runs (research
 * prototype, docs/BEATSCAPE-SURGE-FX.md).
 *
 * Scope guard: this is presentation state ONLY. It never feeds scoring,
 * judgment windows (15/30/50) or HP. The pure logic lives here so the meter is
 * unit-testable and the canvas layer stays a dumb consumer, mirroring judge.ts.
 *
 * Design: heat accumulates from judgment quality, decays while playing, so the
 * field's atmosphere (wash / halftone / rays / watermark wake) tracks how hot
 * the player actually is right now — not their lifetime accuracy.
 */

/** Heat thresholds that flip tier 1/2/3 (TUNING / LIVE / ON AIR). */
export const SURGE_TIERS = { t1: 25, t2: 55, t3: 85 } as const;

export type SurgeTier = 0 | 1 | 2 | 3;

/** Heat delta per judgment object. Good/miss punish harder than great rewards. */
export const SURGE_GAIN: Record<Judgment, number> = {
  perfect: 2.2,
  great: 1.2,
  good: -8,
  miss: -16,
};

/** Passive bleed while the chart plays — keeps the state honest (no idle ON AIR). */
export const SURGE_DECAY_PER_SEC = 2.2;

const HEAT_MAX = 100;

export function tierForHeat(heat: number): SurgeTier {
  if (heat >= SURGE_TIERS.t3) return 3;
  if (heat >= SURGE_TIERS.t2) return 2;
  if (heat >= SURGE_TIERS.t1) return 1;
  return 0;
}

export class SurgeMeter {
  heat = 0;
  /** Latched highest tier this run — Results/poster can read it later. */
  maxTier: SurgeTier = 0;

  apply(j: Judgment): void {
    this.heat = Math.max(0, Math.min(HEAT_MAX, this.heat + SURGE_GAIN[j]));
    const t = tierForHeat(this.heat);
    if (t > this.maxTier) this.maxTier = t;
  }

  /** Called once per playing frame with the song-clock delta (pause-safe). */
  decay(dtMs: number): void {
    if (dtMs <= 0) return;
    this.heat = Math.max(0, this.heat - SURGE_DECAY_PER_SEC * (dtMs / 1000));
  }

  tier(): SurgeTier {
    return tierForHeat(this.heat);
  }

  reset(): void {
    this.heat = 0;
    this.maxTier = 0;
  }
}

/**
 * ScoreStreak — consecutive SCORING judgments (perfect/great/good); only miss
 * resets. Survives good hits, so mid-skill players can hold the ambience too
 * (docs/BEATSCAPE-NEON-AMBIENCE.md §2). Drives the LIGHTING rig + NEON layers.
 * Gentle bleed: −1 per 0.5s once 2s pass without a scoring hit (interludes
 * dim the neon; they don't kill it).
 */
export const STREAK_TIERS = { n1: 30, n2: 70, n3: 120 } as const;

export type StreakLevel = 0 | 1 | 2 | 3;

const STREAK_IDLE_GRACE_MS = 2000;
const STREAK_BLEED_PER = 500;

export class ScoreStreak {
  count = 0;
  /** Latched highest level this run — future Results/poster hooks can read it. */
  max = 0;
  private idleMs = 0;
  private bleedAcc = 0;

  apply(j: Judgment): void {
    if (j === "miss") {
      this.count = 0;
      this.idleMs = 0;
      this.bleedAcc = 0;
      return;
    }
    this.count += 1;
    this.idleMs = 0;
    this.bleedAcc = 0;
    const lv = this.level();
    if (lv > this.max) this.max = lv;
  }

  /** Called once per playing frame with the song-clock delta (pause-safe). */
  decay(dtMs: number): void {
    if (dtMs <= 0) return;
    const prevIdle = this.idleMs;
    this.idleMs += dtMs;
    if (this.idleMs <= STREAK_IDLE_GRACE_MS) return;
    // Only the time PAST the grace window bleeds — the first 2s are free.
    this.bleedAcc += this.idleMs - Math.max(prevIdle, STREAK_IDLE_GRACE_MS);
    while (this.bleedAcc >= STREAK_BLEED_PER) {
      this.bleedAcc -= STREAK_BLEED_PER;
      if (this.count > 0) this.count -= 1;
    }
  }

  level(): StreakLevel {
    if (this.count >= STREAK_TIERS.n3) return 3;
    if (this.count >= STREAK_TIERS.n2) return 2;
    if (this.count >= STREAK_TIERS.n1) return 1;
    return 0;
  }

  reset(): void {
    this.count = 0;
    this.max = 0;
    this.idleMs = 0;
    this.bleedAcc = 0;
  }
}

/**
 * 每帧同时推进两个氛围仪表。
 *
 * 抽成独立函数不是洁癖，是为了让一类 bug 在结构上无法再犯：调用方曾经把
 * `surge.decay(dt)` 和 `streak.decay(dt)` 分开写，并在两者之间把 `lastEffMs`
 * 提前赋了值 —— 于是 streak 拿到的 delta 恒为 0，而 `decay()` 在 `dtMs <= 0`
 * 直接 return，整段 idle bleed 变成永不执行的死代码（NEON/LIGHTING 的"间奏
 * 变暗"因此从未生效过）。共用同一个 `dtMs` 参数后，两个仪表不可能再拿到不同的 delta。
 */
export function decayAtmosphere(surge: SurgeMeter, streak: ScoreStreak, dtMs: number): void {
  if (dtMs <= 0) return;
  surge.decay(dtMs);
  streak.decay(dtMs);
}
