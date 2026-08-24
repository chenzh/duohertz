import type { ChartTier } from "./types/chart";

export type Preset = {
  id: string;
  label: string;
  mode: "game_bgm" | "game_theme_vocal";
  engine: "stable-audio-3" | "ace-step-1.5";
  bpm: number;
  duration_sec: number;
  playable: boolean;
  prompt: string;
  style_tags?: string;
  lyrics?: string;
  gradient: [string, string];
};

export const PROMPT_TAGS = [
  "clear beat",
  "160 BPM",
  "loop-friendly",
  "electronic",
  "no vocals",
  "synth lead",
  "arcade",
  "build-up",
  "4/4 kick",
  "neon",
] as const;

export const PRESETS: Preset[] = [
  {
    id: "mg-chart-main",
    label: "Chart Main",
    mode: "game_bgm",
    engine: "stable-audio-3",
    bpm: 160,
    duration_sec: 75,
    playable: true,
    prompt:
      "rhythm game chart music, clear 4/4 beat, 160 BPM, electronic dance, strong kick and snare, instrumental, no vocals, loop-friendly",
    gradient: ["#06b6d4", "#8b5cf6"],
  },
  {
    id: "mg-song-select",
    label: "Song Select",
    mode: "game_bgm",
    engine: "stable-audio-3",
    bpm: 128,
    duration_sec: 45,
    playable: false,
    prompt:
      "music game song select screen, catchy loop, upbeat electronic, neon arcade feel, instrumental, no vocals, seamless loop",
    gradient: ["#ec4899", "#6366f1"],
  },
  {
    id: "mg-climax",
    label: "Climax Drop",
    mode: "game_bgm",
    engine: "stable-audio-3",
    bpm: 170,
    duration_sec: 60,
    playable: true,
    prompt:
      "rhythm game climax section, intense build-up and drop, fast arpeggios, synth lead, 170 BPM, instrumental, no vocals",
    gradient: ["#f43f5e", "#a855f7"],
  },
  {
    id: "mg-chill",
    label: "Chill Chart",
    mode: "game_bgm",
    engine: "stable-audio-3",
    bpm: 120,
    duration_sec: 75,
    playable: true,
    prompt:
      "relaxing rhythm game chart, 120 BPM, soft synth pads, gentle beat, easy difficulty mood, instrumental, no vocals",
    gradient: ["#14b8a6", "#3b82f6"],
  },
  {
    id: "mg-hardcore",
    label: "Hardcore Chart",
    mode: "game_bgm",
    engine: "stable-audio-3",
    bpm: 180,
    duration_sec: 60,
    playable: true,
    prompt:
      "hardcore rhythm game, 180 BPM, speedcore influence, aggressive drums, complex rhythm, instrumental, no vocals",
    gradient: ["#ef4444", "#7c3aed"],
  },
  {
    id: "mg-theme-vocal",
    label: "Rhythm OP",
    mode: "game_theme_vocal",
    engine: "ace-step-1.5",
    bpm: 150,
    duration_sec: 45,
    playable: true,
    style_tags: "anime opening, j-pop, energetic female vocal, bright synth",
    lyrics: "[Verse]\n光の中で踊る\n[Chorus]\nリズムに乗せて今すぐ",
    prompt: "rhythm game opening theme, catchy hook, arcade energy",
    gradient: ["#f97316", "#db2777"],
  },
];

export const TIER_AR: Record<ChartTier, number> = {
  easy: 22,
  standard: 28,
  hard: 34,
};

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
