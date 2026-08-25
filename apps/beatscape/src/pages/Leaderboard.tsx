import { useEffect, useState } from "react";
import { loadCatalog } from "../catalog/loadCatalog";
import { loadBoard, loadDailyBoard, type BoardEntry } from "../storage/session";
import { todayKey } from "../lib/dailyChallenge";

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

  return (
    <section className="leaderboard">
      <h1>Local Board</h1>
      <p>This device only — no global upload in Stage 1–3.</p>
      <div className="board-tabs">
        <button type="button" className={`btn ${tab === "local" ? "primary" : "ghost"}`} onClick={() => setTab("local")}>
          All-time local
        </button>
        <button type="button" className={`btn ${tab === "daily" ? "primary" : "ghost"}`} onClick={() => setTab("daily")}>
          Daily challenge
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Track</th>
            <th>Tier</th>
            <th>Score</th>
            <th>Acc</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e, i) => (
            <tr key={`${e.at}-${i}`}>
              <td>{i + 1}</td>
              <td>{trackLabel(e, titles)}</td>
              <td>{e.tier}</td>
              <td>{e.score.toLocaleString()}</td>
              <td>{e.accuracy}%</td>
              <td>{e.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <p>
          {tab === "daily"
            ? "No daily scores yet — play Today's Challenge from Home."
            : "No scores yet — play Arcade to rank locally."}
        </p>
      )}
    </section>
  );
}
