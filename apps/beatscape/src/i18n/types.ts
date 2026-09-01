export type LeaderboardMessages = {
  title: string;
  subtitle: string;
  emptyState: string;
  columns: {
    rank: string;
    track: string;
    tier: string;
    score: string;
    accuracy: string;
    name: string;
  };
};

/**
 * 高频 UI 文案。新增字符串必须同时写进 en.ts / zh.ts，否则 i18n.test.ts 的
 * 递归 key-parity 断言会失败（CI 守门，防止只加英文漏翻中文）。
 */
export type UiMessages = {
  // Home
  playNow: string;
  browseTracks: string;
  calibrate: string;
  meetNightshift: string;
  featuredInScape: string;
  seeAll: string;
  exploreCity: string;
  dailyChallenge: string;
  dailyPlay: string;
  // Library / Track
  library: string;
  preview: string;
  tier: string;
  mode: string;
  favorite: string;
  favorited: string;
  // Play
  tapToEnter: string;
  pause: string;
  resume: string;
  cueingAudio: string;
  signalLost: string;
  play: string;
  // Results / share
  loading: string;
  copyLink: string;
  downloadPoster: string;
  shareRun: string;
  newHonor: string;
  copyFailed: string;
  // Settings / nav
  settings: string;
  profile: string;
  audio: string;
  gameplay: string;
  keyMap: string;
};

export type Messages = {
  leaderboard: LeaderboardMessages;
  ui: UiMessages;
};
