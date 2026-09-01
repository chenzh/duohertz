// Player-name blocklist (gap doc 3-6 / PRD §6.0.24).
//
// Token-exact matching on a normalized name: separators collapse, case folds,
// diacritics strip, common leet glyphs fold to letters BEFORE tokenizing (so a
// listed variant like "b!tch" resolves to "bitch"). We deliberately do NOT
// substring-match short words — "class" would otherwise trip on "ass" (the
// Scunthorpe problem), and whitespace-splitting stays exact, so "a s s" is an
// accepted gap rather than a false positive.

import rawList from "../data/profanity-en.txt?raw";

export const BLOCKED_WORDS: string[] = rawList
  .split("\n")
  .map((line) => line.trim().toLowerCase())
  .filter((line) => line.length > 0 && !line.startsWith("#"));

/** Common leet glyphs → letters, applied per character before tokenizing. */
const LEET = /[@4$5!1037]/g;
const LEET_MAP: Record<string, string> = {
  "@": "a", "4": "a",
  $: "s", "5": "s",
  "!": "i", "1": "i",
  "3": "e",
  "0": "o",
  "7": "t",
};

export function normalizeName(raw: string): string[] {
  return (raw ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(LEET, (c) => LEET_MAP[c])
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function hasProfanity(raw: string): boolean {
  const tokens = normalizeName(raw);
  if (!tokens.length) return false;
  const tokenSet = new Set(tokens);
  return BLOCKED_WORDS.some((word) => tokenSet.has(word));
}
