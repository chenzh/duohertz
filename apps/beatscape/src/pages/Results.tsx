import { Link } from "../router";
import { readLastRun } from "../storage/session";
import { getPersonalBest } from "../storage/settings";

function encourageCopy(mode: string, grade: string, fc: boolean, ap: boolean): string {
  if (mode === "casual") {
    if (ap) return "All Perfect in Casual — pure pulse. The city lights up with you.";
    if (fc) return "Full Combo clear — every beat still counts. Keep the pulse alive.";
    return "You cleared the Scape — no HP pressure in Casual. Take another run when you're ready.";
  }
  if (ap) return "All Perfect — absolute control. Own the Scape.";
  if (fc) return "Full Combo — clean clear. The skyline remembers.";
  if (grade === "S" || grade === "A") return "Strong clear — the Scape answers back.";
  return "Run complete — refine the timing and climb again.";
}

export function ResultsPage() {
  const run = readLastRun();
  if (!run) {
    return (
      <section>
        <p>No recent run.</p>
        <Link to="/">Home</Link>
      </section>
    );
  }

  const pb = getPersonalBest(run.track_id, run.tier, run.mode);
  const isNewRecord = Boolean(pb && run.score > pb.score);
  const encourage = encourageCopy(run.mode, run.grade, run.fc, run.ap);
  const totalHits =
    run.counts.perfect + run.counts.great + run.counts.good + run.counts.miss || 1;

  return (
    <section className="results results-ceremony">
      <div className="results-card">
        <p className="results-kicker">
          {run.title} · {run.artist}
        </p>
        <div className={`grade-big grade-${run.grade.toLowerCase()}`}>{run.grade}</div>
        <div className="badges">
          {run.fc && <span className="badge">FC</span>}
          {run.ap && <span className="badge ap">AP</span>}
          {run.mode === "casual" && <span className="badge beginner">Clear</span>}
          {isNewRecord && <span className="badge record">New Record</span>}
        </div>
        <p className="encourage">{encourage}</p>
        <div className="results-stats">
          <div>
            <span className="label">Score</span>
            <strong>{run.score.toLocaleString()}</strong>
          </div>
          <div>
            <span className="label">Accuracy</span>
            <strong>{run.accuracy}%</strong>
          </div>
          <div>
            <span className="label">Max Combo</span>
            <strong>{run.maxCombo}x</strong>
          </div>
        </div>
        <div className="judge-bars" aria-label="Judgment breakdown">
          {(
            [
              ["perfect", run.counts.perfect],
              ["great", run.counts.great],
              ["good", run.counts.good],
              ["miss", run.counts.miss],
            ] as const
          ).map(([key, count]) => (
            <div key={key} className={`judge-bar ${key}`}>
              <span>{key.slice(0, 1).toUpperCase() + key.slice(1)}</span>
              <div className="judge-bar-track">
                <div
                  className="judge-bar-fill"
                  style={{ width: `${Math.min(100, (count / totalHits) * 100)}%` }}
                />
              </div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
        <p className="results-meta">
          {run.tier} · {run.mode}
        </p>
        {pb && (
          <p className="pb">
            Personal Best: {pb.score.toLocaleString()} ({pb.accuracy}%)
            {isNewRecord && " · New Record!"}
          </p>
        )}
        <div className="cta-row">
          <Link className="btn primary" to={`/play/${run.track_id}?tier=${run.tier}&mode=${run.mode}`}>
            Replay
          </Link>
          <Link className="btn" to={`/play/${run.track_id}?tier=easy&mode=practice`}>
            Practice
          </Link>
          <Link className="btn" to="/library">
            Next Track
          </Link>
          <Link className="btn" to="/">
            Play Now
          </Link>
        </div>
        <p className="rights">AI Original · Owned Rights · Generated with MusicSaas</p>
      </div>
    </section>
  );
}
