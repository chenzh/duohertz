const SETTINGS_KEY = "neonbeat_settings_v1";

export type Settings = {
  keys: [string, string, string, string];
  offsetMs: number;
  scrollBias: number;
  hitsounds: boolean;
  fancyFx: boolean;
  calibrationDone: boolean;
  headphoneDismissed: boolean;
};

const DEFAULT: Settings = {
  keys: ["d", "f", "j", "k"],
  offsetMs: 0,
  scrollBias: 0,
  hitsounds: true,
  fancyFx: true,
  calibrationDone: false,
  headphoneDismissed: false,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const next = { ...loadSettings(), ...patch };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function laneFromKey(key: string, keys: Settings["keys"]): number | null {
  const k = key.toLowerCase();
  const idx = keys.findIndex((x) => x.toLowerCase() === k);
  return idx >= 0 ? idx : null;
}
