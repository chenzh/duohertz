import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useBackNavigationBlocker, useNavigate, useParams, useSearchParams } from "../router";
import { writeItem, writeJSON } from "../storage/safeStorage";
import { assetUrl, loadCatalog, loadChart } from "../catalog/loadCatalog";
import { LazyPlayField, loadPlayField } from "../components/LazyPlayField";
import { ExitGameDialog } from "../components/ExitGameDialog";
import { FullscreenButton } from "../components/FullscreenButton";
import { RunLoadFallback } from "../components/RunLoadFallback";
import type { ChartJSON, PlayMode, PlayResult } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";
import { writeLastRun } from "../storage/session";
import { districtColor } from "../constants/scape";
import { getPersonalBest, isOnboarded, setOnboarded } from "../storage/settings";
import { recordRun, STREAK_UPDATE_KEY } from "../lib/progress";
import { isCoarsePointer } from "../input/touchInput";
import { useGamepadAssignments } from "../input/useGamepadAssignments";
import { buildPlayPageMeta, usePageMeta } from "../seo/pageMeta";
import { trackEvent } from "../lib/analytics";
import { makeLiveStats, type LiveStats } from "../components/playfield/liveStats";
import { shiftStep } from "../data/firstShift";
import { loadShiftProgress, recordShiftRun } from "../lib/firstShift";
import { getAudioContext, unlockAudio } from "../audio/context";
import { decodedAudioCache } from "../audio/decodedAudioCache";
import { useScreenWakeLock } from "../lib/useScreenWakeLock";
import { parseChallengeTarget } from "../lib/challenge";
import {
  resolveDailyChallenge,
  todayKey,
  type DailyChallenge,
} from "../lib/dailyChallenge";
import { safeLibraryReturn, withLibraryReturn } from "../lib/libraryReturn";
import { chartSectionLabel } from "../lib/chartSections";
import { normalizePracticeRepetitions } from "../lib/practiceDrill";
import { RunClock } from "../lib/runClock";
import { chartTierFromParam, playModeFromParam, trackSetupHref } from "../lib/playHref";

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

