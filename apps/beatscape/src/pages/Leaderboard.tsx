import { loadBoard } from "../storage/session";

export function LeaderboardPage() {
  const board = loadBoard();
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
              <td>{e.track_id}</td>
              <td>{e.tier}</td>
              <td>{e.score.toLocaleString()}</td>
              <td>{e.accuracy}%</td>
              <td>{e.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!board.length && <p>No scores yet — play Arcade to rank locally.</p>}
    </section>
  );
}
