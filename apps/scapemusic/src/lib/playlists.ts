// Auto-generated playlists — derived entirely from catalog metadata, no
// hand-curated lists to maintain. Vibe columns use the The Late Static radio
// programming names (World Bible §8).

import { GENRES, TRACKS, VIBES, type Track, type Vibe } from "./catalog";
import { hashSeed, mulberry32, shuffled } from "./queue";

export type PlaylistKind = "vibe" | "genre" | "district" | "tag";

export interface Playlist {
  id: string;
  kind: PlaylistKind;
  name: string;
  blurb: string;
  color?: string;
  trackIds: string[];
}

export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DISTRICT_BLURBS: Record<string, string> = {
  "Pulse Core": "The metronome block — thickest low end on the grid.",
  "Night Grid": "Rail-line rhythm, steady and eternal.",
  "Glass Rim": "Bright highs, clean and quick — echoes that show off.",
  "Afterhours Lane": "Warmest vocals and brass on the strip.",
  "Chrome Yard": "Everything here can be tuned. Everything hits.",
  "Slide District": "Slopes and bends — notes glide down the hill.",
  "Skyline Hook": "Wind through the antenna forest. Signals take off from here.",
};

const TAG_DEFS: Array<{ tag: string; id: string; name: string; blurb: string }> = [
  {
    tag: "New Release",
    id: "fresh-off-the-board",
    name: "Fresh Off the Board",
    blurb: "Newest presses from the station.",
  },
  {
    tag: "Hot Chart Style",
    id: "the-hot-board",
    name: "The Hot Board",
    blurb: "What the whole city is calling in for.",
  },
  {
    tag: "Beginner Pick",
    id: "first-frequencies",
    name: "First Frequencies",
    blurb: "Gentle on-ramps for first-time Listeners.",
  },
];

function byTag(tracks: Track[], tag: string): string[] {
  return tracks.filter((t) => t.tags.includes(tag)).map((t) => t.track_id);
}

export function buildPlaylists(tracks: Track[] = TRACKS): Playlist[] {
  const list: Playlist[] = [];

  for (const v of VIBES) {
    list.push({
      id: `col-${slug(v.column)}`,
      kind: "vibe",
      name: v.column,
      blurb: v.blurb,
      color: v.color,
      trackIds: tracks.filter((t) => t.vibe === v.id).map((t) => t.track_id),
    });
  }

  for (const def of TAG_DEFS) {
    list.push({
      id: def.id,
      kind: "tag",
      name: def.name,
      blurb: def.blurb,
      trackIds: byTag(tracks, def.tag),
    });
  }

  for (const genre of GENRES) {
    list.push({
      id: `genre-${slug(genre)}`,
      kind: "genre",
      name: `${genre} Voltage`.replace("R&B Voltage", "R&B Afterhours"),
      blurb:
        genre === "EDM"
          ? "Four to the floor, grid-powered."
          : genre === "Pop"
            ? "Hooks with the whole city behind them."
            : genre === "Hip-hop"
              ? "808s riding the rail lines."
              : genre === "Rock"
                ? "Sheet-metal guitars, yard-tuned."
                : "Smoothest voices on the strip, late.",
      trackIds: tracks.filter((t) => t.genre === genre).map((t) => t.track_id),
    });
  }

  const districts = [...new Set(tracks.map((t) => t.district))];
  for (const district of districts) {
    list.push({
      id: `district-${slug(district)}`,
      kind: "district",
      name: district,
      blurb: DISTRICT_BLURBS[district] ?? "Frequency unclear. Tune in anyway.",
      trackIds: tracks.filter((t) => t.district === district).map((t) => t.track_id),
    });
  }

  return list.filter((p) => p.trackIds.length > 0);
}

let playlistCache: Playlist[] | null = null;

export function allPlaylists(): Playlist[] {
  playlistCache ??= buildPlaylists();
  return playlistCache;
}

export function playlistById(id: string): Playlist | undefined {
  return allPlaylists().find((p) => p.id === id);
}

/**
 * Daily Mix — the feed stream. Deterministic per seed (a UTC date gives every
 * Listener the same station that day): shuffle each vibe bucket, then
 * round-robin interleave so consecutive tracks rotate vibes.
 */
export function buildDailyStream(tracks: Track[] = TRACKS, seedStr: string): string[] {
  const rand = mulberry32(hashSeed(seedStr));
  const vibes: Vibe[] = ["night-drive", "groove", "battle", "chill"];
  const buckets = vibes.map((v) =>
    shuffled(
      tracks.filter((t) => t.vibe === v).map((t) => t.track_id),
      rand,
    ),
  );
  const known = new Set(vibes);
  const out: string[] = tracks.filter((t) => !known.has(t.vibe)).map((t) => t.track_id);
  while (out.length < tracks.length) {
    for (const b of buckets) {
      const id = b.shift();
      if (id) out.push(id);
    }
  }
  if (out.length < tracks.length) {
    // Defensive: never loop forever if a vibe slipped past the guard.
    const have = new Set(out);
    for (const t of tracks) if (!have.has(t.track_id)) out.push(t.track_id);
  }
  return out;
}
