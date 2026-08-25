import { useState } from "react";
import { Link, useSearchParams } from "../router";
import {
  readLastRun,
  shareResultsCopy,
  shareResultsUrl,
} from "../storage/session";
import { getPersonalBest } from "../storage/settings";

export function ResultsPage() {
  const [params] = useSearchParams();
  const preferLocal = params.get("run") === "local";
  const run = readLastRun(preferLocal);
  const [copied, setCopied] = useState(false);

  if (!run) {
    return (
      <section>
        <p>No recent run.</p>
        <Link to="/">Home</Link>
      </section>
    );
  }

  const pb = getPersonalBest(run.track_id, run.tier, run.mode);
  // True new record: this run beat the standing best captured before it was saved.
  const isRecord = run.prevBestScore != null ? run.score > run.prevBestScore : true;
  const counts = run.counts;
  const totalJ = counts.perfect + counts.great + counts.good + counts.miss || 1;
  const dist = [
    { label: "Perfect", n: counts.perfect, color: "#25F4EE" },
    { label: "Great", n: counts.great, color: "#FFFFFF" },
    { label: "Good", n: counts.good, color: "#9AA0A6" },
    { label: "Miss", n: counts.miss, color: "#FE2C55" },
  ];

  async function onCopyLink() {
    const url = shareResultsUrl();
    const text = shareResultsCopy(run!, url);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      await navigator.clipboard.writeText(url);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="results">
      <div className={`grade-big grade-${run.grade}`}>{run.grade}</div>
      <div className="badges">
        {run.fc && <span className="badge">FC</span>}
        {run.ap && <span className="badge ap">AP</span>}
        {isRecord && <span className="badge record">NEW RECORD</span>}
      </div>
      <h1>
        {run.score.toLocaleString()} pts · {run.accuracy}% Acc
      </h1>
      <p>Max Combo {run.maxCombo}x</p>

      <div className="judge-bars">
        {dist.map((d, i) => (
          <div className="judge-row" key={d.label} style={{ animationDelay: `${0.15 + i * 0.09}s` }}>
            <span className="judge-label">{d.label}</span>
            <span className="judge-track">
              <span
                className="judge-fill"
                style={{ width: `${(d.n / totalJ) * 100}%`, background: d.color }}
              />
            </span>
            <span className="judge-n">{d.n}</span>
          </div>
        ))}
      </div>

      <p>
        {run.title} · {run.artist} · {run.tier} · {run.mode}
      </p>
      {isRecord && run.prevBestScore != null ? (
        <p className="pb">Previous best {run.prevBestScore.toLocaleString()} — beaten!</p>
      ) : (
        pb && (
          <p className="pb">
            Personal Best: {pb.score.toLocaleString()} ({pb.accuracy}%)
          </p>
        )
      )}
      <div className="cta-row">
        <Link className="btn primary" to={`/play/${run.track_id}?tier=${run.tier}&mode=${run.mode}`}>
          Replay
        </Link>
        <button type="button" className="btn" onClick={onCopyLink}>
          {copied ? "Copied!" : "Copy link"}
        </button>
        <Link className="btn" to="/library">
          Library
        </Link>
        <Link className="btn" to="/">
          Play Now
        </Link>
      </div>
    </section>
  );
}
