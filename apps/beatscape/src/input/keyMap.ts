// Keyboard mapping (PRD §4.1 / §4.12).
//
// Keys are stored as **physical key codes** (`KeyboardEvent.code`), not `key`.
// That matters for BeatScape because we ship to an international audience: on a
// French AZERTY or German QWERTZ board the letter printed on a physical key is
// not the letter `KeyboardEvent.key` reports, but the *position* is identical.
// Binding to `code` keeps the four lanes under the same four fingers everywhere,
// and it is also the only way to bind the arrow keys at all (`key` would be
// "ArrowLeft", which never fits the old single-character key fields).

export type KeyPresetId = "arrows" | "wasd" | "dfjk" | "custom";

export type KeyPreset = {
  id: KeyPresetId;
  label: string;
  /** Physical codes, ordered lane 1 → lane 4. */
  codes: string[];
  hint: string;
};

export const KEY_PRESETS: KeyPreset[] = [
  {
    id: "arrows",
    label: "Arrow keys",
    codes: ["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"],
    hint: "Default · the Friday Night Funkin' layout",
  },
  {
    id: "wasd",
    label: "WASD",
    codes: ["KeyA", "KeyS", "KeyW", "KeyD"],
    hint: "Game-style hand position",
  },
  {
    id: "dfjk",
    label: "D F J K",
    codes: ["KeyD", "KeyF", "KeyJ", "KeyK"],
    hint: "osu!mania / rhythm-game veterans",
  },
];

export const DEFAULT_KEYS: string[] = [...KEY_PRESETS[0]!.codes];

const PRETTY: Record<string, string> = {
  ArrowLeft: "←",
  ArrowDown: "↓",
  ArrowUp: "↑",
  ArrowRight: "→",
  Space: "Space",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  BracketLeft: "[",
  BracketRight: "]",
  Minus: "-",
  Equal: "=",
};

/**
 * Upgrade legacy single-character bindings (`["D","F","J","K"]`) to physical
 * codes. Anything we cannot confidently map is left alone and still resolves
 * through the `KeyboardEvent.key` fallback in `laneFromKeyEvent`.
 */
export function normalizeKeyToken(raw: string): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  if (/^(Key[A-Z]|Digit\d|Arrow(Up|Down|Left|Right))$/.test(t)) return t;
  if (/^[A-Z]$/.test(t)) return `Key${t}`;
  if (/^\d$/.test(t)) return `Digit${t}`;
  return t;
}

export function normalizeKeys(keys: unknown): string[] {
  if (!Array.isArray(keys)) return [...DEFAULT_KEYS];
  const next = keys.slice(0, 4).map((k) => normalizeKeyToken(String(k ?? "")));
  while (next.length < 4) next.push(DEFAULT_KEYS[next.length]!);
  return next;
}

/** Short, human-readable label for a stored code. */
export function keyLabel(code: string): string {
  if (!code) return "—";
  if (PRETTY[code]) return PRETTY[code]!;
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code;
}

export function keyLabels(keys: string[]): string[] {
  return keys.map(keyLabel);
}

/**
 * Lane index for a keyboard event, or -1 when the key is not bound.
 * Physical `code` wins; `key` is the fallback for legacy and symbolic bindings.
 */
export function laneFromKeyEvent(e: KeyboardEvent, keys: string[]): number {
  const code = e.code ?? "";
  const key = (e.key ?? "").toLowerCase();
  if (!code && !key) return -1;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (!k) continue;
    if (k === code) return i;
    if (k.toLowerCase() === key) return i;
  }
  return -1;
}

/** Which preset the current binding matches, or `custom`. */
export function presetIdFor(keys: string[]): KeyPresetId {
  for (const p of KEY_PRESETS) {
    if (p.codes.every((c, i) => keys[i] === c)) return p.id;
  }
  return "custom";
}

export function codesForPreset(id: KeyPresetId): string[] {
  const preset = KEY_PRESETS.find((p) => p.id === id);
  return preset ? [...preset.codes] : [...DEFAULT_KEYS];
}

/** True when two lanes are bound to the same key — block saving that. */
export function hasDuplicateKeys(keys: string[]): boolean {
  const seen = new Set(keys.filter(Boolean));
  return seen.size !== keys.filter(Boolean).length;
}

/**
 * Duo mode · Which preset P2 is offered, in preference order.
 *
 * WASD is first because it is the tightest cluster on the board — W sits
 * directly above A S D, all four inside one 3×2 block — and it lives under the
 * left hand, the furthest reachable spot from the arrow keys (a separate
 * island in the bottom-right corner). Two players share ONE keyboard here, so
 * physical separation is the whole point: their hands must never meet.
 *
 * The arrows are next. D F J K is deliberately last: it sprawls across the
 * home row (D F … J K, with G H gaping in the middle rather than four keys you
 * can cup with one hand), it overlaps WASD on `D`, and it lands right beside
 * the arrow cluster — the exact crowding that got it dropped from duo.
 */
const DUO_PARTNER_PRESETS: KeyPresetId[] = ["wasd", "arrows", "dfjk"];

/**
 * Duo mode · The second player's binding: the first preset above that shares
 * no key at all with P1's. Returns a fresh array — callers memoize it.
 */
export function partnerKeysFor(p1: string[]): string[] {
  const taken = new Set(p1.filter(Boolean));
  for (const id of DUO_PARTNER_PRESETS) {
    const codes = codesForPreset(id);
    if (codes.every((c) => !taken.has(c))) return codes;
  }
  // P1 is customised hard enough to squat on all three presets — it only takes
  // three well-aimed keys (say A + ← + J) to do it. Pool every preset's codes
  // and deal out four that at least don't clash: 12 candidates minus the ≤4
  // that P1 holds always leaves more than enough for a playable layout.
  const free: string[] = [];
  for (const id of DUO_PARTNER_PRESETS) {
    for (const c of codesForPreset(id)) {
      if (!taken.has(c) && !free.includes(c)) free.push(c);
    }
  }
  return free.slice(0, 4);
}

/**
 * Read a code out of a raw keydown while the user is rebinding a lane.
 * Modifier-only presses (Shift, Ctrl, …) are rejected so they can't be bound.
 */
const IGNORED_CODES = new Set(["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight", "CapsLock", "Tab"]);

export function captureKeyCode(e: KeyboardEvent): string | null {
  if (IGNORED_CODES.has(e.code)) return null;
  if (e.code) return e.code;
  const key = e.key ?? "";
  if (key.length === 1) return normalizeKeyToken(key.toUpperCase());
  return null;
}
