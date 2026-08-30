/** PRD §7.5 · §6.0.10 · §6.0.11 — BeatScape design & copy tokens */

export const SCAPE_COPY = {
  tagline: "Feel the Beat. Own the Scape.",
  rights: "AI Original · Owned Rights · Generated with MusicSaas",
  rightsShort: "AI Original · Owned Rights",
  tapToEnter: "Enter the Scape",
  playNow: "Play Now",
  play: "Play",
  heroPlayKicker: "Strike Vector",
  heroPlayHintTouch: "Thumbs on the lanes — hit as notes land",
  heroPlayHintKeys: "Hit the line",
  heroPlaySoundHint: "One tap — sound on & play",
  pauseTitle: "Scape paused",
  resume: "Resume",
  calibrateTitle: "Tap with the pulse",
  calibrateHint: "Tap each lane as it flashes — sync once, then play.",
  calibrateDone: "Offset saved. You're synced to the Scape.",
  calibrateSkip: "Playing with zero offset — recalibrate anytime in Settings.",
  emptyFavorites: "No favorites yet — pin a track from the Library.",
  weakNetwork: "Loading core beat first…",
  introTitle: "First time in the Scape?",
  introBody: "Warm up with a beginner-friendly Easy · Casual run — or skip it and pick any track you like.",
  introStart: "Start the warm-up",
  introDismiss: "Explore on my own",
} as const;

// PRD §7.5 v2.0 · RESONANCE palette.
// Lane 3 stays cool on purpose: an all-warm set blurs together at high scroll
// speed — a readability requirement, not a taste call.
export const LANE_COLORS = ["#E23D3D", "#F2E4C9", "#FFB020", "#5B8DEF"] as const;

export const LANE_RGB: Array<[number, number, number]> = [
  [226, 61, 61],
  [242, 228, 201],
  [255, 176, 32],
  [91, 141, 239],
];

export const JUDGE_COLORS = {
  perfect: "#F2E4C9",
  great: "#FFB020",
  good: "#5B8DEF",
  miss: "#E23D3D",
} as const;

export const DISTRICT_COLORS: Record<string, string> = {
  "Pulse Core": "#E23D3D",
  "Glass Rim": "#E4D8C4",
  "Night Grid": "#6E2426",
  "Afterhours Lane": "#B0765A",
  "Chrome Yard": "#8C8079",
  "Slide District": "#FFB020",
  "Skyline Hook": "#5B8DEF",
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
  return DISTRICT_COLORS[district] ?? "#E23D3D";
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
