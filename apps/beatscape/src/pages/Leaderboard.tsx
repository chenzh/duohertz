import { useEffect, useState } from "react";
import { loadCatalog } from "../catalog/loadCatalog";
import { getMessages } from "../i18n";
import { loadBoard, type BoardEntry } from "../storage/session";

function trackLabel(entry: BoardEntry, titles: Record<string, string>): string {
  return entry.title || titles[entry.track_id] || entry.track_id;
}

export function LeaderboardPage() {
  const m = getMessages();
  const board = loadBoard();
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

  return (
    <section className="leaderboard">
      <h1>Local Board</h1>
      <p>This device only — no global upload in Stage 1–3.</p>
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
          {board.map((e, i) => (
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
      {!board.length && (
        <p className="leaderboard-empty" role="status">
          {m.leaderboard.emptyState}
        </p>
      )}
    </section>
  );
}
