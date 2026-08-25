import { useEffect, useState } from "react";
import { Link, useSearchParams } from "../router";
import { getTrack } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import { StreamFullCTA } from "../components/StreamFullCTA";
import { DistrictBadge } from "../components/DistrictBadge";
import { JUDGE_COLORS, SCAPE_COPY } from "../constants/scape";
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
  const [track, setTrack] = useState<CatalogTrack | null>(null);

  useEffect(() => {
    if (!run?.track_id) return;
    void getTrack(run.track_id).then((t) => setTrack(t ?? null));
  }, [run?.track_id]);

  if (!run) {
    return (
      <section>
        <p>No recent run.</p>
        <Link to="/" className="back-link">
          Home
        </Link>
      </section>
    );
  }

  const pb = getPersonalBest(run.track_id, run.tier, run.mode);
  const isRecord = run.prevBestScore != null ? run.score > run.prevBestScore : true;
  const counts = run.counts;
  const totalJ = counts.perfect + counts.great + counts.good + counts.miss || 1;
  const dist = [
    { label: "Perfect", n: counts.perfect, color: JUDGE_COLORS.perfect },
    { label: "Great", n: counts.great, color: JUDGE_COLORS.great },
    { label: "Good", n: counts.good, color: JUDGE_COLORS.good },
    { label: "Miss", n: counts.miss, color: JUDGE_COLORS.miss },
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

      <p className="results-meta">
        {run.title} · {run.artist}
        {track && (
          <>
            {" "}
            · <DistrictBadge district={track.district} />
          </>
        )}{" "}
        · {run.tier} · {run.mode}
      </p>
      {track && <StreamFullCTA track={track} />}
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
      <p className="rights results-rights">{SCAPE_COPY.rights}</p>
    </section>
  );
}
