import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Link, useNavigate, useSearchParams } from "../router";
import { loadCatalog, loadChart } from "../catalog/loadCatalog";
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
  STREAK_UPDATE_KEY,
  loadRuns,
  type AchievementId,
  type RankId,
  type StreakUpdate,
} from "../lib/progress";
import { trackEvent } from "../lib/analytics";
import {
  loadDailyBoard,
  readLastRun,
  shareResultsCopy,
  shareChallengeUrl,
} from "../storage/session";
import { getPersonalBest } from "../storage/settings";
import { readItem, readJSON, removeItem } from "../storage/safeStorage";
import { ShiftResult } from "../components/ShiftStory";
import { FIRST_SHIFT } from "../data/firstShift";
import { loadShiftProgress } from "../lib/firstShift";
import { buildRunCoach } from "../lib/runCoach";
import { buildResultsPageMeta, RESULTS_PAGE_META, usePageMeta } from "../seo/pageMeta";
import { resolveChallengeOutcome } from "../lib/challenge";
import { dailyReplayHref, summarizeDailyChallenge } from "../lib/dailyChallenge";
import { safeLibraryReturn, withLibraryReturn } from "../lib/libraryReturn";
import { resultReplayHref } from "../lib/resultReplay";
import { practiceProgress } from "../lib/practiceDrill";
import { useGamepadAssignments } from "../input/useGamepadAssignments";
import { useGamepadDialogNavigation } from "../input/useGamepadDialogNavigation";
import { PwaInstallCard } from "../components/PwaInstallCard";
import { nextTrackForRun } from "../lib/nextTrack";
import { playHref, trackSetupHref } from "../lib/playHref";

const NEW_ACH_KEY = "bs_new_achievements";
const RANK_UP_KEY = "bs_rank_up";
const DESKTOP_RESULTS_QUERY = "(min-width: 641px)";
const RESULTS_PRIMARY_ACTION_SELECTOR = ".btn.primary:not(:disabled):not([aria-disabled=\"true\"])";

type PosterShareAction = "share" | "copy" | null;
type PosterShareOutcome = "shared" | "cancelled" | "failed";
type PosterTask = "action" | "download" | null;

