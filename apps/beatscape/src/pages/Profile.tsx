import { useEffect, useState } from "react";
import { Link } from "../router";
import { COMBO_COPY, JUDGE_COPY } from "../constants/scape";
import {
  ACHIEVEMENTS,
  RANKS,
  computeStats,
  loadRank,
  loadRuns,
  loadUnlockedAchievements,
  type AchievementId,
  type PlayStats,
  type RankId,
} from "../lib/progress";
import { loadDisplayName } from "../storage/settings";
import { PROFILE_PAGE_META, usePageMeta } from "../seo/pageMeta";

function formatPlayTime(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function ProfilePage() {
  usePageMeta(PROFILE_PAGE_META);
  const [name] = useState(loadDisplayName);
  const [stats, setStats] = useState<PlayStats | null>(null);
  const [rank, setRank] = useState<RankId>("echo-novice");
  const [unlocked, setUnlocked] = useState<AchievementId[]>([]);

  useEffect(() => {
    const runs = loadRuns();
    setStats(computeStats(runs));
    setRank(loadRank());
    setUnlocked(loadUnlockedAchievements());
  }, []);

  const unlockedSet = new Set(unlocked);
  const rankIndex = RANKS.findIndex((r) => r.id === rank);

  return (
    <section className="profile">
      <header className="page-header">
        <h1>Profile</h1>
        <p className="tagline">
          Playing as <strong>{name}</strong> — progress stays on this device.
        </p>
      </header>

      <div className="rank-ladder">
        {RANKS.map((r, i) => (
          <div
            key={r.id}
            className={`rank-card${i === rankIndex ? " rank-current" : ""}${i < rankIndex ? " rank-reached" : ""}`}
          >
            <span className="rank-step">{i < rankIndex ? "✓" : `0${i + 1}`}</span>
            <strong>{r.label}</strong>
            <span className="rank-condition">{r.condition}</span>
          </div>
        ))}
      </div>

      {stats && (
        <div className="profile-stats">
          <div className="stat-pill">
            <span>Runs</span>
            <strong>{stats.totalRuns}</strong>
          </div>
          <div className="stat-pill">
            <span>Clears</span>
            <strong>{stats.totalClears}</strong>
          </div>
          <div className="stat-pill">
            <span>{COMBO_COPY.fullCombo}s</span>
            <strong>{stats.fcCount}</strong>
          </div>
          <div className="stat-pill">
            <span>All {JUDGE_COPY.perfect}</span>
            <strong>{stats.apCount}</strong>
          </div>
          <div className="stat-pill">
            <span>Hard clears</span>
            <strong>{stats.hardClears}</strong>
          </div>
          <div className="stat-pill">
            <span>Best combo</span>
            <strong>{stats.bestMaxCombo}×</strong>
          </div>
          <div className="stat-pill">
            <span>Recent arcade acc</span>
            <strong>{stats.recentArcadeAccuracy.toFixed(2)}%</strong>
          </div>
          <div className="stat-pill">
            <span>Districts</span>
            <strong>{stats.districtsPlayed}/7</strong>
          </div>
          <div className="stat-pill">
            <span>Tracks tried</span>
            <strong>{stats.uniqueTracks}</strong>
          </div>
          <div className="stat-pill">
            <span>Night streak</span>
            <strong>{stats.bestStreakDays}d</strong>
          </div>
          <div className="stat-pill">
            <span>Time in the Scape</span>
            <strong>{formatPlayTime(stats.totalPlayMs)}</strong>
          </div>
        </div>
      )}

      <h2 className="profile-subhead">Achievements</h2>
      <div className="achievement-grid">
        {ACHIEVEMENTS.map((a) => {
          const done = unlockedSet.has(a.id);
          return (
            <div key={a.id} className={`achievement-card${done ? " unlocked" : ""}`}>
              <span className="achievement-mark" aria-hidden>
                ◆
              </span>
              <strong>{a.label}</strong>
              <span className="achievement-condition">{a.condition}</span>
            </div>
          );
        })}
      </div>

      <div className="cta-row">
        <Link className="btn primary" to="/library">
          Play something
        </Link>
        <Link className="btn ghost" to="/leaderboard">
          Local Board
        </Link>
      </div>
    </section>
  );
}
