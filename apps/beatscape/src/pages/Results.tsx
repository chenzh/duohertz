import { useEffect, useState } from "react";
import { Link, useSearchParams } from "../router";
import { getTrack, loadChart } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import type { ChartJSON } from "../types/chart";
import { StreamFullCTA } from "../components/StreamFullCTA";
import { DistrictBadge } from "../components/DistrictBadge";
import { MissReplayPanel } from "../components/MissReplayPanel";
import { JUDGE_COLORS, SCAPE_COPY, SCAPE_COPY_EXTRA } from "../constants/scape";
import { downloadBlob, renderSharePoster } from "../lib/sharePoster";
import { trackEvent } from "../lib/analytics";
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
  const [posterBusy, setPosterBusy] = useState(false);
  const [track, setTrack] = useState<CatalogTrack | null>(null);
  const [chart, setChart] = useState<ChartJSON | null>(null);

  useEffect(() => {
    if (!run?.track_id) return;
    void getTrack(run.track_id).then(async (t) => {
      setTrack(t ?? null);
      if (t) {
        try {
          const c = await loadChart(t, run.tier);
          setChart(c);
        } catch {
          setChart(null);
        }
      }
    });
  }, [run?.track_id, run?.tier]);

  if (!run) {
    return (
      <section className="results">
        <p>No recent run on this device.</p>
        <p className="tagline">Open a share link with <code>?run=local</code> or finish a chart first.</p>
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
  const missEvents = run.missEvents ?? [];
  const chartDurationMs =
    chart?.notes.reduce((max, n) => Math.max(max, ("end" in n && n.end ? n.end : n.t) * 1000), 0) ?? 0;

  async function onCopyLink() {
    if (!run) return;
    const url = shareResultsUrl();
    const text = shareResultsCopy(run, url);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      await navigator.clipboard.writeText(url);
    }
    trackEvent("share_copy", { track: run.track_id, grade: run.grade });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function onDownloadPoster() {
    if (!run) return;
    setPosterBusy(true);
    try {
      const blob = await renderSharePoster(run, track?.district ?? "");
      downloadBlob(blob, `beatscape-${run.track_id}-${run.grade}.png`);
      trackEvent("share_poster", { track: run.track_id, grade: run.grade });
    } finally {
      setPosterBusy(false);
    }
  }

  return (
    <section className="results">
      <div className={`results-hero-card grade-border-${run.grade}`}>
        <div className={`grade-big grade-${run.grade}`}>{run.grade}</div>
        <div className="badges">
          {run.fc && <span className="badge">FC</span>}
          {run.ap && <span className="badge ap">AP</span>}
          {isRecord && <span className="badge record">NEW RECORD</span>}
        </div>
        <h1>{run.title}</h1>
        <p className="tagline">{run.artist}</p>
      </div>

      <div className="results-stats">
        <div className="stat-pill">
          <span>Score</span>
          <strong>{run.score.toLocaleString()}</strong>
        </div>
        <div className="stat-pill">
          <span>Accuracy</span>
          <strong>{run.accuracy}%</strong>
        </div>
        <div className="stat-pill">
          <span>Max Combo</span>
          <strong>{run.maxCombo}×</strong>
        </div>
      </div>

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

      <MissReplayPanel missEvents={missEvents} sections={chart?.sections} durationMs={chartDurationMs} />

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
        <button type="button" className="btn" onClick={() => void onDownloadPoster()} disabled={posterBusy}>
          {posterBusy ? "Rendering…" : SCAPE_COPY_EXTRA.sharePoster}
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
