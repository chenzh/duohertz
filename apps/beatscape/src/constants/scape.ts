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

// BeatScape 角色 IP（anime + LoRA）— 7 District × 7 角色视觉身份层。
// key 与 DISTRICT_COLORS / catalog.json `district` 字段一致；art 指向 public/characters/<slug>.png。
// 设计纪律见 docs/BEATSCAPE-IP-STRATEGY.md §2：标志物=职业工具（非武器/面具/塔罗/披风/校服），
// 头后四层共振菱形（MOTIF）永远出现在"声源"位置。
export interface CharacterArt {
  code: string; // 角色代号（VOLTA…HALO）
  name: string; // 显示名
  district: string; // 对应 District
  art: string; // 头像资源路径（public/ 下）
  color: string; // District 主色
  role: string; // 职业 / 锚点
  motif: string; // 标志物描述
  trigger: string; // LoRA 触发词（生成用，网站展示不依赖）
}

export const CHARACTER_ART: Record<string, CharacterArt> = {
  "Pulse Core": {
    code: "VOLTA", name: "VOLTA", district: "Pulse Core",
    art: "/characters/pulse-core.png", color: "#E23D3D",
    role: "城市电网夜班调度员", motif: "胸口四层共振菱形徽记，静电炸开的发", trigger: "voltabs",
  },
  "Night Grid": {
    code: "STATIC", name: "STATIC", district: "Night Grid",
    art: "/characters/night-grid.png", color: "#6E2426",
    role: "深夜街区信使", motif: "兜帽、头戴耳机、斜挎信使包", trigger: "staticbs",
  },
  "Glass Rim": {
    code: "PRISM", name: "PRISM", district: "Glass Rim",
    art: "/characters/glass-rim.png", color: "#E4D8C4",
    role: "玻璃幕墙光影剪辑师", motif: "护目镜、反光刮板（工具，非武器）", trigger: "prismbs",
  },
  "Afterhours Lane": {
    code: "EMBER", name: "EMBER", district: "Afterhours Lane",
    art: "/characters/afterhours-lane.png", color: "#B0765A",
    role: "打烊后还在弹 Rhodes 的酒吧乐手", motif: "翻起的键盘盖、一杯冷掉的咖啡", trigger: "emberbs",
  },
  "Chrome Yard": {
    code: "RIVET", name: "RIVET", district: "Chrome Yard",
    art: "/characters/chrome-yard.png", color: "#8C8079",
    role: "废旧车间的吉他改装师", motif: "腰间工具带、缺一角的拨片挂坠", trigger: "rivetbs",
  },
  "Slide District": {
    code: "GLIDE", name: "GLIDE", district: "Slide District",
    art: "/characters/slide-district.png", color: "#FFB020",
    role: "天台之间滑索穿行的信使", motif: "滑索手套、飘起的长围巾", trigger: "glidebs",
  },
  "Skyline Hook": {
    code: "HALO", name: "HALO", district: "Skyline Hook",
    art: "/characters/skyline-hook.png", color: "#5B8DEF",
    role: "城市天际线观测员", motif: "肩上机械信鸽、测距仪", trigger: "halobs",
  },
};

/** 按 District 取角色视觉身份；找不到回退 VOLTA（Pulse Core）。 */
export function characterArt(district: string): CharacterArt {
  return CHARACTER_ART[district] ?? CHARACTER_ART["Pulse Core"];
}

/** 7 角色有序列表（画廊页遍历用）。 */
export const CHARACTER_LIST: CharacterArt[] = Object.values(CHARACTER_ART);

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
