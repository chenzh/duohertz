import { useEffect, useMemo, useState } from "react";
import { Link } from "../router";
import { COMBO_COPY, JUDGE_COPY } from "../constants/scape";
import { useCatalog } from "../catalog/useCatalog";
import { loadShiftProgress } from "../lib/firstShift";
import { homeEntry } from "../lib/homeEntry";
import {
  ACHIEVEMENTS,
  RANKS,
  computeStats,
  loadRank,
  loadRuns,
  loadUnlockedAchievements,
  nextRankProgress,
  type AchievementId,
  type PlayStats,
  type RankProgressRequirement,
  type RankId,
  type RunRecord,
} from "../lib/progress";
import { loadDisplayName } from "../storage/settings";
import { PROFILE_PAGE_META, usePageMeta } from "../seo/pageMeta";

const DESKTOP_PROFILE_QUERY = "(min-width: 641px)";

function formatPlayTime(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function formatRankRequirement(requirement: RankProgressRequirement): string {
  const current = requirement.format === "percent"
    ? `${requirement.current.toFixed(requirement.current % 1 === 0 ? 0 : 2)}%`
    : Math.floor(requirement.current).toLocaleString();
  const target = requirement.format === "percent"
    ? `${requirement.target}%`
    : requirement.target.toLocaleString();
  return `${current} / ${target}`;
}

export function ProfilePage() {
  usePageMeta(PROFILE_PAGE_META);
  const { tracks } = useCatalog();
  const [name] = useState(loadDisplayName);
  const [stats, setStats] = useState<PlayStats | null>(null);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [rank, setRank] = useState<RankId>("echo-novice");
  const [unlocked, setUnlocked] = useState<AchievementId[]>([]);
  const [desktopProfile, setDesktopProfile] = useState(
    () => typeof window === "undefined" || window.matchMedia(DESKTOP_PROFILE_QUERY).matches,
  );
  const [rankLadderOpen, setRankLadderOpen] = useState(false);

  useEffect(() => {
    const storedRuns = loadRuns();
    setRuns(storedRuns);
    setStats(computeStats(storedRuns));
    setRank(loadRank());
    setUnlocked(loadUnlockedAchievements());
  }, []);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_PROFILE_QUERY);
    const syncLayout = () => setDesktopProfile(media.matches);
    syncLayout();
    media.addEventListener("change", syncLayout);
    return () => media.removeEventListener("change", syncLayout);
  }, []);

  const unlockedSet = new Set(unlocked);
  const rankIndex = RANKS.findIndex((r) => r.id === rank);
  const currentRank = RANKS[rankIndex] ?? RANKS[0]!;
  const nextRank = stats ? nextRankProgress(stats, currentRank.id) : null;
  const currentRankCopy = currentRank.id === "echo-novice" && stats && stats.totalRuns > 0
    ? "First run complete — keep building your signal."
    : currentRank.condition;
  const streakTitle = stats && stats.activeStreakDays > 0
    ? `${stats.activeStreakDays} ${stats.activeStreakDays === 1 ? "night" : "nights"} active`
    : "No active streak";
  const streakCopy = stats?.streakStatus === "played-today"
    ? "Today is locked in. Come back tomorrow to extend it."
    : stats?.streakStatus === "ready-today"
      ? "Finish a full run with at least one hit to keep it alive."
      : stats?.totalRuns
        ? "Your last streak ended. One full run with a hit starts a new signal."
        : "Finish one full run with a hit to start your first streak.";
  const nextRun = useMemo(
    () => stats && tracks.length > 0 ? homeEntry(tracks, loadShiftProgress(), runs) : null,
    [runs, stats, tracks],
  );
  const nextRunHref = nextRun?.href ?? "/library";
  const nextRunLabel = nextRun?.cta ?? "Choose a track";

  return (
    <section className="profile">
      <header className="page-header">
        <h1>Profile</h1>
        <p className="tagline">
          Playing as <strong>{name}</strong> — progress stays on this device.
        </p>
      </header>

      {stats && (
        <section className="profile-rank-overview" aria-labelledby="current-rank-title">
          <div className="profile-current-rank">
            <p className="eyebrow">Current rank</p>
            <h2 id="current-rank-title">{currentRank.label}</h2>
            <p>{currentRankCopy}</p>
          </div>
          <div className="profile-next-rank">
            {nextRank ? (
              <>
                <div className="profile-next-rank-head">
                  <div>
                    <p className="eyebrow">Next rank</p>
                    <h2>{nextRank.rank.label}</h2>
                  </div>
                  <span className="rank-progress-rule">
                    Complete {nextRank.rule === "any" ? "either" : "every"} goal
                  </span>
                </div>
                <div className="rank-progress-list">
                  {nextRank.requirements.map((requirement) => {
                    const value = Math.max(0, Math.min(requirement.current, requirement.target));
                    const complete = requirement.current >= requirement.target;
                    return (
                      <div className={`rank-progress-row${complete ? " complete" : ""}`} key={requirement.id}>
                        <div className="rank-progress-copy">
                          <span>{requirement.label}</span>
                          <strong>{formatRankRequirement(requirement)}{complete ? " · Done" : ""}</strong>
                        </div>
                        <progress
                          aria-label={`${requirement.label} progress`}
                          max={requirement.target}
                          value={value}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="profile-max-rank">
                <p className="eyebrow">Rank ladder complete</p>
                <h2>Top signal reached</h2>
                <p>Your rank is permanent. Keep playing for scores, streaks, and cleaner runs.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {stats && (
        <section
          className="profile-streak-card"
          aria-label="Night streak status"
          data-state={stats.streakStatus}
        >
          <div>
            <p className="eyebrow">Night streak</p>
            <h2>{streakTitle}</h2>
            <p>{streakCopy}</p>
          </div>
          {stats.streakStatus === "played-today" ? (
            <span className="profile-streak-complete"><span aria-hidden>◆</span> Today counted</span>
          ) : (
            <div className="profile-streak-action">
              <Link className="btn primary" to={nextRunHref}>
                {nextRunLabel}
              </Link>
              {nextRun && <span className="profile-next-run-meta">Next · {nextRun.sub}</span>}
            </div>
          )}
        </section>
      )}

      <section className="profile-rank-ladder-disclosure" aria-label="Rank progression">
        {!desktopProfile && (
          <div className="profile-rank-ladder-head">
            <div>
              <p className="eyebrow">Progression</p>
              <h2 className="profile-subhead">Rank ladder</h2>
            </div>
            <button
              type="button"
              className="btn ghost profile-rank-ladder-toggle"
              aria-label={`${rankLadderOpen ? "Hide" : "Show"} rank ladder`}
              aria-expanded={rankLadderOpen}
              aria-controls="profile-rank-ladder"
              onClick={() => setRankLadderOpen((open) => !open)}
            >
              {rankLadderOpen ? "Hide" : "All ranks"}
            </button>
          </div>
        )}
        <div
          id="profile-rank-ladder"
          className="rank-ladder"
          role="list"
          aria-label="Rank ladder"
          hidden={!desktopProfile && !rankLadderOpen}
        >
          {RANKS.map((r, i) => {
            const state = i < rankIndex ? "Reached" : i === rankIndex ? "Current" : "Locked";
            return (
              <div
                key={r.id}
                role="listitem"
                aria-current={i === rankIndex ? "step" : undefined}
                aria-label={`${r.label} — ${state}`}
                className={`rank-card${i === rankIndex ? " rank-current" : ""}${i < rankIndex ? " rank-reached" : ""}`}
              >
                <span className="rank-step">{i < rankIndex ? "✓" : `0${i + 1}`} · {state}</span>
                <strong>{r.label}</strong>
                <span className="rank-condition">{r.condition}</span>
              </div>
            );
          })}
        </div>
      </section>

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
            <span>Best streak</span>
            <strong>{stats.bestStreakDays}d</strong>
          </div>
          <div className="stat-pill">
            <span>Time in the Scape</span>
            <strong>{formatPlayTime(stats.totalPlayMs)}</strong>
          </div>
        </div>
      )}

      <div className="profile-achievement-head">
        <h2 className="profile-subhead">Achievements</h2>
        <span>{unlocked.length} / {ACHIEVEMENTS.length} unlocked</span>
      </div>
      <div className="achievement-grid" role="list" aria-label="Achievements">
        {ACHIEVEMENTS.map((a) => {
          const done = unlockedSet.has(a.id);
          return (
            <div
              key={a.id}
              role="listitem"
              aria-label={`${a.label} — ${done ? "Unlocked" : "Locked"}`}
              className={`achievement-card${done ? " unlocked" : ""}`}
            >
              <span className="achievement-mark" aria-hidden>
                ◆
              </span>
              <span className="achievement-status">{done ? "Unlocked" : "Locked"}</span>
              <strong>{a.label}</strong>
              <span className="achievement-condition">{a.condition}</span>
            </div>
          );
        })}
      </div>

      <div className="cta-row">
        <Link className="btn primary" to={nextRunHref}>
          {nextRunLabel}
        </Link>
        <Link className="btn ghost" to="/leaderboard">
          Local Board
        </Link>
      </div>
    </section>
  );
}
