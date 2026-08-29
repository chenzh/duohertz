import type { CatalogTrack, TrackVibe } from "../types/catalog";

export const TRACK_VIBES: TrackVibe[] = ["night-drive", "groove", "battle", "chill"];

export const VIBE_LABELS: Record<TrackVibe, string> = {
  "night-drive": "Night Drive",
  groove: "Groove",
  battle: "Battle",
  chill: "Chill",
};

export const VIBE_HINTS: Record<TrackVibe, string> = {
  "night-drive": "Wide mix, cruising energy — in-car night scape",
  groove: "Syncopated funk & hooks — stylish urban flow",
  battle: "High tension, drops & riffs — chart showcase",
  chill: "Easy windows, smooth groove — practice friendly",
};

const VALID_VIBES = new Set<string>(TRACK_VIBES);

export function resolveTrackVibe(track: CatalogTrack): TrackVibe {
  if (track.vibe && VALID_VIBES.has(track.vibe)) {
    return track.vibe;
  }
  return inferTrackVibe(track);
}

export function inferTrackVibe(track: CatalogTrack): TrackVibe {
  const hay = `${track.title} ${track.tags.join(" ")}`.toLowerCase();
  if (hay.includes("night drive") || hay.includes("afterhours") || hay.includes("808 horizon")) {
    return "night-drive";
  }
  if (track.tags.includes("Beginner Pick") || track.tags.includes("Classic Style")) {
    if (track.genre === "R&B" || track.bpm < 100) return "chill";
  }
  if (track.tags.includes("Hot Chart Style") && (track.genre === "EDM" || track.genre === "Rock")) {
    return "battle";
  }
  if (track.genre === "Pop" || track.genre === "Hip-hop") return "groove";
  if (track.genre === "R&B") return "chill";
  return "groove";
}

export function trackHasVocals(track: CatalogTrack): boolean {
  return track.preset_id === "bs-theme-en" || track.tags.includes("With Vocals");
}

export function isBeginnerTrack(track: CatalogTrack): boolean {
  return track.tags.includes("Beginner Pick") || track.default_tier === "easy";
}
