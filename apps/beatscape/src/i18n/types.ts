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

export type Messages = {
  leaderboard: LeaderboardMessages;
};