function clockLabel(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function formatAccuracyDelta(value: number): string {
  const magnitude = Math.abs(value).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  if (value > 0) return `+${magnitude} pp`;
  if (value < 0) return `−${magnitude} pp`;
  return "0 pp";
}

function formatMissDelta(value: number): string {
  if (value === 0) return "same misses";
  const count = Math.abs(value);
  return `${count} ${value < 0 ? "fewer" : "more"} ${count === 1 ? "miss" : "misses"}`;
}

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

function canCopyImageBlob(): boolean {
  const w = window as unknown as {
    isSecureContext?: boolean;
    ClipboardItem?: unknown;
    navigator?: { clipboard?: { write?: unknown } };
  };
  return Boolean(
    w.isSecureContext &&
    typeof w.ClipboardItem === "function" &&
    typeof w.navigator?.clipboard?.write === "function",
  );
}

function canShareImageFile(): boolean {
  try {
    if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;
    const probe = new File([new Uint8Array(0)], "beatscape.png", { type: "image/png" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

function preferredPosterShareAction(): PosterShareAction {
  if (canShareImageFile()) return "share";
  if (canCopyImageBlob()) return "copy";
  return null;
}

async function shareImageBlob(
  blob: Blob,
  fileName: string,
  text: string,
): Promise<PosterShareOutcome> {
  try {
    const file = new File([blob], fileName, { type: "image/png" });
    if (typeof navigator.share !== "function" ||
        typeof navigator.canShare !== "function" ||
        !navigator.canShare({ files: [file] })) {
      return "failed";
    }
    await navigator.share({
      files: [file],
      title: "BeatScape run",
      text,
    });
    return "shared";
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError" ? "cancelled" : "failed";
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

/** Consume the first run-of-day streak reward once, just like rank/achievement updates. */
function takeStreakUpdate(): StreakUpdate | null {
  const update = readJSON<StreakUpdate | null>(
    STREAK_UPDATE_KEY,
    null,
    (value) => {
      if (!value || typeof value !== "object") return null;
      const candidate = value as Partial<StreakUpdate>;
      return (candidate.kind === "started" || candidate.kind === "extended") &&
        Number.isInteger(candidate.activeDays) &&
        (candidate.activeDays ?? 0) >= 1 &&
        (candidate.activeDays ?? 0) <= 100 &&
        typeof candidate.newBest === "boolean"
        ? candidate as StreakUpdate
        : null;
    },
    "session",
  );
  removeItem(STREAK_UPDATE_KEY, "session");
  return update;
}

function primaryResultAction(root: HTMLElement | null): HTMLElement | null {
  return root?.querySelector<HTMLElement>(RESULTS_PRIMARY_ACTION_SELECTOR) ?? null;
}

function resultActionLabel(action: HTMLElement | null): string {
  return action?.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

/**
 * Keep the controller journey intact after a full run. The existing first
 * primary result action remains the default product decision for this run
 * (review, recovery, Daily/challenge retry, or First Shift continuation),
 * while the D-pad can reach every other result action.
 */
function ResultGamepadNavigation({
  rootRef,
  backHref,
  backLabel,
}: {
  rootRef: RefObject<HTMLElement | null>;
  backHref: string;
  backLabel: string;
}) {
  const navigate = useNavigate();
  const [gamepadIndex] = useGamepadAssignments(1);
  const gamepadIndexes = useMemo(
    () => gamepadIndex === null ? [] : [gamepadIndex],
    [gamepadIndex],
  );
  const [actionLabel, setActionLabel] = useState("");
  const actionLabelRef = useRef("");

  useGamepadDialogNavigation({
    containerRef: rootRef,
    defaultSelector: RESULTS_PRIMARY_ACTION_SELECTOR,
    enabled: gamepadIndex !== null,
    gamepadIndexes,
    onBack: () => navigate(backHref),
  });

  useEffect(() => {
    if (gamepadIndex === null) {
      actionLabelRef.current = "";
      setActionLabel("");
      return;
    }

    let frame = 0;
    const syncLabel = (next: string) => {
      if (actionLabelRef.current === next) return;
      actionLabelRef.current = next;
      setActionLabel(next);
    };
    const tick = () => {
      const action = primaryResultAction(rootRef.current);
      syncLabel(resultActionLabel(action));

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [gamepadIndex, rootRef]);

  if (!actionLabel) return null;
  return (
    <div
      className="results-gamepad-shortcut"
      role="note"
      aria-label={`Controller results controls. Use the D-pad or left stick to move, bottom face to select, and right face to return to ${backLabel}. Default action is ${actionLabel}.`}
    >
      <span>Controller</span>
      <strong>D-pad / stick · Move</strong>
      <strong>Face down · Select</strong>
      <strong>Face right · {backLabel}</strong>
      <small>Default · {actionLabel}</small>
    </div>
  );
}

export function ResultsPage() {
  const resultsRootRef = useRef<HTMLElement>(null);
  const [params] = useSearchParams();
  const preferLocal = params.get("run") === "local";
  const libraryReturnHref = safeLibraryReturn(params.get("returnTo"));
  const run = useMemo(() => readLastRun(preferLocal), [preferLocal]);
  const recentRuns = useMemo(() => loadRuns(), [run?.endedAt]);
  const shiftProgress = useMemo(
    () => run?.shiftStep ? loadShiftProgress() : null,
    [run?.endedAt, run?.shiftStep],
  );
  const dailyProgress = useMemo(() => run?.dailyDateKey
    ? summarizeDailyChallenge(
        {
          dateKey: run.dailyDateKey,
          trackId: run.track_id,
          tier: run.tier,
          mode: run.mode,
        },
        loadDailyBoard(run.dailyDateKey),
      )
    : null,
  [run?.dailyDateKey, run?.track_id, run?.tier, run?.mode]);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [posterTask, setPosterTask] = useState<PosterTask>(null);
  const [posterError, setPosterError] = useState("");
  const [posterSuccess, setPosterSuccess] = useState<"shared" | "copied" | null>(null);
  const [posterShareAction] = useState<PosterShareAction>(() => preferredPosterShareAction());
  const [preparedPoster, setPreparedPoster] = useState<{ key: string; blob: Blob } | null>(null);
  const [posterPreparing, setPosterPreparing] = useState(false);
  const [posterRetry, setPosterRetry] = useState(0);
  const [track, setTrack] = useState<CatalogTrack | null>(null);
  const [catalogTracks, setCatalogTracks] = useState<CatalogTrack[]>([]);
  const [chart, setChart] = useState<ChartJSON | null>(null);
  const [honor] = useState(() => takeNewHonor());
  const [streakUpdate] = useState(() => takeStreakUpdate());
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(
    () => typeof window === "undefined" || window.matchMedia(DESKTOP_RESULTS_QUERY).matches,
  );
  const posterDistrict = track && run && track.track_id === run.track_id ? track.district : "";
  const posterKey = run && posterShareAction
    ? JSON.stringify([run.endedAt, run.track_id, run.score, run.grade, posterShareAction, posterDistrict])
    : "";
  const readyPoster = preparedPoster?.key === posterKey ? preparedPoster.blob : null;
  usePageMeta(run ? buildResultsPageMeta(run) : RESULTS_PAGE_META);
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
    void loadCatalog()
      .then(async (catalog) => {
        const t = catalog.tracks.find((candidate) => candidate.track_id === run.track_id);
        setCatalogTracks(catalog.tracks);
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
        setCatalogTracks([]);
        setTrack(null);
        setChart(null);
      });
  }, [run?.track_id, run?.tier]);

  useEffect(() => {
    if (!run || !posterShareAction) return;
    let active = true;
    setPosterPreparing(true);
    setPosterError("");
    // Web Share consumes transient user activation. Font loading and toBlob
    // cannot run between the player's click and navigator.share().
    void renderSharePoster(
      run,
      posterDistrict,
      posterShareAction === "share" ? "portrait" : "landscape",
    ).then((blob) => {
      if (active) setPreparedPoster({ key: posterKey, blob });
    }).catch((error) => {
      if (active) setPosterError(error instanceof Error ? error.message : "Poster export failed");
    }).finally(() => {
      if (active) setPosterPreparing(false);
    });
    return () => { active = false; };
  }, [run, posterDistrict, posterShareAction, posterKey, posterRetry]);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_RESULTS_QUERY);
    const syncLayout = () => setDiagnosticsOpen(media.matches);
    syncLayout();
    media.addEventListener("change", syncLayout);
    return () => media.removeEventListener("change", syncLayout);
  }, []);

  if (!run) {
    return (
      <section ref={resultsRootRef} className="results results-empty" aria-labelledby="results-empty-title">
        <div className="results-empty-card">
          <p className="eyebrow">Run summary</p>
          <h1 id="results-empty-title">No result yet</h1>
          <p className="tagline">
            Finish a track to unlock your score breakdown, coaching, and next move.
          </p>
          <div className="results-empty-actions">
            <Link to="/library" className="btn primary">
              Choose a track
            </Link>
            <Link to="/" className="btn">
              Back to Home
            </Link>
          </div>
          <ResultGamepadNavigation
            rootRef={resultsRootRef}
            backHref="/"
            backLabel="Home"
          />
        </div>
      </section>
    );
  }

  const pb = getPersonalBest(run.track_id, run.tier, run.mode);
  // A current First Shift step only remains pending when this exact attempt did
  // not restore it. ShiftResult already owns the one useful action in that
  // state, so social export and a duplicate generic replay block would dilute
  // the recovery path (especially after a zero-hit first run).
  const pendingShiftStep = shiftProgress ? FIRST_SHIFT[shiftProgress.completed.length] : undefined;
  const focusedShiftRecovery = run.shiftStep !== undefined && pendingShiftStep?.id === run.shiftStep;
  const isSectionPractice = run.seekedFrom !== undefined;
  const exactTrackSetupHref = withLibraryReturn(
    trackSetupHref(run.track_id, run.tier, run.mode, {
      seek: run.seekedFrom,
      until: run.seekedUntil,
    }),
    libraryReturnHref,
  );
  const drillProgress = run.practiceAttempts
    ? practiceProgress(run.practiceAttempts)
    : null;
  const practiceRange = isSectionPractice
    ? run.seekedUntil !== undefined
      ? `${clockLabel(run.seekedFrom ?? 0)}–${clockLabel(run.seekedUntil)}`
      : `from ${clockLabel(run.seekedFrom ?? 0)}`
    : "";
  const isRecord = !isSectionPractice && run.mode === "arcade" && !run.failed &&
    (run.prevBestScore == null || run.score > run.prevBestScore);
  const challengeOutcome = run.challenge
    ? resolveChallengeOutcome(run.score, run.challenge, Boolean(run.failed))
    : null;
  const challengeSettled = shownScore === run.score;
  const counts = run.counts;
  const judgmentCount = counts.perfect + counts.great + counts.good + counts.miss;
  const totalJ = judgmentCount || 1;
  const dist = [
    { label: JUDGE_COPY.perfect, n: counts.perfect, color: JUDGE_COLORS.perfect },
    { label: JUDGE_COPY.great, n: counts.great, color: JUDGE_COLORS.great },
    { label: JUDGE_COPY.good, n: counts.good, color: JUDGE_COLORS.good },
    { label: JUDGE_COPY.miss, n: counts.miss, color: JUDGE_COLORS.miss },
  ];
  const missEvents = run.missEvents ?? [];
  const hasMissReview = counts.miss > 0 || missEvents.length > 0;
  // T3: signed early/late profile. Misses carry no delta, so the bar describes
  // only the notes that were actually hit.
  const timing = run.timing;
  const timingTotal = timing ? timing.early + timing.late : 0;
  // Normalised against the dominant side so the two halves read as a ratio.
  const timingDenom = Math.max(timing?.early ?? 0, timing?.late ?? 0, 1);
  const timingMean = timing ? Math.round(timing.meanMs) : 0;
  const timingVerdict =
    Math.abs(timingMean) <= 5 ? "Dead center" : timingMean < 0 ? "You hit early" : "You hit late";
  const chartDurationMs =
    chart?.notes.reduce((max, n) => Math.max(max, ("end" in n && n.end ? n.end : n.t) * 1000), 0) ?? 0;
  const currentDailyReplay = dailyReplayHref(run);
  const dailyBestIsThisRun = dailyProgress?.best?.at === run.endedAt;
  const replayLabel = isSectionPractice
    ? run.practiceRepetitions ? "Drill again" : "Practice again"
    : currentDailyReplay
      ? run.failed ? "Retry Daily" : "Improve Daily"
      : run.challenge ? "Retry challenge" : run.failed ? "Retry Arcade" : "Replay";
  const replayHref = resultReplayHref(run, libraryReturnHref);
  const baseCoach = run.shiftStep
    ? null
    : buildRunCoach(run, { recentRuns, replayHref, replayLabel });
  const coach = baseCoach?.action.kind === "link" && baseCoach.action.href.startsWith("/play/")
    ? {
        ...baseCoach,
        action: {
          ...baseCoach.action,
          href: withLibraryReturn(baseCoach.action.href, libraryReturnHref),
        },
      }
    : baseCoach;
  const coachOwnsReplay = coach?.action.kind === "link" &&
    coach.action.label === replayLabel && coach.action.href === replayHref;
  const dailyOwnsReplay = currentDailyReplay !== null;
  const challengeOwnsReplay = run.challenge !== undefined && !dailyOwnsReplay;
  const surfaceFailureRecovery = run.failed && !dailyOwnsReplay && !challengeOwnsReplay && !run.shiftStep;
  const missReviewIsPrimary = coach?.action.kind === "review";
  const nextTrack = !run.failed && !run.shiftStep && !run.dailyDateKey && !run.challenge &&
      !isSectionPractice && run.mode !== "practice"
    ? nextTrackForRun(catalogTracks, run.track_id, run.tier, recentRuns)
    : null;
  const nextTrackHref = nextTrack
    ? withLibraryReturn(playHref(nextTrack.track_id, run.tier, run.mode), libraryReturnHref)
    : null;

  function onReviewMisses() {
    const target = document.querySelector<HTMLDetailsElement>("#miss-review");
    if (!target) return;
    target.open = true;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    target.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true });
  }

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
    setPosterTask("download");
    setPosterError("");
    try {
      const blob = posterShareAction === "share" && readyPoster
        ? readyPoster
        : await renderSharePoster(run, track?.district ?? "", "portrait");
      downloadBlob(blob, `beatscape-${run.track_id}-${run.grade}-4x5.png`);
      trackEvent("share_poster", { track: run.track_id, grade: run.grade });
    } catch (e) {
      // 以前只有 try/finally 没有 catch：renderSharePoster 在拿不到 blob 时会
      // reject，那个 reject 没人接，按钮只是默默弹回原状，用户完全不知道失败了。
      setPosterError(e instanceof Error ? e.message : "Poster export failed");
    } finally {
      setPosterTask(null);
    }
  }

  async function onPosterAction() {
    if (!run || !posterShareAction) return;
    if (!readyPoster) {
      if (!posterPreparing) setPosterRetry((value) => value + 1);
      return;
    }
    setPosterTask("action");
    setPosterError("");
    setPosterSuccess(null);
    try {
      const blob = readyPoster;
      const fileName = `beatscape-${run.track_id}-${run.grade}.png`;
      if (posterShareAction === "share") {
        const outcome = await shareImageBlob(blob, fileName, shareResultsCopy(run, shareChallengeUrl(run)));
        if (outcome === "cancelled") return;
        if (outcome === "shared") {
          trackEvent("share_poster_share", { track: run.track_id, grade: run.grade });
          setPosterSuccess("shared");
          window.setTimeout(() => setPosterSuccess(null), 2000);
          return;
        }
        // Some browsers advertise file sharing but reject a concrete payload.
        // A working image clipboard is still a useful, silent fallback.
        if (canCopyImageBlob() && await copyImageBlob(blob)) {
          trackEvent("share_poster_copy", { track: run.track_id, grade: run.grade });
          setPosterSuccess("copied");
          window.setTimeout(() => setPosterSuccess(null), 2000);
          return;
        }
        setPosterError("Poster sharing was blocked — download the image instead.");
        return;
      }

      if (!(await copyImageBlob(blob))) {
        setPosterError("Image copy was blocked — download the poster instead.");
        return;
      }
      trackEvent("share_poster_copy", { track: run.track_id, grade: run.grade });
      setPosterSuccess("copied");
      window.setTimeout(() => setPosterSuccess(null), 2000);
    } catch (e) {
      setPosterError(e instanceof Error ? e.message : "Poster sharing failed");
    } finally {
      setPosterTask(null);
    }
  }

  const coachPanel = coach ? (
    <section className={`result-coach ${coach.tone}`} aria-labelledby="result-coach-title">
      <header className="result-coach-header">
        <span>Next move</span>
        <strong>{run.tier} · {run.mode}</strong>
      </header>
      <div className="result-coach-body">
        <div>
          <h2 id="result-coach-title">{coach.title}</h2>
          <p>{coach.detail}</p>
        </div>
        <div className="result-coach-actions">
          {coach.action.kind === "link" && !(challengeOwnsReplay && coach.action.href === replayHref) ? (
            <Link className="btn primary" to={coach.action.href}>
              {coach.action.label}
            </Link>
          ) : coach.action.kind === "review" ? (
            <button
              id="result-coach-action"
              type="button"
              className="btn primary"
              onClick={onReviewMisses}
            >
              {coach.action.label}
            </button>
          ) : null}
          {surfaceFailureRecovery && (
            <Link className="btn result-coach-retry" to={replayHref}>
              {replayLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  ) : null;

  const sharePanel = (
    <section className="results-share-panel" aria-label="Share this run">
      <div className="results-share-copy">
        <strong>Share this run</strong>
        <span>
          {posterShareAction === "share"
            ? "Send a playable link or share a 4:5 score card through your device."
            : posterShareAction === "copy"
              ? "Send a playable link, paste the landscape card into chat, or download 4:5."
              : "Download the 4:5 score card to share it from this browser."}
        </span>
      </div>
      <div className="results-share-actions">
        <button type="button" className="btn" onClick={() => void onCopyLink()}>
          {copied ? "Copied!" : copyFailed ? "Copy failed" : "Copy link"}
        </button>
        {posterShareAction && (
          <button
            type="button"
            className="btn"
            onClick={() => void onPosterAction()}
            disabled={posterTask !== null || posterPreparing || (!readyPoster && !posterError)}
            aria-live="polite"
          >
            {posterTask === "action"
              ? posterShareAction === "share" ? "Sharing…" : "Copying…"
              : posterPreparing || (!readyPoster && !posterError)
                ? "Preparing poster…"
                : posterSuccess === "shared"
                  ? "Poster shared"
                  : posterSuccess === "copied"
                    ? "Poster copied"
                    : !readyPoster
                      ? "Retry poster"
                      : posterShareAction === "share"
                        ? "Share poster"
                        : "Copy poster"}
          </button>
        )}
        <button type="button" className="btn" onClick={() => void onDownloadPoster()} disabled={posterTask !== null}>
          {posterTask === "download" ? "Rendering…" : SCAPE_COPY_EXTRA.sharePoster}
        </button>
      </div>
      {posterError && (
        <p className="error" role="alert">
          {posterError}
        </p>
      )}
    </section>
  );

  return (
    <section ref={resultsRootRef} className={`results${run.shiftStep ? " shift-results" : ""}`}>
      <div className={`results-hero-card grade-border-${run.grade}${run.fc || run.ap ? " moment" : ""}${run.failed ? " failed" : ""}`}>
        <div className={`grade-big grade-${run.grade}`}>{run.grade}</div>
        <div className="badges">
          {run.failed && <span className="badge failed">ARCADE FAILED</span>}
          {run.dailyDateKey && (
            <span className={`badge daily${run.failed ? " failed" : ""}`}>
              {run.failed ? "DAILY ATTEMPT" : "DAILY COMPLETE"}
            </span>
          )}
          {run.fc && <span className="badge">{COMBO_COPY.fullCombo.toUpperCase()}</span>}
          {run.ap && <span className="badge ap">{`ALL ${JUDGE_COPY.perfect.toUpperCase()}`}</span>}
          {isRecord && <span className="badge record">NEW RECORD</span>}
          {isSectionPractice && (
            <span className="badge practice">
              {run.practiceRepetitions ? `DRILL ×${run.practiceRepetitions}` : "PRACTICE"} · NOT RANKED
            </span>
          )}
          {(run.surgeMaxTier ?? 0) >= 2 && (
            <span className={`badge signal${run.surgeMaxTier === 3 ? " onair" : ""}`}>
              {run.surgeMaxTier === 3 ? SURGE_COPY.t3 : `PEAK SIGNAL · ${SURGE_COPY.t2}`}
            </span>
          )}
        </div>
        <h1>{run.title}</h1>
        <p className="tagline">{run.artist}</p>
      </div>

      {run.failed && (
        <div className="failed-run-note" role="status">
          <strong>HP depleted — run failed</strong>
          <span>This score was not added to your Personal Best or Local Board.</span>
        </div>
      )}

      {isSectionPractice && (
        <div className="practice-run-note" role="status">
          <strong>
            {run.practiceRepetitions
              ? `${run.practiceRepetitions}-rep drill complete — not ranked`
              : "Practice run — not ranked"}
          </strong>
          <span>
            Section {practiceRange}{run.practiceRepetitions
              ? drillProgress
                ? " · Final rep shown in headline stats · All reps compared below"
                : " · Final rep shown"
              : ""}. This score does not change your PB, leaderboard, Daily score, rank, or achievements.
          </span>
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

      {drillProgress && run.practiceAttempts && (
        <section className="drill-progress" aria-label="Drill progress">
          <header className="drill-progress-header">
            <span>Drill progress</span>
            <h2 id="drill-progress-title">{run.practiceAttempts.length} passes, one trend</h2>
            <p>
              Final vs first · {formatAccuracyDelta(drillProgress.accuracyDelta)} · {formatMissDelta(drillProgress.missDelta)}
            </p>
          </header>
          <ol className="drill-progress-list">
            {run.practiceAttempts.map((attempt, index) => {
              const best = index === drillProgress.bestIndex;
              return (
                <li
                  className="drill-progress-attempt"
                  data-best={best ? "true" : "false"}
                  key={index}
                  aria-label={`Rep ${index + 1}: ${attempt.accuracy}% accuracy, ${attempt.misses} ${attempt.misses === 1 ? "miss" : "misses"}, grade ${attempt.grade}${best ? ", best rep" : ""}`}
                >
                  <span>Rep {index + 1}</span>
                  {best && <em>Best</em>}
                  <strong>{attempt.accuracy}%</strong>
                  <small>{attempt.misses} {attempt.misses === 1 ? "miss" : "misses"} · Grade {attempt.grade}</small>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <ResultGamepadNavigation
        rootRef={resultsRootRef}
        backHref={exactTrackSetupHref}
        backLabel="Track"
      />

      {surfaceFailureRecovery && coachPanel}

      {!isSectionPractice && streakUpdate && (
        <section
          className="results-streak-update"
          aria-label="Night streak update"
          aria-live="polite"
          data-kind={streakUpdate.kind}
        >
          <div className="results-streak-copy">
            <span>Night streak</span>
            <strong>Night {streakUpdate.activeDays} secured</strong>
            <small>Today counts. Come back tomorrow to extend it.</small>
          </div>
          <div className="results-streak-actions">
            {streakUpdate.newBest && <b>New best</b>}
            <Link className="btn" to="/profile">View streak</Link>
          </div>
        </section>
      )}

      {run.dailyDateKey && dailyProgress && (
        <section
          className="daily-result"
          data-state={run.failed ? "failed" : dailyBestIsThisRun ? "best" : "complete"}
          aria-label="Daily challenge result"
        >
          <div className="daily-result-copy">
            <span>Daily challenge</span>
            <strong>
              {run.failed
                ? "No Daily score posted"
                : dailyBestIsThisRun
                  ? "New Daily best"
                  : "Daily score posted"}
            </strong>
            <small>
              {dailyProgress.best
                ? `Best today ${dailyProgress.best.score.toLocaleString("en-US")} PTS · ${dailyProgress.best.accuracy}% ACC · ${dailyProgress.clears} ${dailyProgress.clears === 1 ? "clear" : "clears"}`
                : run.failed
                  ? "Clear the chart to post today's local score."
                  : "Run complete — this browser could not retain the Daily score."}
            </small>
          </div>
          <div className="daily-result-actions">
            {currentDailyReplay && (
              <Link className="btn primary" to={replayHref}>
                {run.failed ? "Retry Daily" : "Improve Daily"}
              </Link>
            )}
            <Link className="btn" to="/leaderboard?view=daily">
              View Daily board
            </Link>
          </div>
        </section>
      )}

      {run.challenge && challengeOutcome && (
        <section
          className="challenge-result"
          data-outcome={challengeSettled ? challengeOutcome.status : "pending"}
          aria-label="Shared challenge result"
          aria-live="polite"
        >
          <div>
            <span>Shared challenge</span>
            <strong>
              {!challengeSettled
                ? "Checking target…"
                : challengeOutcome.status === "cleared"
                ? "Challenge cleared"
                : challengeOutcome.status === "tied"
                  ? "Target tied"
                  : run.failed
                    ? "Run failed"
                    : "Challenge missed"}
            </strong>
          </div>
          <b className="challenge-result-delta">
            {!challengeSettled
              ? "Comparing…"
              : challengeOutcome.status === "cleared"
              ? `+${challengeOutcome.delta.toLocaleString("en-US")} pts`
              : challengeOutcome.status === "tied"
                ? "Exact score"
                : run.failed
                  ? "HP depleted"
                  : `${Math.abs(challengeOutcome.delta).toLocaleString("en-US")} pts short`}
          </b>
          <small>
            Target {run.challenge.score.toLocaleString("en-US")} · {run.challenge.accuracy}% · Grade {run.challenge.grade}
          </small>
          <Link className="btn primary challenge-result-retry" to={replayHref}>
            Retry challenge
          </Link>
        </section>
      )}

      {!isSectionPractice && (honor.achievements.length > 0 || honor.rankUp) && (
        <div className="honor-toast" role="status" aria-live="polite">
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

      {!surfaceFailureRecovery && coachPanel}
      {hasMissReview && missReviewIsPrimary && (
        <MissReplayPanel
          missEvents={missEvents}
          totalMisses={counts.miss}
          sections={chart?.sections}
          durationMs={chartDurationMs}
          trackId={run.track_id}
          tier={run.tier}
          libraryReturnHref={libraryReturnHref}
        />
      )}
      {nextTrack && nextTrackHref && (
        <section className="results-next-track" aria-labelledby="results-up-next-title">
          <div>
            <span>Up next</span>
            <strong id="results-up-next-title">{nextTrack.title}</strong>
            <small>{nextTrack.artist} · {nextTrack.bpm} BPM · {run.tier} {run.mode}</small>
          </div>
          <Link
            className="btn"
            to={nextTrackHref}
            onClick={() => trackEvent("results_next_track", {
              from: run.track_id,
              to: nextTrack.track_id,
              tier: run.tier,
              mode: run.mode,
            })}
          >
            Play next
          </Link>
        </section>
      )}
      {!run.shiftStep && sharePanel}
      <ShiftResult run={run} district={track?.district} />
      {run.shiftStep && !focusedShiftRecovery && sharePanel}
      {!run.failed && !focusedShiftRecovery && <PwaInstallCard />}

      <details
        className="result-diagnostics"
        open={diagnosticsOpen}
        onToggle={(event) => setDiagnosticsOpen(event.currentTarget.open)}
      >
        <summary>
          <span>Run details</span>
          <small>
            {judgmentCount} {judgmentCount === 1 ? "note" : "notes"} · {counts.miss} {counts.miss === 1 ? "miss" : "misses"}
          </small>
        </summary>
        <div className="result-diagnostics-body">
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
        </div>
      </details>

      {hasMissReview && !missReviewIsPrimary && (
        <MissReplayPanel
          missEvents={missEvents}
          totalMisses={counts.miss}
          sections={chart?.sections}
          durationMs={chartDurationMs}
          trackId={run.track_id}
          tier={run.tier}
          libraryReturnHref={libraryReturnHref}
        />
      )}

      <p className="results-meta">
        {run.title} · {run.artist}
        {track && (
          <>
            {" "}
            · <DistrictBadge district={track.district} />
          </>
        )}{" "}
        · {run.tier} · {run.mode}
        {run.practiceRepetitions ? ` · Drill ×${run.practiceRepetitions} · final rep` : ""}
        {isSectionPractice ? ` · ${practiceRange}` : ""}
      </p>
      {!isSectionPractice && isRecord && run.prevBestScore != null ? (
        <p className="pb">Previous best {run.prevBestScore.toLocaleString()} — beaten!</p>
      ) : (
        !isSectionPractice && pb && (
          <p className="pb">
            Personal Best: {pb.score.toLocaleString()} ({pb.accuracy}%)
          </p>
        )
      )}
      {!focusedShiftRecovery && <section className="results-actions" aria-labelledby="results-actions-title">
        <header className="results-actions-header">
          <span>Keep playing</span>
          <h2 id="results-actions-title">Stay on this track</h2>
        </header>

        <div className="results-play-actions">
          {!coachOwnsReplay && !challengeOwnsReplay && !dailyOwnsReplay && (
            <Link className={`btn${coach || run.shiftStep ? "" : " primary"}`} to={replayHref}>
              {replayLabel}
            </Link>
          )}
          {isSectionPractice && (
            <Link
              className="btn"
              to={withLibraryReturn(`/play/${run.track_id}?tier=${run.tier}&mode=arcade`, libraryReturnHref)}
            >
              Play full Arcade
            </Link>
          )}
          <Link
            className="btn"
            to={exactTrackSetupHref}
          >
            Change setup
          </Link>
        </div>

        <nav className="results-exit-links" aria-label="Leave results">
          <Link to={libraryReturnHref}>Browse Library</Link>
          <span aria-hidden>·</span>
          <Link to="/">Home</Link>
        </nav>
      </section>}
      {track && <StreamFullCTA track={track} />}
      <p className="rights results-rights">{SCAPE_COPY.rights}</p>
    </section>
  );
}
