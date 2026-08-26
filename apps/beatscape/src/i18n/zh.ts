import type { Messages } from "./types";

/** Stub locale — full UI translation deferred; emptyState proves i18n wiring. */
export const zh: Messages = {
  leaderboard: {
    title: "Local Board",
    subtitle: "This device only — no global upload in Stage 1–3.",
    emptyState: "暂无成绩——在街机模式游玩即可在本机上榜。",
    columns: {
      rank: "#",
      track: "Track",
      tier: "Tier",
      score: "Score",
      accuracy: "Acc",
      name: "Name",
    },
  },
};
