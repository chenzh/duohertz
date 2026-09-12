import { useEffect, useState } from "react";
import { Link, useSearchParams } from "../router";
import { getTrack, loadChart } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import type { ChartJSON } from "../types/chart";
import { StreamFullCTA } from "../components/StreamFullCTA";
import { DistrictBadge } from "../components/DistrictBadge";
import { MissReplayPanel } from "../components/MissReplayPanel";
import { getAudioContext } from "../audio/context";
import { playStamp } from "../audio/hitsounds";
import { COMBO_COPY, JUDGE_COLORS, JUDGE_COPY, SCAPE_COPY, SCAPE_COPY_EXTRA, SURGE_COPY } from "../constants/scape";
import { downloadBlob, renderSharePoster } from "../lib/sharePoster";
import {
  ACHIEVEMENTS,
  RANKS,
  type AchievementId,
  type RankId,
} from "../lib/progress";
import { trackEvent } from "../lib/analytics";
import {
  readLastRun,
  shareResultsCopy,
  shareChallengeUrl,
} from "../storage/session";
import { getPersonalBest } from "../storage/settings";
import { readItem, readJSON, removeItem } from "../storage/safeStorage";
import { ShiftResult } from "../components/ShiftStory";

const NEW_ACH_KEY = "bs_new_achievements";
const RANK_UP_KEY = "bs_rank_up";

