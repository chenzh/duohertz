export type BsSettings = {
  hitsound: boolean;
  fancyFx: boolean;
  scrollBias: number;
  casualSpeed: number;
  musicVolume: number;
  sfxVolume: number;
};

const DEFAULT: BsSettings = {
  hitsound: true,
  fancyFx: true,
  scrollBias: 0,
  casualSpeed: 1,
  musicVolume: 0.7,
  sfxVolume: 0.55,
};

export function loadSettings(): BsSettings {
  try {
    const raw = localStorage.getItem("bs_settings");
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveSettings(s: Partial<BsSettings>) {
  const next = { ...loadSettings(), ...s };
  localStorage.setItem("bs_settings", JSON.stringify(next));
}

export function loadOffsetMs(): number {
  const v = localStorage.getItem("bs_offset_ms");
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(-200, Math.min(200, n)) : 0;
}

export function saveOffsetMs(ms: number) {
  localStorage.setItem("bs_offset_ms", String(Math.max(-200, Math.min(200, ms))));
}

export function loadKeys(): string[] {
  try {
    const raw = localStorage.getItem("bs_keys");
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return ["D", "F", "J", "K"];
}

export function saveKeys(keys: string[]) {
  localStorage.setItem("bs_keys", JSON.stringify(keys));
}

export function isOnboarded(): boolean {
  return localStorage.getItem("bs_onboarded") === "true";
}

export function setOnboarded() {
  localStorage.setItem("bs_onboarded", "true");
}

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem("bs_favorites");
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

export function toggleFavorite(trackId: string): string[] {
  const fav = loadFavorites();
  const next = fav.includes(trackId) ? fav.filter((id) => id !== trackId) : [...fav, trackId];
  localStorage.setItem("bs_favorites", JSON.stringify(next));
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

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem("bs_scores");
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

export function saveScore(entry: ScoreEntry) {
  const all = loadScores();
  const key = `${entry.track_id}|${entry.tier}|${entry.mode}`;
  const filtered = all.filter((e) => `${e.track_id}|${e.tier}|${e.mode}` !== key || e.score < entry.score);
  const existing = all.find((e) => `${e.track_id}|${e.tier}|${e.mode}` === key);
  if (existing && existing.score >= entry.score) return;
  const next = [...filtered.filter((e) => `${e.track_id}|${e.tier}|${e.mode}` !== key), entry].slice(-200);
  localStorage.setItem("bs_scores", JSON.stringify(next));
}

export function saveDisplayName(name: string) {
  const trimmed = name.trim().slice(0, 24) || "Player";
  localStorage.setItem("bs_display_name", trimmed);
}

export function loadDisplayName(): string {
  return localStorage.getItem("bs_display_name") || "Player";
}

export function getPersonalBest(trackId: string, tier: string, mode: string): ScoreEntry | null {
  const all = loadScores().filter((e) => e.track_id === trackId && e.tier === tier && e.mode === mode);
  if (!all.length) return null;
  return all.reduce((a, b) => (b.score > a.score ? b : a));
}
