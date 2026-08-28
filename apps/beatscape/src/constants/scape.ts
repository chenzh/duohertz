/** PRD §7.5 · §6.0.10 · §6.0.11 — BeatScape design & copy tokens */

export const SCAPE_COPY = {
  tagline: "Feel the Beat. Own the Scape.",
  rights: "AI Original · Owned Rights · Generated with MusicSaas",
  rightsShort: "AI Original · Owned Rights",
  tapToEnter: "Tap to enter the Scape",
  playNow: "Play Now — D F J K",
  play: "Play — D F J K",
  calibrateTitle: "Tap with the pulse",
  calibrateHint: "Press D F J K when each lane flashes — sync once, then play.",
  calibrateDone: "Offset saved. You're synced to the Scape.",
  calibrateSkip: "Playing with zero offset — recalibrate anytime in Settings.",
  emptyFavorites: "No favorites yet — pin a track from the Library.",
  weakNetwork: "Loading core beat first…",
} as const;

export const LANE_COLORS = ["#3DDCFF", "#7CFFB2", "#F5C542", "#FF5C7A"] as const;

export const LANE_RGB: Array<[number, number, number]> = [
  [61, 220, 255],
  [124, 255, 178],
  [245, 197, 66],
  [255, 92, 122],
];

export const JUDGE_COLORS = {
  perfect: "#FFD60A",
  great: "#E8EEF7",
  good: "#7CFFB2",
  miss: "#FF5C7A",
} as const;

export const DISTRICT_COLORS: Record<string, string> = {
  "Pulse Core": "#3DDCFF",
  "Glass Rim": "#A8C0D8",
  "Night Grid": "#6B5B95",
  "Afterhours Lane": "#C4A484",
  "Chrome Yard": "#9AA3AD",
  "Slide District": "#7CFFB2",
  "Skyline Hook": "#F5C542",
};

export const ARTIST_BIOS: Record<string, string> = {
  "Pulse Atlas": "Maps the city's heartbeat into pure voltage.",
  "Soft Circuit": "Soft synths on the glass edge of dawn.",
  "Low Voltage": "Slow rides through the Night Grid.",
  "Mira Lane": "Holds the note until Afterhours fades.",
  Gridline: "Overloads the Core — then drops.",
  "Iron Echo": "Chrome riffs ringing off warehouse walls.",
  "Vector Bloom": "Draws slides across district lines.",
  "Ada North": "Hooks the skyline with an English chorus.",
  "Quiet Neon": "Loops the blue hour for practice minds.",
  "Redline Co.": "Anthems for asphalt at redline speed.",
  "Neon Arc": "Voltage arcs across the Pulse Core skyline.",
  Subline: "Sub-bass grids wired for the Night Grid.",
  "Luma Rim": "Pop hooks refracted through glass horizons.",
};

export function districtColor(district: string): string {
  return DISTRICT_COLORS[district] ?? "#3DDCFF";
}

export function artistBio(artist: string): string | undefined {
  return ARTIST_BIOS[artist];
}

export const FEATURED_TRACK_IDS = ["bs-s1-01", "bs-s1-02", "bs-s1-05"] as const;

/** High-density / showcase charts for marketing clips (slide · hold · drop). */
export const SHOWCASE_TRACK_IDS = ["bs-s1-01", "bs-s1-05", "bs-s2-01", "bs-s1-04", "bs-s3-06"] as const;

export const SCAPE_COPY_EXTRA = {
  dailyChallenge: "Today's Scape Challenge",
  dailyPlay: "Play Daily Challenge",
  offsetHint: "Feeling late? Adjust offset in Settings or run a quick calibrate.",
  recalibrate: "Recalibrate timing",
  sharePoster: "Download poster",
  playerName: "Board name",
} as const;
