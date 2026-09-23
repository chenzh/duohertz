import { DEFAULT_KEYS, normalizeKeys, type KeyLabelLayout } from "../input/keyMap";
import { isCompatibleScoringVersion } from "../engine/scoringRules";
import { clamp, isFiniteNum, readItem, readJSON, stringArray, writeItem, writeJSON } from "./safeStorage";

export type BsSettings = {
  hitsound: boolean;
  /** Touch/controller feedback where the browser and hardware expose vibration. */
  haptics: boolean;
  fancyFx: boolean;
  /** 0 keeps the authored environment; 1 hides it behind black for maximum note contrast. */
  backgroundDim: number;
  scrollBias: number;
  musicVolume: number;
  sfxVolume: number;
  /** Touch-only: forgive a same-hand double tap when one thumb covers both lanes. */
  chordAssist: boolean;
  /**
   * 关掉非必要的镜头运动：屏震、背景霓虹与转场。
   * 系统的 prefers-reduced-motion 永远生效，这里只是让玩家自己也能关。
   */
  reduceMotion: boolean;
  /** Only affects the glyphs shown for physical keyboard bindings. */
  keyLabelLayout: KeyLabelLayout;
};

export const SETTINGS_STORAGE_KEY = "bs_settings";
export const SETTINGS_CHANGE_EVENT = "beatscape:settings-change";

const DEFAULT: BsSettings = {
  hitsound: true,
  haptics: true,
  fancyFx: true,
  backgroundDim: 0.25,
  scrollBias: 0,
  musicVolume: 0.7,
  sfxVolume: 0.55,
  chordAssist: true,
  reduceMotion: false,
  keyLabelLayout: "auto",
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
    haptics: bool(o.haptics, DEFAULT.haptics),
    fancyFx: bool(o.fancyFx, DEFAULT.fancyFx),
    backgroundDim: isFiniteNum(o.backgroundDim)
      ? clamp(o.backgroundDim, 0, 1)
      : DEFAULT.backgroundDim,
    // 旧版允许 -0.9..2，既超出当前 0.5×..2× UI，又让滑杆显示值与真实手感分叉。
    // 读取时归一到 UI 能表达的范围；旧 casualSpeed 字段会自然被忽略。
    scrollBias: isFiniteNum(o.scrollBias) ? clamp(o.scrollBias, -0.5, 1) : DEFAULT.scrollBias,
    musicVolume: isFiniteNum(o.musicVolume) ? clamp(o.musicVolume, 0, 1) : DEFAULT.musicVolume,
    sfxVolume: isFiniteNum(o.sfxVolume) ? clamp(o.sfxVolume, 0, 1) : DEFAULT.sfxVolume,
    chordAssist: bool(o.chordAssist, DEFAULT.chordAssist),
    reduceMotion: bool(o.reduceMotion, DEFAULT.reduceMotion),
    keyLabelLayout: o.keyLabelLayout === "qwerty" || o.keyLabelLayout === "azerty" || o.keyLabelLayout === "qwertz"
      ? o.keyLabelLayout
      : DEFAULT.keyLabelLayout,
  };
}

export function loadSettings(): BsSettings {
  return readJSON<BsSettings>(SETTINGS_STORAGE_KEY, { ...DEFAULT }, coerceSettings);
}

export function saveSettings(s: Partial<BsSettings>) {
  const next = { ...loadSettings(), ...s };
  const saved = writeJSON(SETTINGS_STORAGE_KEY, next);
  if (saved && typeof window !== "undefined") {
    window.dispatchEvent(new Event(SETTINGS_CHANGE_EVENT));
  }
  return saved;
}

export function loadOffsetMs(): number {
  const v = readItem("bs_offset_ms");
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(-200, Math.min(200, n)) : 0;
}

export function saveOffsetMs(ms: number) {
  if (!Number.isFinite(ms)) return false;
  return writeItem("bs_offset_ms", String(Math.max(-200, Math.min(200, ms))));
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
  return writeJSON("bs_keys", keys);
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
  scoringVersion?: number;
};

const SCORE_TIERS = new Set(["easy", "standard", "hard"]);
// Only successful full Arcade runs are ranked and written by session.ts.
// Reject legacy or hand-edited unranked-mode rows before Results/Track can read them.
const SCORE_MODES = new Set(["arcade"]);

function isScoreEntry(v: unknown): v is ScoreEntry {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  return typeof e.track_id === "string" && e.track_id.trim().length > 0 &&
    typeof e.tier === "string" && SCORE_TIERS.has(e.tier) &&
    typeof e.mode === "string" && SCORE_MODES.has(e.mode) &&
    isFiniteNum(e.score) && e.score >= 0 &&
    isFiniteNum(e.accuracy) && e.accuracy >= 0 && e.accuracy <= 100 &&
    typeof e.at === "string" && e.at.trim().length > 0 && Number.isFinite(Date.parse(e.at)) &&
    isCompatibleScoringVersion(e.track_id as string, e.tier as string, e.scoringVersion);
}

function scores(v: unknown): ScoreEntry[] | null {
  if (!Array.isArray(v)) return null;
  // PB appears directly in pre-game UI, so every visible field needs the same
  // boundary validation as leaderboard rows. Keep valid siblings when one old
  // or hand-edited row is corrupt.
  return v.filter(isScoreEntry);
}

export function loadScores(): ScoreEntry[] {
  return readJSON<ScoreEntry[]>("bs_scores", [], scores);
}

function isBetterScore(candidate: ScoreEntry, standing: ScoreEntry): boolean {
  return candidate.score > standing.score ||
    (candidate.score === standing.score && candidate.accuracy > standing.accuracy);
}

export function saveScore(entry: ScoreEntry) {
  if (!isScoreEntry(entry)) return;
  const all = loadScores();
  const key = `${entry.track_id}|${entry.tier}|${entry.mode}`;
  const existing = personalBestFor(all, entry.track_id, entry.tier, entry.mode);
  if (existing && !isBetterScore(entry, existing)) return;
  const next = [...all.filter((e) => `${e.track_id}|${e.tier}|${e.mode}` !== key), entry].slice(-200);
  writeJSON("bs_scores", next);
}

export const DISPLAY_NAME_STORAGE_KEY = "bs_display_name";
export const DISPLAY_NAME_CHANGE_EVENT = "beatscape:display-name-change";

export function saveDisplayName(name: string) {
  const trimmed = name.trim().slice(0, 24) || "Player";
  const saved = writeItem(DISPLAY_NAME_STORAGE_KEY, trimmed);
  if (saved && typeof window !== "undefined") {
    window.dispatchEvent(new Event(DISPLAY_NAME_CHANGE_EVENT));
  }
  return saved;
}

export function loadDisplayName(): string {
  return readItem(DISPLAY_NAME_STORAGE_KEY) || "Player";
}

export function getPersonalBest(trackId: string, tier: string, mode: string): ScoreEntry | null {
  return personalBestFor(loadScores(), trackId, tier, mode);
}

export function personalBestFor(
  entries: readonly ScoreEntry[],
  trackId: string,
  tier: string,
  mode: string,
): ScoreEntry | null {
  const matching = entries.filter((entry) =>
    entry.track_id === trackId && entry.tier === tier && entry.mode === mode,
  );
  if (!matching.length) return null;
  return matching.reduce((best, entry) => (isBetterScore(entry, best) ? entry : best));
}
