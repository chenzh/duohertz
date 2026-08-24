import { Link } from "../router";
import { readLastRun } from "../storage/session";
import { getPersonalBest } from "../storage/settings";

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

  return (
    <section className="results">
      <div className="grade-big">{run.grade}</div>
      <div className="badges">
        {run.fc && <span className="badge">FC</span>}
        {run.ap && <span className="badge ap">AP</span>}
      </div>
      <h1>
        {run.score.toLocaleString()} pts · {run.accuracy}% Acc
      </h1>
      <p>Max Combo {run.maxCombo}x</p>
      <div className="counts">
        P {run.counts.perfect} · Gr {run.counts.great} · Go {run.counts.good} · M {run.counts.miss}
      </div>
      <p>
        {run.title} · {run.artist} · {run.tier} · {run.mode}
      </p>
      {pb && (
        <p className="pb">
          Personal Best: {pb.score.toLocaleString()} ({pb.accuracy}%)
          {run.score > pb.score && " · New Record!"}
        </p>
      )}
      <div className="cta-row">
        <Link className="btn primary" to={`/play/${run.track_id}?tier=${run.tier}&mode=${run.mode}`}>
          Replay
        </Link>
        <Link className="btn" to="/library">
          Library
        </Link>
        <Link className="btn" to="/">
          Play Now
        </Link>
      </div>
      <p className="rights">AI Original · Owned Rights · Generated with MusicSaas</p>
    </section>
  );
}
