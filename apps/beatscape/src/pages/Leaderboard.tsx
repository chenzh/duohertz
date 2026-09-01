import { useEffect, useState } from "react";
import { Link } from "../router";
import { loadCatalog } from "../catalog/loadCatalog";
import { loadBoard, loadDailyBoard, type BoardEntry } from "../storage/session";
import { todayKey } from "../lib/dailyChallenge";
import { loadDisplayName } from "../storage/settings";

function trackLabel(entry: BoardEntry, titles: Record<string, string>): string {
  return entry.title || titles[entry.track_id] || entry.track_id;
}

export function LeaderboardPage() {
  const [tab, setTab] = useState<"local" | "daily">("local");
  const board = loadBoard();
  const dailyBoard = loadDailyBoard(todayKey());
  const [titles, setTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    loadCatalog()
      .then((cat) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const t of cat.tracks) map[t.track_id] = t.title;
        setTitles(map);
      })
      .catch(() => {
        /* keep track_id fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = tab === "daily" ? dailyBoard : board;
  const playerName = loadDisplayName();

  return (
    <section className="leaderboard">
      <header className="page-header">
        <h1>Local Board</h1>
        <p className="tagline">
          Scores stay on this device — playing as <strong>{playerName}</strong>. No global upload in Stage 1–3.{" "}
          <Link to="/profile" className="honor-link">
            View your profile →
          </Link>
        </p>
      </header>

      <div className="board-tabs">
        <button type="button" className={`btn ${tab === "local" ? "primary" : "ghost"}`} onClick={() => setTab("local")}>
          All-time local
        </button>
        <button type="button" className={`btn ${tab === "daily" ? "primary" : "ghost"}`} onClick={() => setTab("daily")}>
          Daily challenge
        </button>
      </div>

      {!rows.length ? (
        <p className="board-empty">
          {tab === "daily"
            ? "No daily scores yet — play Today's Challenge from Home."
            : "No scores yet — play Arcade to rank locally."}
        </p>
      ) : (
        <div className="board-list">
          {rows.map((e, i) => (
            <div key={`${e.at}-${i}`} className={`board-row${i < 3 ? ` rank-${i + 1}` : ""}`}>
              <span className="board-rank">{i + 1}</span>
              <div className="board-track">
                <strong>{trackLabel(e, titles)}</strong>
                <span>
                  {e.tier} · {e.name}
                </span>
              </div>
              <span className="board-score">{e.score.toLocaleString()}</span>
              <span className="board-acc">{e.accuracy}%</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
