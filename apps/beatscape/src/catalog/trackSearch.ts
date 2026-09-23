import type { CatalogTrack } from "../types/catalog";

type SearchableTrack = Pick<
  CatalogTrack,
  "title" | "artist" | "district" | "genre" | "bpm" | "tags"
>;

const GENRE_ALIASES: Record<string, string> = {
  edm: "electronic dance music",
  "hip hop": "hiphop",
  "r b": "rnb r and b r n b rhythm and blues",
};

/** Search words, not punctuation or Latin accent marks in catalog metadata. */
export function normalizeTrackSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function trackMatchesSearch(track: SearchableTrack, vibeLabel: string, query: string): boolean {
  const needle = normalizeTrackSearch(query);
  if (!needle) return false;
  const alias = GENRE_ALIASES[normalizeTrackSearch(track.genre)] ?? "";
  const haystack = normalizeTrackSearch(
    `${track.title} ${track.artist} ${track.district} ${track.genre} ${track.bpm} bpm ${vibeLabel} ${track.tags.join(" ")} ${alias}`,
  );
  const words = haystack.split(" ");
  const terms = needle.split(" ");
  const genreWords = new Set(normalizeTrackSearch(`${track.genre} ${alias}`).split(" "));
  const hasFacetTerm = terms.some((term) => /^\d+$/.test(term) || (term.length > 2 && genreWords.has(term)));
  // Preserve an exact title/artist phrase such as "chrome riff": splitting
  // every query would also match unrelated Riff tracks from Chrome Yard.
  // Explicit BPM/genre combinations can instead span fields in either order.
  if (!hasFacetTerm) return haystack.includes(needle);
  // BPM is a whole number, so "60 bpm" must not match a 160 BPM track.
  // Standalone letters in multiword aliases (R&B / R'n'B) need whole words.
  return terms.every((term) => {
    const exact = /^\d+$/.test(term) || (terms.length > 1 && term.length === 1);
    return words.some((word) => exact ? word === term : word.includes(term));
  });
}
