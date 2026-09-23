import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "../router";
import { loadCatalog } from "../catalog/loadCatalog";
import { loadBoard, loadDailyBoard, type BoardEntry } from "../storage/session";
import {
  dailyPlayHref,
  getDailyChallenge,
  summarizeDailyChallenge,
  type DailyChallenge,
} from "../lib/dailyChallenge";
import { loadDisplayName } from "../storage/settings";
import {
  DAILY_LEADERBOARD_PAGE_META,
  LEADERBOARD_PAGE_META,
  usePageMeta,
} from "../seo/pageMeta";
import { playHref } from "../lib/playHref";
import { useUtcDailyClock } from "../lib/useUtcDailyClock";

function trackLabel(entry: BoardEntry, titles: Record<string, string>): string {
  return entry.title || titles[entry.track_id] || entry.track_id;
}

export function LeaderboardPage() {
  const [params, setSearch] = useSearchParams();
  const requestedTab = params.get("view") === "daily" ? "daily" : "local";
  const [tab, setTab] = useState<"local" | "daily">(requestedTab);
  const dailyClock = useUtcDailyClock();
  usePageMeta(tab === "daily" ? DAILY_LEADERBOARD_PAGE_META : LEADERBOARD_PAGE_META);
  const tabRefs = useRef<Record<"local" | "daily", HTMLButtonElement | null>>({ local: null, daily: null });
  const board = loadBoard();
  const storedDailyBoard = loadDailyBoard(dailyClock.dateKey);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [dailyAction, setDailyAction] = useState<{
    href: string;
    title: string;
    challenge: DailyChallenge;
  } | null>(null);

  useEffect(() => {
    setTab(requestedTab);
  }, [requestedTab]);

  useEffect(() => {
    let cancelled = false;
    loadCatalog()
      .then((cat) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const t of cat.tracks) map[t.track_id] = t.title;
        setTitles(map);
        const challenge = getDailyChallenge(cat.tracks.map((track) => track.track_id), dailyClock.dateKey);
        const challengeTrack = challenge ? cat.tracks.find((track) => track.track_id === challenge.trackId) : null;
        setDailyAction(challenge && challengeTrack
          ? { href: dailyPlayHref(challenge), title: challengeTrack.title, challenge }
          : null);
      })
      .catch(() => {
        /* keep track_id fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [dailyClock.dateKey]);

  // Never expose yesterday's route during the brief catalog refresh at UTC rollover.
  const currentDailyAction = dailyAction?.challenge.dateKey === dailyClock.dateKey
    ? dailyAction
    : null;
  const dailyProgress = currentDailyAction
    ? summarizeDailyChallenge(currentDailyAction.challenge, storedDailyBoard)
    : null;
  const rows = tab === "daily" ? dailyProgress?.entries ?? [] : board;
  const playerName = loadDisplayName();
  const selectTab = (next: "local" | "daily", focus = false) => {
    setTab(next);
    const nextParams = new URLSearchParams(params);
    if (next === "daily") nextParams.set("view", "daily");
    else nextParams.delete("view");
    setSearch(nextParams);
    if (focus) requestAnimationFrame(() => tabRefs.current[next]?.focus());
  };

  return (
    <section className="leaderboard">
      <header className="page-header">
        <h1>{tab === "daily" ? "Daily Challenge Board" : "Local Board"}</h1>
        <p className="tagline">
          Scores stay on this device — playing as <strong>{playerName}</strong>. Nothing is uploaded.{" "}
          <Link to="/profile" className="honor-link">
            View your profile →
          </Link>
          {tab === "daily" && <> · {dailyClock.resetLabel}</>}
        </p>
      </header>

      <div className="board-tabs" role="tablist" aria-label="Scoreboard view">
        <button
          ref={(node) => { tabRefs.current.local = node; }}
          type="button"
          id="board-tab-local"
          role="tab"
          aria-selected={tab === "local"}
          aria-controls="scoreboard-panel"
          tabIndex={tab === "local" ? 0 : -1}
          className={`btn ${tab === "local" ? "primary" : "ghost"}`}
          onClick={() => selectTab("local")}
          onKeyDown={(event) => {
            if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              selectTab(event.key === "Home" ? "local" : "daily", true);
            }
          }}
        >
          All-time local
        </button>
        <button
          ref={(node) => { tabRefs.current.daily = node; }}
          type="button"
          id="board-tab-daily"
          role="tab"
          aria-selected={tab === "daily"}
          aria-controls="scoreboard-panel"
          tabIndex={tab === "daily" ? 0 : -1}
          className={`btn ${tab === "daily" ? "primary" : "ghost"}`}
          onClick={() => selectTab("daily")}
          onKeyDown={(event) => {
            if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              selectTab(event.key === "End" ? "daily" : "local", true);
            }
          }}
        >
          Daily challenge
        </button>
      </div>

      <div
        id="scoreboard-panel"
        className="board-panel"
        role="tabpanel"
        aria-labelledby={`board-tab-${tab}`}
        tabIndex={0}
      >
        {!rows.length ? (
          <div className="board-empty">
            <p>
              {tab === "daily"
                ? currentDailyAction
                  ? `No score yet for ${currentDailyAction.title}. Set the first signal for today.`
                  : "No daily scores yet. Set the first signal for today."
                : "No local scores yet. Finish an Arcade run to join the board."}
            </p>
            {tab === "daily" && currentDailyAction ? (
              <Link className="btn primary" to={currentDailyAction.href}>
                Play today’s challenge
              </Link>
            ) : tab === "local" ? (
              <Link className="btn primary" to="/library">
                Choose an Arcade track
              </Link>
            ) : null}
          </div>
        ) : (
          <ol className="board-list" aria-label={tab === "daily" ? "Today’s challenge scores" : "All-time local scores"}>
            {rows.map((e, i) => {
              const title = trackLabel(e, titles);
              const keepsDailyIdentity = tab === "daily" && currentDailyAction?.challenge.trackId === e.track_id;
              const rowHref = keepsDailyIdentity
                ? currentDailyAction.href
                : playHref(e.track_id, e.tier, "arcade");
              const actionLabel = keepsDailyIdentity ? "Play today" : "Replay";
              return (
                <li
                  key={`${e.at}-${i}`}
                  aria-label={`Rank ${i + 1}, ${title}, ${e.score.toLocaleString()} points, ${e.accuracy}% accuracy, ${e.tier}, ${e.name}`}
                >
                  <Link
                    className={`board-row${i < 3 ? ` rank-${i + 1}` : ""}`}
                    to={rowHref}
                    aria-label={`${actionLabel} ${title} — ${e.tier} Arcade`}
                  >
                    <span className="board-rank" aria-hidden="true">{i + 1}</span>
                    <div className="board-track" aria-hidden="true">
                      <strong>{title}</strong>
                      <span className="board-track-meta">
                        <span>{e.tier} · {e.name}</span>
                        <span className="board-row-action">{actionLabel} →</span>
                      </span>
                    </div>
                    <div className="board-metrics" aria-hidden="true">
                      <span className="board-score">{e.score.toLocaleString()} <small>PTS</small></span>
                      <span className="board-acc">{e.accuracy}% <small>ACC</small></span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