export function PlayPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const firstShiftScene = shiftStep(params.get("shift"));
  const libraryReturnHref = safeLibraryReturn(params.get("returnTo"));
  const tier = chartTierFromParam(params.get("tier")) ?? "easy";
  const baseMode = playModeFromParam(params.get("mode")) ?? "casual";
  const seekParam = params.get("seek");
  const seekSeconds = seekParam === null || seekParam.trim() === "" ? null : Number(seekParam);
  const hasSectionPractice = seekSeconds !== null && Number.isFinite(seekSeconds) && seekSeconds >= 0;
  const untilParam = params.get("until");
  const untilSeconds = untilParam === null || untilParam.trim() === "" ? null : Number(untilParam);
  const repetitionsParam = params.get("reps");
  // A crafted `mode=arcade&seek=…` URL must never create a partial Arcade score.
  const mode: PlayMode = hasSectionPractice ? "practice" : baseMode;
  const trackReturnHref = id
    ? withLibraryReturn(trackSetupHref(id, tier, mode, {
        seek: hasSectionPractice ? seekSeconds ?? undefined : undefined,
        until: hasSectionPractice ? untilSeconds ?? undefined : undefined,
      }), libraryReturnHref)
    : libraryReturnHref;
  // A challenge is friendly URL state, not a trusted leaderboard record.
  // Section Practice intentionally drops it because partial scores are not comparable.
  const challengeTarget = hasSectionPractice ? null : parseChallengeTarget(params);
  const requestedDaily = params.get("daily");
  const requestedDailyDate = params.get("date");
  const [track, setTrack] = useState<CatalogTrack | null>(null);
  const [chart, setChart] = useState<ChartJSON | null>(null);
  const [dailyContext, setDailyContext] = useState<DailyChallenge | null>(null);
  const [loadFailure, setLoadFailure] = useState<"not-found" | "unavailable" | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [backExitPending, setBackExitPending] = useState(false);
  const [runActive, setRunActive] = useState(false);
  const [runPaused, setRunPaused] = useState(false);
  const exitButtonRef = useRef<HTMLButtonElement>(null);
  const [practiceRepetition, setPracticeRepetition] = useState(1);
  const runClockRef = useRef(new RunClock());
  const [touchUi] = useState(() => isCoarsePointer());
  const [gamepadIndex] = useGamepadAssignments(1);
  const dialogGamepadIndexes = useMemo(
    () => gamepadIndex === null ? [] : [gamepadIndex],
    [gamepadIndex],
  );
  // B-1 · Live stats bridge for the comic-panel HUD. Created here (stable
  // across renders) and handed to both PlayField (writer) and PlayHud (reader)
  // via the same ref — never crosses the 60fps canvas loop as React state.
  const statsRef = useRef<LiveStats>(makeLiveStats());
  const finishedRunRef = useRef(false);
  const markClockPaused = () => runClockRef.current.setPaused(true, performance.now());
  usePageMeta(track ? buildPlayPageMeta(track, tier, mode) : null);
  const proceedBlockedBack = useBackNavigationBlocker(runActive, () => {
    markClockPaused();
    setBackExitPending(true);
    setConfirmExit(true);
  });
  useScreenWakeLock(runActive && !runPaused && !confirmExit);

  useEffect(() => {
    document.body.classList.toggle("play-running", runActive);
    return () => document.body.classList.remove("play-running");
  }, [runActive]);

  // The pause/exit panel must not become visible before the run clock records
  // its boundary; a passive effect can be deferred past the next input/task.
  useLayoutEffect(() => {
    runClockRef.current.setPaused(runPaused || confirmExit, performance.now());
  }, [runPaused, confirmExit]);

  useEffect(() => {
    setPracticeRepetition(1);
  }, [id, tier, mode, seekParam, untilParam, repetitionsParam]);

  useEffect(() => {
    if (!id) return;
    runClockRef.current.reset();
    finishedRunRef.current = false;
    Object.assign(statsRef.current, makeLiveStats());
    let cancelled = false;
    let warmAudio: ReturnType<typeof decodedAudioCache.acquire> | null = null;
    void (async () => {
      setLoadFailure(null);
      setTrack(null);
      setChart(null);
      setDailyContext(null);
      // getTrack() 必须也在 try 里：它以前在外面，catalog.json 一旦 404，reject
      // 会直接逃出这个 async IIFE，failure state 永远不会被赋值 —— 页面就永久卡在
      // "Loading chart…"，用户看不到任何错误。
      try {
        const catalog = await loadCatalog();
        const t = catalog.tracks.find((candidate) => candidate.track_id === id);
        if (!t) {
          if (!cancelled) setLoadFailure("not-found");
          return;
        }
        if (cancelled) return;
        // Download/decode only the selected song while its chart loads. The
        // field acquires the same buffer; keep this lease until route cleanup.
        warmAudio = decodedAudioCache.acquire(getAudioContext(), assetUrl(t.audio));
        void warmAudio.promise.catch(() => {}); // PlayField owns retry/error UI.
        const dailyParams = new URLSearchParams();
        if (requestedDaily !== null) dailyParams.set("daily", requestedDaily);
        if (requestedDailyDate !== null) dailyParams.set("date", requestedDailyDate);
        const resolvedDaily = resolveDailyChallenge(
          dailyParams,
          catalog.tracks.map((candidate) => candidate.track_id),
          { trackId: t.track_id, tier, mode },
          todayKey(),
        );
        const [c] = await Promise.all([
          loadChart(t, tier),
          loadPlayField(),
        ]);
        if (!cancelled) {
          setTrack(t);
          setChart(c);
          setDailyContext(resolvedDaily);
        }
      } catch {
        warmAudio?.release();
        warmAudio = null;
        if (!cancelled) setLoadFailure("unavailable");
      }
    })();
    return () => {
      cancelled = true;
      warmAudio?.release();
    };
  }, [id, tier, mode, nav, requestedDaily, requestedDailyDate, loadAttempt]);

  const finish = (result: PlayResult) => {
    if (!track || finishedRunRef.current) return;
    finishedRunRef.current = true;
    setRunActive(false);
    trackEvent("play_finish", { track: track.track_id, grade: result.grade, accuracy: result.accuracy });
    const durationMs = runClockRef.current.durationMs(performance.now());
    const run = writeLastRun(track, tier, mode, result, durationMs, {
      daily: dailyContext ?? undefined,
      shiftStep: firstShiftScene?.trackId === track.track_id ? firstShiftScene.id : undefined,
      challenge: challengeTarget ?? undefined,
    });
    recordShiftRun(run);
    // Honor progress (PRD §17): run history + achievements + rank-up for the Profile page.
    const prog = recordRun(track, tier, mode, result, durationMs, new Date(run.endedAt));
    writeJSON("bs_new_achievements", prog.newAchievements, "session");
    writeItem("bs_rank_up", prog.rankUp ? prog.rank : "", "session");
    writeJSON(STREAK_UPDATE_KEY, prog.streakUpdate, "session");
    if (!isOnboarded()) setOnboarded();
    nav(withLibraryReturn("/results", libraryReturnHref));
  };

  const exitPlay = () => {
    setBackExitPending(false);
    if (!runActive) {
      nav(track ? trackReturnHref : libraryReturnHref);
      return;
    }
    markClockPaused();
    setConfirmExit(true);
  };

  const keepPlaying = async () => {
    setBackExitPending(false);
    // If the OS suspended audio while this panel was open, resume the shared
    // context inside the Keep playing gesture before PlayField restarts its
    // conductor. A manually paused run returns to its pause panel unchanged.
    if (runActive && !runPaused) await unlockAudio();
    setConfirmExit(false);
    // iOS WebKit does not reliably return focus after closing a native dialog.
    // A paused run instead restores focus inside its pause panel.
    if (!runPaused) requestAnimationFrame(() => exitButtonRef.current?.focus());
  };

  const leavePlay = () => {
    setRunActive(false);
    setConfirmExit(false);
    if (backExitPending) {
      setBackExitPending(false);
      proceedBlockedBack();
      return;
    }
    nav(track ? trackReturnHref : libraryReturnHref);
  };

  if (loadFailure) {
    return (
      <RunLoadFallback
        missing={loadFailure === "not-found"}
        trackHref={trackReturnHref}
        libraryHref={libraryReturnHref}
        onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
      />
    );
  }

  if (!track || !chart) {
    return (
      <div className="loading-state">
        <div className="tuning-dial" aria-hidden="true">
          <div className="tuning-scan" />
        </div>
        <p className="tuning-callsign">THE LATE STATIC · 88.6 FM</p>
        <p className="tuning-status">Tuning into the Scape…</p>
      </div>
    );
  }

  const lastHeadMs = Math.max(...chart.notes.map((note) => note.t * 1000), 0);
  const chartEndMs = Math.max(
    ...chart.notes.map((note) => ("end" in note ? note.end : note.t) * 1000),
    ...(chart.sections?.map((section) => section.t1 * 1000) ?? []),
    lastHeadMs,
  );
  const sectionStartMs = hasSectionPractice
    ? Math.min((seekSeconds ?? 0) * 1000, lastHeadMs)
    : undefined;
  const requestedEndMs = untilSeconds !== null && Number.isFinite(untilSeconds)
    ? untilSeconds * 1000
    : undefined;
  const sectionEndMs = sectionStartMs !== undefined && requestedEndMs !== undefined && requestedEndMs > sectionStartMs
    ? Math.min(requestedEndMs, chartEndMs)
    : undefined;
  const practiceRepetitions = normalizePracticeRepetitions(
    repetitionsParam,
    sectionStartMs !== undefined && sectionEndMs !== undefined,
  );
  const practiceSection = sectionStartMs === undefined
    ? undefined
    : chart.sections?.find((section) =>
        Math.abs(section.t0 * 1000 - sectionStartMs) < 1 &&
        (sectionEndMs === undefined || Math.abs(section.t1 * 1000 - sectionEndMs) < 1),
      );
  // Keep each run focused on one objective. An explicit friend challenge wins;
  // Daily owns its own local-score contract; only an ordinary full Arcade run
  // chases the device-local PB.
  const personalBest = mode === "arcade" && !challengeTarget && !dailyContext
    ? getPersonalBest(track.track_id, tier, mode)
    : null;
  const openingCoach = mode === "casual"
    && tier === "easy"
    && firstShiftScene?.id === "studio"
    && firstShiftScene.trackId === track.track_id
    && !loadShiftProgress().completed.some((receipt) => receipt.id === firstShiftScene.id)
    && !dailyContext
    && !challengeTarget;
  const sectionMeta = sectionStartMs === undefined
    ? null
    : sectionEndMs === undefined
      ? `from ${formatClock(sectionStartMs)}`
      : `${practiceSection ? `${chartSectionLabel(practiceSection.id)} · ` : ""}${formatClock(sectionStartMs)}–${formatClock(sectionEndMs)}`;
  const fullRunMeta = [
    `${tier} · ${mode}`,
    dailyContext ? "Daily" : null,
    challengeTarget ? `target ${challengeTarget.score.toLocaleString("en-US")}` : null,
    practiceRepetitions > 1 ? `Drill · Rep ${practiceRepetition}/${practiceRepetitions}` : null,
    sectionMeta,
  ].filter((part): part is string => part !== null).join(" · ");
  const compactRunContext = dailyContext
    ? "Daily"
    : challengeTarget
      ? "Goal"
      : practiceRepetitions > 1
        ? `Rep ${practiceRepetition}/${practiceRepetitions}`
        : sectionStartMs !== undefined
          ? practiceSection ? chartSectionLabel(practiceSection.id) : "Practice"
          : mode;
  const compactRunMeta = `${tier} · ${compactRunContext}`;

  return (
    <section className="play-page">
      <div
        className="play-bg"
        aria-hidden
        style={{ backgroundImage: `url(${assetUrl(track.cover)})` }}
      />
      <div
        className="neon-layer"
        aria-hidden
        style={track ? ({ "--district-color": districtColor(track.district) } as React.CSSProperties) : undefined}
      >
        <i className="tube" />
        <i className="tube" />
        <i className="tube" />
        <i className="tube" />
        <i className="sign" />
        <i className="sign" />
        <i className="sign" />
        <i className="sign" />
        <i className="breathe" />
      </div>
      <div className="play-meta">
        <h1 className="play-meta-heading">Play {track.title}</h1>
        {/* X 坐最左：手机没有 Esc，它是离开当前对局的显式出口；
            右侧 Fullscreen 只退出沉浸显示并暂停。开局后的误触由退出面板兜底。 */}
        <button ref={exitButtonRef} type="button" className="play-exit" onClick={exitPlay} aria-label="Exit the Scape">
          <span className="play-exit-visual" aria-hidden>
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </span>
        </button>
        <strong>{track.title}</strong>
        <span className="play-meta-tier" title={fullRunMeta}>
          <span className="play-meta-tier-full">{fullRunMeta}</span>
          <span className="play-meta-tier-compact" aria-hidden="true">{compactRunMeta}</span>
        </span>
        <FullscreenButton enabled={touchUi} />
      </div>
      <LazyPlayField
        key={`${track.track_id}-${tier}-${mode}-${sectionStartMs ?? "full"}-${sectionEndMs ?? "end"}-${practiceRepetitions}-${challengeTarget?.score ?? "open"}`}
        district={track.district}
        chart={chart}
        audioUrl={assetUrl(track.audio)}
        mode={mode}
        challengeTarget={challengeTarget ?? undefined}
        personalBest={personalBest ?? undefined}
        dailyDateKey={dailyContext?.dateKey}
        startAtMs={sectionStartMs}
        endAtMs={sectionEndMs}
        practiceRepetitions={practiceRepetitions}
        onPracticeRepetitionChange={setPracticeRepetition}
        gamepadIndex={gamepadIndex ?? undefined}
        suspended={confirmExit}
        statsRef={statsRef}
        openingCoach={openingCoach}
        startContext={firstShiftScene?.trackId === track.track_id
          ? `First Shift · ${firstShiftScene.node}`
          : undefined}
        onStart={() => {
          const nowMs = performance.now();
          runClockRef.current.start(nowMs);
          runClockRef.current.setPaused(confirmExit, nowMs);
          setRunPaused(false);
          setRunActive(true);
          trackEvent("play_start", {
            track: track.track_id,
            tier,
            mode,
            ...(sectionStartMs !== undefined ? { seek: sectionStartMs / 1000 } : {}),
            ...(sectionEndMs !== undefined ? { until: sectionEndMs / 1000 } : {}),
          });
        }}
        onPauseStateChange={(paused) => {
          if (paused) markClockPaused();
          setRunPaused(paused);
        }}
        onExitRequest={exitPlay}
        onFinish={finish}
      />
      {confirmExit && (
        <ExitGameDialog
          trackTitle={track.title}
          gamepadIndexes={dialogGamepadIndexes}
          onKeepPlaying={keepPlaying}
          onLeave={leavePlay}
        />
      )}
    </section>
  );
}
