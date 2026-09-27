import { readJSON, writeJSON } from "../storage/safeStorage";

export const DUOHERTZ_KEYMAP_STORAGE_KEY = "duohertz_keymap_v1";

export type DuohertzKeymap = { one: string; left: string; right: string };
export type DuohertzBinding = keyof DuohertzKeymap;

export const DEFAULT_DUOHERTZ_KEYMAP: Readonly<DuohertzKeymap> = {
  one: "Space", left: "KeyF", right: "KeyJ",
};

/** Only ordinary physical keys; browser shortcuts and navigation controls remain free. */
export function canBindDuohertzCode(code: string): boolean {
  return /^(?:Key[A-Z]|Digit[0-9]|Numpad[0-9]|Space|Arrow(?:Left|Right|Up|Down))$/.test(code);
}

export function validDuohertzKeymap(value: unknown): value is DuohertzKeymap {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const map = value as Record<string, unknown>;
  return typeof map.one === "string" && canBindDuohertzCode(map.one)
    && typeof map.left === "string" && canBindDuohertzCode(map.left)
    && typeof map.right === "string" && canBindDuohertzCode(map.right)
    && map.left !== map.right;
}

export function loadDuohertzKeymap(): DuohertzKeymap {
  return readJSON(DUOHERTZ_KEYMAP_STORAGE_KEY, { ...DEFAULT_DUOHERTZ_KEYMAP },
    (value) => validDuohertzKeymap(value) ? value : null);
}

export function saveDuohertzKeymap(value: DuohertzKeymap): boolean {
  return validDuohertzKeymap(value) && writeJSON(DUOHERTZ_KEYMAP_STORAGE_KEY, value);
}
