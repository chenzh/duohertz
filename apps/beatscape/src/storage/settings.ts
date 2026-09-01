import { DEFAULT_KEYS, normalizeKeys } from "../input/keyMap";
import { clamp, isFiniteNum, readItem, readJSON, stringArray, writeItem, writeJSON } from "./safeStorage";

export type BsSettings = {
  hitsound: boolean;
  fancyFx: boolean;
  scrollBias: number;
  casualSpeed: number;
  musicVolume: number;
  sfxVolume: number;
  /** Touch-only: forgive a same-hand double tap when one thumb covers both lanes. */
  chordAssist: boolean;
};

const DEFAULT: BsSettings = {
  hitsound: true,
  fancyFx: true,
  scrollBias: 0,
  casualSpeed: 1,
  musicVolume: 0.7,
  sfxVolume: 0.55,
  chordAssist: true,
};

const bool = (v: unknown, d: boolean): boolean => (typeof v === "boolean" ? v : d);

/**
 * 逐字段校验后重建 settings。
 *
 * 改造前这里是 `{...DEFAULT, ...JSON.parse(raw)}`：只要 localStorage 里存过一个
 * 坏值（手改、或者旧版本留下的字段），就会原样带进来。最典型的是
 * `{"musicVolume":"x"}` → NaN，而 NaN 赋给 GainNode.gain 会让整条音乐总线彻底
 * 静音，玩家只会觉得"游戏没声音了"，完全想不到是自己的存档坏了。
 */
function coerceSettings(v: unknown): BsSettings | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  return {
    hitsound: bool(o.hitsound, DEFAULT.hitsound),
    fancyFx: bool(o.fancyFx, DEFAULT.fancyFx),
    // 范围取得比 UI 能产生的更宽：这里只想挡掉 NaN 和离谱的值，
    // 不想悄悄改掉一个用户合法设置过的数。
    scrollBias: isFiniteNum(o.scrollBias) ? clamp(o.scrollBias, -0.9, 2) : DEFAULT.scrollBias,
    casualSpeed: isFiniteNum(o.casualSpeed) ? clamp(o.casualSpeed, 0.5, 2) : DEFAULT.casualSpeed,
    musicVolume: isFiniteNum(o.musicVolume) ? clamp(o.musicVolume, 0, 1) : DEFAULT.musicVolume,
    sfxVolume: isFiniteNum(o.sfxVolume) ? clamp(o.sfxVolume, 0, 1) : DEFAULT.sfxVolume,
    chordAssist: bool(o.chordAssist, DEFAULT.chordAssist),
  };
}

export function loadSettings(): BsSettings {
  return readJSON<BsSettings>("bs_settings", { ...DEFAULT }, coerceSettings);
}

export function saveSettings(s: Partial<BsSettings>) {
  const next = { ...loadSettings(), ...s };
  writeJSON("bs_settings", next);
}

export function loadOffsetMs(): number {
  const v = readItem("bs_offset_ms");
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(-200, Math.min(200, n)) : 0;
}

export function saveOffsetMs(ms: number) {
  writeItem("bs_offset_ms", String(Math.max(-200, Math.min(200, ms))));
}

export function loadKeys(): string[] {
  const raw = readItem("bs_keys");
  if (raw) {
    try {
      return normalizeKeys(JSON.parse(raw));
    } catch {
      /* 坏数据 → 退回默认键位 */
    }
  }
  return [...DEFAULT_KEYS];
}

export function saveKeys(keys: string[]) {
  writeJSON("bs_keys", keys);
}

export function isOnboarded(): boolean {
  return readItem("bs_onboarded") === "true";
}

export function setOnboarded() {
  writeItem("bs_onboarded", "true");
}

export function loadFavorites(): string[] {
  return readJSON<string[]>("bs_favorites", [], stringArray);
}

export function toggleFavorite(trackId: string): string[] {
  const fav = loadFavorites();
  const next = fav.includes(trackId) ? fav.filter((id) => id !== trackId) : [...fav, trackId];
  writeJSON("bs_favorites", next);
  return next;
}

export type ScoreEntry = {
  track_id: string;
  tier: string;
  mode: string;
  score: number;
  accuracy: number;
  at: string;
};

function scores(v: unknown): ScoreEntry[] | null {
  if (!Array.isArray(v)) return null;
  const out: ScoreEntry[] = [];
  for (const raw of v) {
    if (typeof raw !== "object" || raw === null) continue;
    const e = raw as Record<string, unknown>;
    // 缺字段或类型不对的条目直接丢掉：存档里混进一条垃圾不该让整个排行榜白屏。
    if (typeof e.track_id !== "string" || typeof e.tier !== "string" || typeof e.mode !== "string") continue;
    if (!isFiniteNum(e.score) || !isFiniteNum(e.accuracy)) continue;
    out.push({
      track_id: e.track_id,
      tier: e.tier,
      mode: e.mode,
      score: e.score,
      accuracy: e.accuracy,
      at: typeof e.at === "string" ? e.at : new Date(0).toISOString(),
    });
  }
  return out;
}

export function loadScores(): ScoreEntry[] {
  return readJSON<ScoreEntry[]>("bs_scores", [], scores);
}

export function saveScore(entry: ScoreEntry) {
  const all = loadScores();
  const key = `${entry.track_id}|${entry.tier}|${entry.mode}`;
  const filtered = all.filter((e) => `${e.track_id}|${e.tier}|${e.mode}` !== key || e.score < entry.score);
  const existing = all.find((e) => `${e.track_id}|${e.tier}|${e.mode}` === key);
  if (existing && existing.score >= entry.score) return;
  const next = [...filtered.filter((e) => `${e.track_id}|${e.tier}|${e.mode}` !== key), entry].slice(-200);
  writeJSON("bs_scores", next);
}

export function saveDisplayName(name: string) {
  const trimmed = name.trim().slice(0, 24) || "Player";
  writeItem("bs_display_name", trimmed);
}

export function loadDisplayName(): string {
  return readItem("bs_display_name") || "Player";
}

export function getPersonalBest(trackId: string, tier: string, mode: string): ScoreEntry | null {
  const all = loadScores().filter((e) => e.track_id === trackId && e.tier === tier && e.mode === mode);
  if (!all.length) return null;
  return all.reduce((a, b) => (b.score > a.score ? b : a));
}
