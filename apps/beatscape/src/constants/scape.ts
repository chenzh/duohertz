/** PRD §7.5 · §6.0.10 · §6.0.11 — BeatScape design & copy tokens */
import type { CrewLine } from "../data/firstShift";

export const SCAPE_COPY = {
  tagline: "Feel the Beat. Own the Scape.",
  rights: "AI Original · Owned Rights · Generated with MusicSaas",
  rightsShort: "AI Original · Owned Rights",
  tapToEnter: "Start playing",
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

/**
 * 判定与成绩的玩家可见文案。
 *
 * 读谱时玩家不该还要推断哪个词更好，所以打歌与结算一律用 rhythm game 通用术语
 * （Perfect / Great / Good / Miss、Combo / Full Combo），底层仍是
 * 15/30/50 ms 与同一套计分。世界观命名只保留在角色对白、章节标题与场景装饰里。
 */
export const JUDGE_COPY = {
  perfect: "Perfect",
  great: "Great",
  good: "Good",
  miss: "Miss",
} as const;

export const COMBO_COPY = {
  combo: "Combo",
  maxCombo: "Max Combo",
  fullCombo: "Full Combo",
} as const;

/** SIGNAL 氛围层文案皮肤（docs/BEATSCAPE-SURGE-FX.md）：电台术语，无拟声词，符合 PRD §7.4。 */
export const SURGE_COPY = {
  gauge: "SIGNAL",
  t1: "TUNING",
  t2: "LIVE",
  t3: "ON AIR",
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

// NIGHTSHIFT: three musicians with home districts; touring districts share the radio host.
// key 与 DISTRICT_COLORS / catalog.json `district` 字段一致；art 指向 public/characters/<slug>.png。
// 设计纪律见 docs/BEATSCAPE-IP-STRATEGY.md §2：标志物=职业工具（非武器/面具/塔罗/披风/校服），
// 头后四层共振菱形（MOTIF）永远出现在"声源"位置。
export interface CharacterArt {
  code: string; // 角色代号（NIGHTSHIFT：JUNO/ATLAS/TORQUE）
  name: string; // 显示名
  district: string; // 对应 District
  art: string; // 头像资源路径（public/ 下）
  color: string; // District 主色
  role: string; // 职业 / 锚点
  motif: string; // 标志物描述
  trigger: string; // LoRA 触发词（生成用，网站展示不依赖）
  bio: string;
  dilemma: string;
  relationship: string;
  quote: string;
  recommendedTrack: {
    trackId: string;
    title: string;
    note: string;
  };
}

export const CHARACTER_ART: Record<string, CharacterArt> = {
  "Pulse Core": {
    code: "JUNO", name: "JUNO", district: "Pulse Core",
    art: "/characters/pulse-core.png", color: "#E23D3D",
    role: "Vocals · radio host · electrician",
    motif: "Radio-crew jacket, one ear on one ear off, an ON AIR badge that never dims",
    trigger: "junobs",
    bio: "Her mother left her a radio station. JUNO keeps it on air, turning callers' stories into songs so nobody's block gets forgotten.",
    dilemma: "She can find the words for everyone else. Asking the crew to play a song she needs is harder.",
    relationship: "She and ATLAS argue over every mix. She still waits for their nod before opening the mic.",
    quote: "You're tuned in. Act like it.",
    recommendedTrack: {
      trackId: "bs-s1-04",
      title: "Velvet Afterhours",
      note: "JUNO's pick for when the callers have gone home and the mic is still warm.",
    },
  },
  "Skyline Hook": {
    code: "ATLAS", name: "ATLAS", district: "Skyline Hook",
    art: "/characters/skyline-hook.png", color: "#5B8DEF",
    role: "Production · signal engineer",
    motif: "Spectrum-print coat lining, a vintage field-strength meter on a chest strap",
    trigger: "atlasbs",
    bio: "ATLAS turns closing gates and last-train announcements into drum tracks. They map the night's route by listening for trouble before anyone else hears it.",
    dilemma: "One tower sent back a tone they couldn't place. They want to understand it. They haven't told the crew everything.",
    relationship: "ATLAS and TORQUE built the rig together. Even mid-argument, one holds the cable while the other fixes it.",
    quote: "Give me a wave and I'll find its shape.",
    recommendedTrack: {
      trackId: "bs-s1-03",
      title: "Night Drive 808",
      note: "ATLAS's pick for the ride between blocks. Find the space between the kicks.",
    },
  },
  "Chrome Yard": {
    code: "TORQUE", name: "TORQUE", district: "Chrome Yard",
    art: "/characters/chrome-yard.png", color: "#8C8079",
    role: "Drums & bass · yard mechanic",
    motif: "Wrench drumsticks, a chrome gong cut from a hubcap",
    trigger: "torquebs",
    bio: "TORQUE made the band's gong from a hubcap. He wants every gig to feel like somebody saved you a place, even if you're the only person there.",
    dilemma: "He can fill a yard with sound. Leaving enough room for someone else's quiet song takes practice.",
    relationship: "When JUNO gets stuck on a lyric, he gets her laughing. When you miss a beat, he's the first to count you back in.",
    quote: "Loud is a love language.",
    recommendedTrack: {
      trackId: "bs-s1-02",
      title: "Glass Horizon",
      note: "TORQUE's first lesson: start easy, find your feet. No gig is too small.",
    },
  },
};

/** 按 District 取角色视觉身份。巡演救援区（Night Grid / Glass Rim / Afterhours Lane / Slide District）无驻场乐手，由电台代播——回退 JUNO（Pulse Core）。 */
export function characterArt(district: string): CharacterArt {
  return CHARACTER_ART[district] ?? CHARACTER_ART["Pulse Core"];
}

/**
 * 角色头像的 WebP 变体路径。原图是 640–832px 的 PNG（单张 ~1 MB），
 * 实际只渲染进 52–240px 的框，PNG 在传输层已无压缩空间（gzip 反而更大）。
 * 预生成了 128w / 512w 两档 WebP（见 public/characters/*.webp），这里拼出对应路径。
 * `variant` 默认 512w，配合 <img srcset> 由浏览器按显示尺寸挑选。
 */
export function characterArtWebp(district: string, variant: 128 | 512 = 512): string {
  const art = characterArt(district).art.replace(/^\//, "").replace(/\.(png|webp)$/i, "");
  return `${art}-${variant}.webp`;
}

/** NIGHTSHIFT 三人有序列表（画廊页遍历用）。 */
export const CHARACTER_LIST: CharacterArt[] = Object.values(CHARACTER_ART);

export const FEATURED_TRACK_IDS = ["bs-s1-01", "bs-s1-02", "bs-s1-05"] as const;

/** High-density / showcase charts for marketing clips (slide · hold · drop). */
export const SHOWCASE_TRACK_IDS = ["bs-s1-01", "bs-s1-05", "bs-s2-01", "bs-s1-04", "bs-s3-06"] as const;

/**
 * 首页入口文案。
 *
 * 首页不是"介绍游戏"，而是第一局的入口：标题一句话说清这是什么，
 * 下面只跟一条角色台词和一个绑定了确定曲目的主按钮。
 * First Shift 作为辅助说明留在下面，不再要求新人先理解世界再玩。
 */
export const HOME_COPY = {
  kicker: "4-lane rhythm game · keyboard or touch",
  title: "KEEP THE CITY LOUD.",
  subtitle: "A browser rhythm game set around a late-night radio station.",
  browse: "Browse all tracks",
  crew: { speaker: "JUNO", text: "Our studio link's down. Let's start with this track." } as CrewLine,
} as const;

export const SCAPE_COPY_EXTRA = {
  dailyChallenge: "Today's Scape Challenge",
  dailyPlay: "Play Daily Challenge",
  offsetHint: "Feeling late? Adjust offset in Settings or run a quick calibrate.",
  recalibrate: "Recalibrate timing",
  sharePoster: "Download poster",
  playerName: "Board name",
} as const;