/**
 * 复制文本；返回是否成功。
 *
 * 逐级降级：Clipboard API → execCommand → 放弃。原来的写法在 catch 里又调了一次
 * `navigator.clipboard.writeText()` —— 但非安全上下文（http、部分 iframe）里
 * `navigator.clipboard` 根本是 undefined，于是第二次调用抛的是 TypeError，
 * 而且没人接这个 reject。先做能力检测就不会走到那一步。
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 无权限 / 非安全上下文 → 走兜底 */
  }
  try {
    // execCommand 已废弃，但它是 http 与老浏览器里唯一还能用的路子。
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Copy a rendered poster image (T5b). Image clipboard needs `ClipboardItem` and a
 * secure context — both missing on plain-http previews and in several in-app
 * browsers — so this reports `false` instead of throwing and the caller keeps the
 * download path as the fallback.
 */
async function copyImageBlob(blob: Blob): Promise<boolean> {
  const w = window as unknown as {
    isSecureContext?: boolean;
    ClipboardItem?: new (items: Record<string, Blob>) => unknown;
    navigator?: { clipboard?: { write?: (items: unknown[]) => Promise<void> } };
  };
  if (!w.isSecureContext || typeof w.ClipboardItem !== "function") return false;
  const write = w.navigator?.clipboard?.write;
  if (typeof write !== "function") return false;
  try {
    await write.call(navigator.clipboard, [new w.ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

/** Honor progress won this run (PRD §17) — stashed by Play.finish, shown once. */
function takeNewHonor(): { achievements: AchievementId[]; rankUp: RankId | null } {
  const achievements = readJSON<AchievementId[]>(
    NEW_ACH_KEY,
    [],
    (v) => (Array.isArray(v) ? (v.filter((id): id is AchievementId => typeof id === "string") as AchievementId[]) : null),
    "session",
  );
  const rankUp = (readItem(RANK_UP_KEY, "session") || "") as RankId | "";
  removeItem(NEW_ACH_KEY, "session");
  removeItem(RANK_UP_KEY, "session");
  return { achievements, rankUp: rankUp || null };
}

export function ResultsPage() {
  const [params] = useSearchParams();
  const preferLocal = params.get("run") === "local";
  const run = readLastRun(preferLocal);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [posterBusy, setPosterBusy] = useState(false);
  const [posterError, setPosterError] = useState("");
  const [posterCopied, setPosterCopied] = useState(false);
  const [track, setTrack] = useState<CatalogTrack | null>(null);
  const [chart, setChart] = useState<ChartJSON | null>(null);
  const [honor] = useState(() => takeNewHonor());
  // FEEL PACK: score counts up over ~900ms; the grade "stamps" with a thunk.
  const [shownScore, setShownScore] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShownScore(run.score);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      setShownScore(Math.round(run.score * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run?.score]);
  useEffect(() => {
    if (!run) return;
    try {
      const ctx = getAudioContext();
      if (ctx.state === "running") playStamp();
    } catch {
      /* audio unavailable */
    }
  }, [run?.grade]);

  useEffect(() => {
    if (!run?.track_id) return;
    // 这个 promise 以前没有 catch：结算页是分享链接 (?run=local) 的主要落点，
    // catalog.json 一旦取不到，reject 就没人接，页面上"单曲信息 / 完整版入口"
    // 会静默消失，用户只会以为本来就该这样。
    void getTrack(run.track_id)
      .then(async (t) => {
        setTrack(t ?? null);
        if (t) {
          try {
            const c = await loadChart(t, run.tier);
            setChart(c);
          } catch {
            setChart(null);
          }
        }
      })
      .catch(() => {
        setTrack(null);
        setChart(null);
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
  const isRecord = run.mode === "arcade" && !run.failed &&
    (run.prevBestScore == null || run.score > run.prevBestScore);
  const counts = run.counts;
  const totalJ = counts.perfect + counts.great + counts.good + counts.miss || 1;
  const dist = [
    { label: JUDGE_COPY.perfect, n: counts.perfect, color: JUDGE_COLORS.perfect },
    { label: JUDGE_COPY.great, n: counts.great, color: JUDGE_COLORS.great },
    { label: JUDGE_COPY.good, n: counts.good, color: JUDGE_COLORS.good },
    { label: JUDGE_COPY.miss, n: counts.miss, color: JUDGE_COLORS.miss },
  ];
  const missEvents = run.missEvents ?? [];
  // T3: signed early/late profile. Misses carry no delta, so the bar describes
  // only the notes that were actually hit.
  const timing = run.timing;
  const timingTotal = timing ? timing.early + timing.late : 0;
  // Normalised against the dominant side so the two halves read as a ratio.
  const timingDenom = Math.max(timing?.early ?? 0, timing?.late ?? 0, 1);
  const timingMean = timing ? Math.round(timing.meanMs) : 0;
  const timingVerdict =
    Math.abs(timingMean) <= 5 ? "Dead centre" : timingMean < 0 ? "You hit early" : "You hit late";
  const chartDurationMs =
    chart?.notes.reduce((max, n) => Math.max(max, ("end" in n && n.end ? n.end : n.t) * 1000), 0) ?? 0;

  async function onCopyLink() {
    if (!run) return;
    setCopyFailed(false);
    const url = shareChallengeUrl(run);
    const text = shareResultsCopy(run, url);
    // 整段文案复制失败就退一步只复制链接；全都失败要如实告诉用户，
    // 而不是像以前那样把异常吞掉、按钮照样显示成功。
    const ok = (await copyText(text)) || (await copyText(url));
    if (!ok) {
      setCopyFailed(true);
      return;
    }
    trackEvent("share_copy", { track: run.track_id, grade: run.grade });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function onDownloadPoster() {
    if (!run) return;
    setPosterBusy(true);
    setPosterError("");
    try {
      const blob = await renderSharePoster(run, track?.district ?? "");
      downloadBlob(blob, `beatscape-${run.track_id}-${run.grade}.png`);
      trackEvent("share_poster", { track: run.track_id, grade: run.grade });
    } catch (e) {
      // 以前只有 try/finally 没有 catch：renderSharePoster 在拿不到 blob 时会
      // reject，那个 reject 没人接，按钮只是默默弹回原状，用户完全不知道失败了。
      setPosterError(e instanceof Error ? e.message : "Poster export failed");
    } finally {
      setPosterBusy(false);
    }
  }

  async function onCopyPoster() {
    if (!run) return;
    setPosterBusy(true);
    setPosterError("");
    try {
      const blob = await renderSharePoster(run, track?.district ?? "");
      if (!(await copyImageBlob(blob))) {
        setPosterError("This browser blocks image copy — use Download poster");
        return;
      }
      trackEvent("share_poster_copy", { track: run.track_id, grade: run.grade });
      setPosterCopied(true);
      window.setTimeout(() => setPosterCopied(false), 2000);
    } catch (e) {
      setPosterError(e instanceof Error ? e.message : "Poster copy failed");
    } finally {
      setPosterBusy(false);
    }
  }

  return (
    <section className="results">
      <div className={`results-hero-card grade-border-${run.grade}${run.fc || run.ap ? " moment" : ""}`}>
        <div className={`grade-big grade-${run.grade}`}>{run.grade}</div>
        <div className="badges">
          {run.fc && <span className="badge">{COMBO_COPY.fullCombo.toUpperCase()}</span>}
          {run.ap && <span className="badge ap">{`ALL ${JUDGE_COPY.perfect.toUpperCase()}`}</span>}
          {isRecord && <span className="badge record">NEW RECORD</span>}
          {(run.surgeMaxTier ?? 0) >= 2 && (
            <span className={`badge signal${run.surgeMaxTier === 3 ? " onair" : ""}`}>
              {run.surgeMaxTier === 3 ? SURGE_COPY.t3 : `PEAK SIGNAL · ${SURGE_COPY.t2}`}
            </span>
          )}
        </div>
        <h1>{run.title}</h1>
        <p className="tagline">{run.artist}</p>
      </div>

      {run.shiftStep && <ShiftResult run={run} district={track?.district} />}

      {(honor.achievements.length > 0 || honor.rankUp) && (
        <div className="honor-toast">
          {honor.rankUp && (
            <span className="honor-chip rank">
              Rank up — {RANKS.find((r) => r.id === honor.rankUp)?.label ?? honor.rankUp}
            </span>
          )}
          {honor.achievements.map((id) => {
            const a = ACHIEVEMENTS.find((x) => x.id === id);
            return (
              <span key={id} className="honor-chip">
                ◆ {a?.label ?? id}
              </span>
            );
          })}
          <Link to="/profile" className="honor-link">
            View profile
          </Link>
        </div>
      )}

      <div className="results-stats">
        <div className="stat-pill">
          <span>Score</span>
          <strong>{shownScore.toLocaleString()}</strong>
        </div>
        <div className="stat-pill">
          <span>Accuracy</span>
          <strong>{run.accuracy}%</strong>
        </div>
        <div className="stat-pill">
          <span>{COMBO_COPY.maxCombo}</span>
          <strong>{run.maxCombo}×</strong>
        </div>
      </div>

      {!run.shiftStep && <ShiftResult run={run} district={track?.district} />}

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

      {timing && timingTotal > 0 && (
        <div className="timing-bar">
          <div className="timing-head">
            <span className="timing-title">TIMING</span>
            <span className="timing-mean">
              {timingMean > 0 ? "+" : ""}
              {timingMean} ms · {timingVerdict}
            </span>
          </div>
          <div
            className="timing-track"
            role="img"
            aria-label={`Early ${timing.early} notes, late ${timing.late} notes, mean ${timingMean} milliseconds`}
          >
            <span className="timing-half">
              <span className="timing-fill early" style={{ width: `${(timing.early / timingDenom) * 100}%` }} />
            </span>
            <span className="timing-half right">
              <span className="timing-fill late" style={{ width: `${(timing.late / timingDenom) * 100}%` }} />
            </span>
          </div>
          <div className="timing-legend">
            <span>EARLY {timing.early}</span>
            <span>LATE {timing.late}</span>
          </div>
        </div>
      )}

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
        <Link className="btn primary" to={`/play/${run.track_id}?tier=${run.tier}&mode=${run.mode}${run.shiftStep ? `&shift=${encodeURIComponent(run.shiftStep)}` : ""}`}>
          Replay
        </Link>
        <button type="button" className="btn" onClick={() => void onCopyLink()}>
          {copied ? "Copied!" : copyFailed ? "Copy failed" : "Copy link"}
        </button>
        <button type="button" className="btn" onClick={() => void onDownloadPoster()} disabled={posterBusy}>
          {posterBusy ? "Rendering…" : SCAPE_COPY_EXTRA.sharePoster}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => void onCopyPoster()}
          disabled={posterBusy}
          title="Copies the poster as an image (needs a secure context; use Download poster otherwise)"
        >
          {posterCopied ? "Poster copied" : "Copy poster"}
        </button>
        {posterError && (
          <p className="error" role="alert">
            {posterError}
          </p>
        )}
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
