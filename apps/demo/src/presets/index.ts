import type { Mode } from "../api";

export type Scene = "game" | "vocal";

export type Preset = {
  id: string;
  scene: Scene;
  mode: Mode;
  labelZh: string;
  labelEn: string;
  prompt?: string;
  style_tags?: string;
  lyrics?: string;
  duration_sec: number;
};

export const PRESETS: Preset[] = [
  {
    id: "bgm-dungeon",
    scene: "game",
    mode: "game_bgm",
    labelZh: "暗黑地牢",
    labelEn: "Dark Dungeon",
    prompt: "dark dungeon ambient, tense, no vocals, instrumental",
    duration_sec: 60,
  },
  {
    id: "bgm-explore",
    scene: "game",
    mode: "game_bgm",
    labelZh: "草原探索",
    labelEn: "Open World",
    prompt: "open world exploration, peaceful, orchestral, no vocals",
    duration_sec: 90,
  },
  {
    id: "bgm-boss",
    scene: "game",
    mode: "game_bgm",
    labelZh: "Boss 战",
    labelEn: "Boss Battle",
    prompt: "epic boss battle, intense drums, no vocals",
    duration_sec: 45,
  },
  {
    id: "vocal-jpop",
    scene: "vocal",
    mode: "vocal_lyrics",
    labelZh: "日系抒情",
    labelEn: "J-Pop Ballad",
    style_tags: "j-pop, female vocal, emotional, bright",
    lyrics: "[Verse]\n星が降る夜に\n君の声を聴いた\n[Chorus]\nHello from the stars tonight",
    duration_sec: 30,
  },
  {
    id: "vocal-rap",
    scene: "vocal",
    mode: "vocal_desc",
    labelZh: "说唱描述",
    labelEn: "Hip-Hop Desc",
    prompt: "hip-hop, male vocal, city night, energetic beat",
    duration_sec: 30,
  },
  {
    id: "vocal-theme",
    scene: "vocal",
    mode: "game_theme_vocal",
    labelZh: "游戏主题曲",
    labelEn: "Game Theme",
    style_tags: "epic orchestral, choir, cinematic",
    lyrics: "[Chorus]\n勇者の剣を掲げて\n勝利への道を行く",
    prompt: "final boss theme, heroic",
    duration_sec: 45,
  },
];

export const SAMPLES = [
  {
    id: "sample-vocal",
    labelZh: "人声样例",
    labelEn: "Vocal Sample",
    engine: "ACE-Step 1.5",
    url: "/demo/samples/vocal-demo.wav",
  },
  {
    id: "sample-bgm",
    labelZh: "BGM 样例",
    labelEn: "BGM Sample",
    engine: "Stable Audio 3",
    url: "/demo/samples/bgm-demo.wav",
  },
] as const;
