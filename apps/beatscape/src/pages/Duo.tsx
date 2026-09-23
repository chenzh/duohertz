import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useBackNavigationBlocker, useNavigate, useParams, useSearchParams } from "../router";
import { assetUrl, getTrack, loadChart } from "../catalog/loadCatalog";
import { unlockAudio } from "../audio/playback";
import { LazyPlayField, loadPlayField } from "../components/LazyPlayField";
import { ExitGameDialog } from "../components/ExitGameDialog";
import type { ChartJSON, PlayResult } from "../types/chart";
import type { CatalogTrack } from "../types/catalog";
import { loadKeys } from "../storage/settings";
import { partnerKeysFor, presetIdFor } from "../input/keyMap";
import { useKeyLabels } from "../input/useKeyLabels";
import { usePhysicalKeyboardInput } from "../input/usePhysicalKeyboardInput";
import { districtColor } from "../constants/scape";
import { makeLiveStats, type LiveStats } from "../components/playfield/liveStats";
import { trackEvent } from "../lib/analytics";
import { buildPlayPageMeta, usePageMeta } from "../seo/pageMeta";
import { getAudioContext } from "../audio/context";
import { decodedAudioCache } from "../audio/decodedAudioCache";
import { duoMode } from "../lib/runSetup";
import { isCoarsePointer } from "../input/touchInput";
import { useGamepadAssignments } from "../input/useGamepadAssignments";
import { exitGameFullscreen, gameFullscreenElement, requestGameFullscreen } from "../lib/fullscreen";
import { FullscreenButton } from "../components/FullscreenButton";
import { RunLoadFallback } from "../components/RunLoadFallback";
import { useScreenWakeLock } from "../lib/useScreenWakeLock";
import { formatDuoAccuracy, resolveDuoOutcome } from "../lib/duoOutcome";
import { safeLibraryReturn, withLibraryReturn } from "../lib/libraryReturn";
import { cycleModalFocus } from "../lib/modalFocus";
import { PauseAudioControls } from "../components/PauseAudioControls";
import { RunClock } from "../lib/runClock";
import { GamepadDialogHint } from "../components/GamepadDialogHint";
import type { AudioLoadSupportCode } from "../audio/audioLoadIssue";
import type { AudioLoadProgress as AudioProgress } from "../audio/earlyAudio";
import { AudioLoadProgress } from "../components/AudioLoadProgress";
import { useGamepadDialogNavigation } from "../input/useGamepadDialogNavigation";
import { chartTierFromParam, playModeFromParam, trackSetupHref } from "../lib/playHref";

/**
 * DUO · Split-screen versus — two players, one track, one keyboard.
 *
 * Design notes:
 * · Both fields run the SAME chart from the SAME audio file, but each owns its
 *   own `Conductor` + `GameSession` (PlayField has no shared-clock mode).
 * · **Start sync**: each field fires `onReady` when its decode finishes; the
 *   parent only bumps `startGate` once BOTH are armed, so both `begin()` calls
 *   land in the same React commit — the same frame. Without the gate, P2 would
 *   start a few frames late and the two charts would visibly drift.
 * · **Audio**: P2 gets `muteMusic` so we don't layer the same track on itself
 *   (independent source starts can otherwise produce flanger/echo). Hit SFX stay on for both,
 *   so each player still hears their own feedback.
 * · **Keys**: P1 keeps the player's saved binding; P2 is handed the preset that
 *   can't collide with it — and that sits as far away as the board allows
 *   (arrows ↔ WASD, two opposite corners), see `keyMap.partnerKeysFor`.
 * · **Pause**: both fields hand their pause toggles to the parent, which bumps
 *   a single `pauseSync` counter that flips BOTH fields — a one-sided pause
 *   would freeze one chart while the other kept falling.
 */

export function DuoPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const libraryReturnHref = safeLibraryReturn(params.get("returnTo"));
  const tier = chartTierFromParam(params.get("tier")) ?? "easy";
  const mode = duoMode(playModeFromParam(params.get("mode")) ?? "casual");
  const trackReturnHref = id
    ? withLibraryReturn(trackSetupHref(id, tier, mode), libraryReturnHref)
    : libraryReturnHref;
  // Practice can independently change each player's playback rate after misses,
  // which would break the shared-versus clock. Direct URLs degrade to Casual;
  // TrackPage prevents creating a Practice Duo link in the first place.
  const [track, setTrack] = useState<CatalogTrack | null>(null);
  const [chart, setChart] = useState<ChartJSON | null>(null);
  const [loadFailure, setLoadFailure] = useState<"not-found" | "unavailable" | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [backExitPending, setBackExitPending] = useState(false);
  const [runActive, setRunActive] = useState(false);
  const [runPaused, setRunPaused] = useState(false);
  const exitButtonRef = useRef<HTMLButtonElement>(null);
  const runClockRef = useRef(new RunClock());
  const markClockPaused = () => runClockRef.current.setPaused(true, performance.now());
  const [touchUi] = useState(isCoarsePointer);
  const physicalKeyboardSeen = usePhysicalKeyboardInput();
  const showTouchLegend = touchUi && !physicalKeyboardSeen;
  const [p1GamepadIndex, p2GamepadIndex] = useGamepadAssignments(2);
  const dialogGamepadIndexes = useMemo(
    () => [p1GamepadIndex, p2GamepadIndex].filter((index): index is number => index !== null),
    [p1GamepadIndex, p2GamepadIndex],
  );
  const [audioReadyForControllerStart, setAudioReadyForControllerStart] = useState(false);
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

  // Record the clock pause before the exit/pause UI becomes observable.
  useLayoutEffect(() => {
    runClockRef.current.setPaused(runPaused || confirmExit, performance.now());
  }, [runPaused, confirmExit]);

  useEffect(() => {
    const context = getAudioContext();
    const sync = () => setAudioReadyForControllerStart(String(context.state) === "running");
    sync();
    context.addEventListener("statechange", sync);
    return () => context.removeEventListener("statechange", sync);
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let warmAudio: ReturnType<typeof decodedAudioCache.acquire> | null = null;
    void (async () => {
      setLoadFailure(null);
      setTrack(null);
      setChart(null);
      try {
        const t = await getTrack(id);
        if (!t) {
          if (!cancelled) setLoadFailure("not-found");
          return;
        }
        if (cancelled) return;
        warmAudio = decodedAudioCache.acquire(getAudioContext(), assetUrl(t.audio));
        void warmAudio.promise.catch(() => {}); // Each field owns its retry UI.
        const [c] = await Promise.all([
          loadChart(t, tier),
          loadPlayField(),
        ]);
        if (!cancelled) {
          setTrack(t);
          setChart(c);
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
  }, [id, tier, nav, loadAttempt]);

  // One live-stats bridge per player — each field writes, each HUD reads.
  const p1Stats = useRef<LiveStats>(makeLiveStats());
  const p2Stats = useRef<LiveStats>(makeLiveStats());

  const p1Keys = useMemo(loadKeys, []);
  const p2Keys = useMemo(() => partnerKeysFor(p1Keys), [p1Keys]);
  const p1Hint = useKeyLabels(p1Keys).join(" · ");
  const p2Hint = useKeyLabels(p2Keys).join(" · ");

  // Start gate. Each field reports ready when its decode finishes; only when
  // BOTH are armed do we show the START card. The Start action (a) unlocks the
  // AudioContext inside the user-gesture stack — without it Chrome's autoplay
  // policy suspends the context and the run starts silent — and (b) bumps the
  // gate so both conductors `begin()` in the same React commit.
  const [readyCount, setReadyCount] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [duoResult, setDuoResult] = useState<[PlayResult, PlayResult] | null>(null);
  const resultsRef = useRef<Array<PlayResult | null>>([null, null]);
  const [audioLoadError, setAudioLoadError] = useState("");
  const [audioProgress, setAudioProgress] = useState<AudioProgress | null>(null);
  const [audioRetrying, setAudioRetrying] = useState(false);
  const [audioRetrySync, setAudioRetrySync] = useState(0);
  const audioRetryButtonRef = useRef<HTMLButtonElement>(null);
  const audioBackButtonRef = useRef<HTMLButtonElement>(null);
  const duoStartButtonRef = useRef<HTMLButtonElement>(null);
  const duoStartDialogRef = useRef<HTMLDivElement>(null);
  const duoLoadingDialogRef = useRef<HTMLDivElement>(null);
  const pauseResumeButtonRef = useRef<HTMLButtonElement>(null);
  const pauseRestartButtonRef = useRef<HTMLButtonElement>(null);
  const pauseExitButtonRef = useRef<HTMLButtonElement>(null);
  const pauseDialogRef = useRef<HTMLDivElement>(null);
  const resultRematchButtonRef = useRef<HTMLButtonElement>(null);
  const resultExitButtonRef = useRef<HTMLButtonElement>(null);
  const resultDialogRef = useRef<HTMLDivElement>(null);
  const focusStartWhenReadyRef = useRef(false);
  const startingRef = useRef(false);
  const startGate = gateOpen ? 1 : 0;
  const armReady = useCallback(() => {
    setReadyCount((count) => Math.min(2, count + 1));
  }, []);
  const reportAudioLoadError = useCallback((supportCode: AudioLoadSupportCode) => {
    setAudioRetrying(false);
    setAudioLoadError((current) => current || supportCode);
  }, []);
  const reportAudioProgress = useCallback((progress: AudioProgress) => {
    setAudioProgress((previous) => {
      if (progress.phase === "decode") return previous?.phase === "decode" ? previous : progress;
      if (previous?.phase === "download" && previous.totalBytes === progress.totalBytes) {
        const before = previous.totalBytes === null ? null : Math.floor(previous.loadedBytes / previous.totalBytes * 100);
        const after = progress.totalBytes === null ? null : Math.floor(progress.loadedBytes / progress.totalBytes * 100);
        if (before === after) return previous;
      }
      return progress;
    });
  }, []);
  const retryDuoAudio = useCallback(() => {
    focusStartWhenReadyRef.current = true;
    setAudioRetrying(true);
    setReadyCount(0);
    setAudioProgress(null);
    setStartError("");
    setAudioRetrySync((attempt) => attempt + 1);
  }, []);
  const handleAudioErrorKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      nav(track ? trackReturnHref : libraryReturnHref);
      return;
    }
    if (event.key !== "Tab") return;
    event.preventDefault();
    const retry = audioRetryButtonRef.current;
    const back = audioBackButtonRef.current;
    if (event.shiftKey) (document.activeElement === retry ? back : retry)?.focus();
    else (document.activeElement === back ? retry : back)?.focus();
  };
  useEffect(() => {
    if (audioLoadError) audioRetryButtonRef.current?.focus();
  }, [audioLoadError]);
  useEffect(() => {
    if (readyCount < 2 || audioLoadError) return;
    // The loading card disappears when both receivers arm. If its Back button
    // held focus, the browser returns focus to body; land on the real Start.
    const focusStart = focusStartWhenReadyRef.current || document.activeElement === document.body;
    focusStartWhenReadyRef.current = false;
    if (focusStart) duoStartButtonRef.current?.focus();
  }, [readyCount, audioLoadError]);
  useEffect(() => {
    if (readyCount >= 2 && audioRetrying) {
      setAudioRetrying(false);
      setAudioLoadError("");
    }
  }, [readyCount, audioRetrying]);
  useEffect(() => {
    runClockRef.current.reset();
    focusStartWhenReadyRef.current = false;
    setAudioLoadError("");
    setAudioProgress(null);
    setAudioRetrying(false);
    setReadyCount(0);
    setGateOpen(false);
    startingRef.current = false;
    setStarting(false);
    setStartError("");
  }, [id, tier, mode]);
  const startDuo = async () => {
    // React cannot disable the button until the event commits. The ref closes
    // the smaller same-turn window so a double tap cannot resume audio or
    // publish duo_start twice.
    if (startingRef.current || gateOpen) return;
    startingRef.current = true;
    setStarting(true);
    setStartError("");
    // Must run inside the click handler (user-gesture stack) for autoplay unlock.
    setRunActive(true);
    setRunPaused(false);
    const audioUnlock = unlockAudio();
    const fullscreenWasActive = gameFullscreenElement() !== null;
    const fullscreenRequest = requestGameFullscreen();
    try {
      await audioUnlock;
      const nowMs = performance.now();
      runClockRef.current.start(nowMs);
      runClockRef.current.setPaused(confirmExit, nowMs);
      setGateOpen(true);
      trackEvent("duo_start", { track: track?.track_id ?? "", tier, mode });
    } catch {
      startingRef.current = false;
      setStarting(false);
      setRunActive(false);
      setStartError("Audio could not start. Check browser sound permission, then try again.");
      if (!fullscreenWasActive) {
        void fullscreenRequest.then((result) => {
          if (result === "requested" && !startingRef.current) return exitGameFullscreen();
        });
      }
    } finally {
      void fullscreenRequest;
    }
  };
  const duoReadyVisible = readyCount >= 2 && !gateOpen && !duoResult && !audioLoadError;
  const duoLoadingVisible = readyCount < 2 && !gateOpen && !duoResult && !audioLoadError;
  useEffect(() => {
    if (duoLoadingVisible) duoLoadingDialogRef.current?.focus();
  }, [duoLoadingVisible, track, chart]);
  useGamepadDialogNavigation({
    containerRef: duoStartDialogRef,
    enabled: duoReadyVisible && audioReadyForControllerStart,
    gamepadIndexes: dialogGamepadIndexes,
    onBack: () => nav(track ? trackReturnHref : libraryReturnHref),
  });

  // Linked pause: any pause action on either field broadcasts once and BOTH
  // fields flip together (a one-sided pause would drift the charts apart).
  // Both fields' window-keydown handlers fire for the SAME key event — and
  // browsers run a microtask checkpoint between event listeners, so a
  // queueMicrotask here would flush after listener #1 and the second
  // broadcast would slip through as a SECOND bump (two flips = no pause).
  // setTimeout(0) lands after the whole dispatch task, so the two reports
  // collapse into exactly one bump.
  const [pauseSync, setPauseSync] = useState(0);
  const pausePendingRef = useRef(false);
  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [gamepadInterruption, setGamepadInterruption] = useState("");
  const resumingRef = useRef(false);
  const runPausedRef = useRef(runPaused);
  runPausedRef.current = runPaused;
  const broadcastPause = useCallback(() => {
    if (pausePendingRef.current) return;
    pausePendingRef.current = true;
    setTimeout(() => {
      pausePendingRef.current = false;
      setPauseSync((s) => s + 1);
    }, 0);
  }, []);
  const resumeDuo = async () => {
    if (!runPausedRef.current || confirmExit || duoResult || resumingRef.current) return;
    resumingRef.current = true;
    setResuming(true);
    setResumeError("");
    try {
      // One parent-owned user gesture resumes the shared context before both
      // conductors receive the same pauseSync transition.
      await unlockAudio();
      if (!runPausedRef.current || confirmExit || duoResult) return;
      broadcastPause();
    } catch {
      resumingRef.current = false;
      setResuming(false);
      setResumeError("Audio could not resume. Check browser sound permission, then try again.");
    }
  };
  const toggleDuoFromGamepad = () => {
    if (runPausedRef.current) void resumeDuo();
    else broadcastPause();
  };
  const reportGamepadInterruption = useCallback((message: string) => {
    setGamepadInterruption(message);
  }, []);

  // Both runs must land before we can call a winner.
  const finish = (who: 0 | 1) => (result: PlayResult) => {
    resultsRef.current[who] = result;
    const [a, b] = resultsRef.current;
    if (a && b) {
      setRunActive(false);
      setDuoResult([a, b]);
      trackEvent("duo_finish", {
        track: track?.track_id ?? "",
        tier,
        mode,
        p1: a.score,
        p2: b.score,
        durationMs: runClockRef.current.durationMs(performance.now()),
      });
    }
  };

  // Rematch: bumping this key remounts both fields (fresh sessions, fresh
  // decode, fresh ready-arms). The gate closes and re-arms before reopening.
  const [runKey, setRunKey] = useState(0);
  const resetDuo = () => {
    runClockRef.current.reset();
    resultsRef.current = [null, null];
    focusStartWhenReadyRef.current = true;
    setRunActive(false);
    setDuoResult(null);
    setGateOpen(false);
    startingRef.current = false;
    setStarting(false);
    setStartError("");
    setAudioLoadError("");
    setAudioRetrying(false);
    setRunPaused(false);
    resumingRef.current = false;
    setResuming(false);
    setResumeError("");
    setGamepadInterruption("");
    pausePendingRef.current = false;
    setPauseSync(0);
    setReadyCount(0);
    setRunKey((k) => k + 1);
  };
  const rematch = () => resetDuo();

  const handlePauseKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      void resumeDuo();
      return;
    }
    if (event.key !== "Tab") return;
    event.preventDefault();
    cycleModalFocus(event.currentTarget, event.shiftKey);
  };
  useGamepadDialogNavigation({
    containerRef: pauseDialogRef,
    enabled: runPaused && !confirmExit && !duoResult,
    gamepadIndexes: dialogGamepadIndexes,
    onBack: () => void resumeDuo(),
  });
  useEffect(() => {
    if (runPaused && !confirmExit && !duoResult) pauseResumeButtonRef.current?.focus();
    if (!runPaused) {
      resumingRef.current = false;
      setResuming(false);
      setResumeError("");
      setGamepadInterruption("");
    }
  }, [runPaused, confirmExit, duoResult]);

  const leaveDuo = () => {
    setRunActive(false);
    setConfirmExit(false);
    if (backExitPending) {
      setBackExitPending(false);
      proceedBlockedBack();
      return;
    }
    nav(track ? trackReturnHref : libraryReturnHref);
  };
  useGamepadDialogNavigation({
    containerRef: resultDialogRef,
    enabled: duoResult !== null,
    gamepadIndexes: dialogGamepadIndexes,
    onBack: leaveDuo,
  });

  const handleResultKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      leaveDuo();
      return;
    }
    if (event.key !== "Tab") return;
    event.preventDefault();
    const rematchButton = resultRematchButtonRef.current;
    const exitButton = resultExitButtonRef.current;
    if (event.shiftKey) {
      (document.activeElement === rematchButton ? exitButton : rematchButton)?.focus();
    } else {
      (document.activeElement === exitButton ? rematchButton : exitButton)?.focus();
    }
  };
  useEffect(() => {
    if (duoResult) resultRematchButtonRef.current?.focus();
  }, [duoResult]);

  // The ready card has no progress to discard, so its X mirrors browser Back
  // and returns immediately. Once either field starts, keep the confirmation:
  // the top-left target is intentionally easy to reach on phones.
  const exitDuo = () => {
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
    // Closing an exit panel resumes an active conductor. Re-unlock first when
    // the OS suspended audio while the panel was open; an already-paused duel
    // returns to its pause panel and unlocks from that explicit Resume action.
    if (runActive && !runPaused) await unlockAudio();
    setConfirmExit(false);
    // WebKit may leave focus on the document when a native dialog closes.
    // Keep a manual pause's focus inside its own panel instead.
    if (!runPaused) requestAnimationFrame(() => exitButtonRef.current?.focus());
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
        <p className="tuning-status">Tuning two receivers…</p>
      </div>
    );
  }

  const outcome = duoResult ? resolveDuoOutcome(duoResult[0], duoResult[1]) : null;

  // WASD lives under the left hand, the arrow cluster in the bottom-right
  // corner — so whoever is on WASD takes the LEFT panel, or the two players'
  // hands end up crossed in front of each other.
  const p2OnLeft = presetIdFor(p2Keys) === "wasd";

  // Everything that has a left/right order follows the panels, so what the
  // player reads matches where their board actually is.
  const inputHints: Array<[string, string]> = [
    ["P1", p1GamepadIndex == null
      ? (showTouchLegend ? "Tap 4 lanes" : p1Hint)
      : touchUi ? "Pad 1 · 4 lanes" : "Pad 1 · D-pad / face"],
    ["P2", p2GamepadIndex == null
      ? (showTouchLegend ? "Tap 4 lanes" : p2Hint)
      : touchUi ? "Pad 2 · 4 lanes" : "Pad 2 · D-pad / face"],
  ];
  // Keyboard seats follow the physical left/right key clusters. Touch has no
  // such constraint, so keep the familiar P1 -> P2 reading order instead of
  // letting a saved keyboard preset put P2 first on a phone or tablet.
  const bothOnGamepads = p1GamepadIndex != null && p2GamepadIndex != null;
  const p2First = !touchUi && !bothOnGamepads && p2OnLeft;
  if (p2First) inputHints.reverse();

  const readySeats = inputHints;
  const seatGuide = (
    <p
      className={`unlock-hint duo-seat-hint${touchUi ? " duo-seat-hint-touch" : ""}${bothOnGamepads ? " duo-seat-hint-gamepad" : ""}`}
      aria-label={showTouchLegend
        ? "P1 plays the first board and P2 plays the second board. Each player taps their own four lanes."
        : undefined}
    >
      {readySeats.map(([who, hint], index) => (
        <span key={who}>
          <b>
            <span className="duo-seat-axis-wide">{index === 0 ? "Left" : "Right"}</span>
            <span className="duo-seat-axis-stacked">{index === 0 ? "Top" : "Bottom"}</span>
          </b> · {bothOnGamepads && touchUi ? hint : `${who} ${hint}`}
        </span>
      ))}
    </p>
  );

  const scoreCols: Array<["P1" | "P2", PlayResult]> = duoResult
    ? [
        ["P1", duoResult[0]],
        ["P2", duoResult[1]],
      ]
    : [];
  if (p2First) scoreCols.reverse();

  // Both fields as elements so the stage can flip their DOM order without
  // touching identity: React matches on `key`, so a flip moves the nodes
  // instead of remounting them (no lost session, no re-decode).
  const fieldP1 = (
    <LazyPlayField
      key={`p1-${track.track_id}-${tier}-${mode}-${runKey}`}
      district={track.district}
      chart={chart}
      audioUrl={assetUrl(track.audio)}
      mode={mode}
      statsRef={p1Stats}
      playerLabel="P1"
      keys={p1Keys}
      gamepadIndex={p1GamepadIndex ?? undefined}
      onGamepadPause={toggleDuoFromGamepad}
      onGamepadInterrupted={reportGamepadInterruption}
      startGate={startGate}
      onReady={armReady}
      hideStartOverlay
      onPauseChange={broadcastPause}
      onPauseStateChange={(paused) => {
        if (paused) markClockPaused();
        setRunPaused(paused);
      }}
      hidePauseOverlay
      pauseSync={pauseSync}
      suspended={confirmExit}
      audioRetrySync={audioRetrySync}
      onAudioLoadError={reportAudioLoadError}
      onAudioLoadProgress={reportAudioProgress}
      hideAudioLoadError
      hideAudioLoadingOverlay
      onFinish={finish(0)}
    />
  );
  const fieldP2 = (
    <LazyPlayField
      key={`p2-${track.track_id}-${tier}-${mode}-${runKey}`}
      district={track.district}
      chart={chart}
      audioUrl={assetUrl(track.audio)}
      mode={mode}
      statsRef={p2Stats}
      playerLabel="P2"
      keys={p2Keys}
      gamepadIndex={p2GamepadIndex ?? undefined}
      onGamepadPause={toggleDuoFromGamepad}
      onGamepadInterrupted={reportGamepadInterruption}
      muteMusic
      startGate={startGate}
      onReady={armReady}
      hideStartOverlay
      onPauseChange={broadcastPause}
      onPauseStateChange={(paused) => {
        if (paused) markClockPaused();
        setRunPaused(paused);
      }}
      hidePauseOverlay
      pauseSync={pauseSync}
      suspended={confirmExit}
      audioRetrySync={audioRetrySync}
      onAudioLoadError={reportAudioLoadError}
      hideAudioLoadError
      hideAudioLoadingOverlay
      onFinish={finish(1)}
    />
  );

  return (
    <section className="play-page duo-page">
      <div
        className="play-bg"
        aria-hidden
        style={{ backgroundImage: `url(${assetUrl(track.cover)})` }}
      />
      <div
        className="neon-layer"
        aria-hidden
        style={{ "--district-color": districtColor(track.district) } as React.CSSProperties}
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
      <div className="play-meta duo-meta">
        <h1 className="play-meta-heading">Duo {track.title}</h1>
        {/* 同 Play 页：X 坐最左，负责离开对局；Fullscreen 只退出沉浸显示。 */}
        <button ref={exitButtonRef} type="button" className="play-exit" onClick={exitDuo} aria-label="Exit the Scape">
          <span className="play-exit-visual" aria-hidden>
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </span>
        </button>
        <strong>{track.title}</strong>
        <span className="play-meta-tier" title={`DUO · ${tier} · ${mode}`}>
          <span className="play-meta-tier-full">DUO · {tier} · {mode}</span>
          <span className="play-meta-tier-compact" aria-hidden="true">{tier} · {mode}</span>
        </span>
        <span className="duo-keyhint" aria-hidden>
          {readySeats.map(([who, hint], i) => (
            <span key={who}>
              {i > 0 && <span className="duo-keyhint-sep">|</span>}
              <b>{who}</b> {hint}
            </span>
          ))}
        </span>
        <FullscreenButton enabled={touchUi} />
      </div>
      {/* 屏幕左右要跟键盘左右对上：用 WASD（左手区）的那个玩家坐左边，用
          方向键（右下角）的坐右边。否则两个人手是交叉的——右手边的人去够
          键盘左边的 WASD，左手边的人去够右下角的方向键，别扭且容易碰手。
          P1 / P2 的身份、计分、回调都跟着玩家走，交换的只是 DOM 顺序。 */}
      <div className="duo-stage">
        {p2First
          ? [fieldP2, fieldP1]
          : [fieldP1, fieldP2]}
      </div>

      {runPaused && !confirmExit && !duoResult && (
        <div
          ref={pauseDialogRef}
          className="duo-start duo-pause"
          role="dialog"
          aria-modal="true"
          aria-labelledby="duo-pause-title"
          aria-describedby="duo-pause-copy"
          onKeyDown={handlePauseKeyDown}
        >
          <div className="overlay-card">
            <p className="overlay-kicker">Both receivers holding</p>
            <p className="overlay-title" id="duo-pause-title">Duo paused</p>
            <p className="duo-pause-copy" id="duo-pause-copy">
              Both charts and audio are frozen. Resume starts one shared 3-second count-in.
              {p1GamepadIndex != null || p2GamepadIndex != null ? " Press Menu to resume." : ""}
            </p>
            {gamepadInterruption && (
              <p className="gamepad-interruption" role="status">
                <span aria-hidden>⌁</span>
                {gamepadInterruption}
              </p>
            )}
            <PauseAudioControls />
            <div className="duo-pause-actions">
              <button
                ref={pauseResumeButtonRef}
                type="button"
                className="btn primary"
                data-gamepad-default
                onClick={() => void resumeDuo()}
                disabled={resuming}
                aria-busy={resuming}
              >
                {resuming ? "Resuming…" : "Resume"}
              </button>
              <button
                ref={pauseRestartButtonRef}
                type="button"
                className="btn"
                onClick={resetDuo}
              >
                Restart duel
              </button>
              <button
                ref={pauseExitButtonRef}
                type="button"
                className="btn duo-pause-exit"
                onClick={exitDuo}
              >
                Leave duel
              </button>
            </div>
            {dialogGamepadIndexes.length > 0 && <GamepadDialogHint />}
            {resumeError && <p className="duo-start-error" role="alert">{resumeError}</p>}
          </div>
        </div>
      )}

      {audioLoadError && !gateOpen && !duoResult && (
        <div
          className="duo-start"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="duo-audio-error-title"
          onKeyDown={handleAudioErrorKeyDown}
        >
          <div className="overlay-card">
            <p className="overlay-kicker">Signal lost</p>
            <p className="overlay-title" id="duo-audio-error-title">Both receivers offline</p>
            <p className="duo-load-copy">
              {audioRetrying
                ? "Reconnecting both receivers…"
                : "We couldn't cue this track. Check your connection, then try both again."}
            </p>
            {audioRetrying && <AudioLoadProgress progress={audioProgress} />}
            <small className="load-error-detail">Support code: {audioLoadError}</small>
            <div className="audio-load-actions">
              <button
                ref={audioRetryButtonRef}
                type="button"
                className="btn primary"
                onClick={retryDuoAudio}
                disabled={audioRetrying}
                aria-busy={audioRetrying}
              >
                {audioRetrying ? "Reconnecting…" : "Retry both receivers"}
              </button>
              <button
                ref={audioBackButtonRef}
                type="button"
                className="btn"
                onClick={() => nav(track ? trackReturnHref : libraryReturnHref)}
              >
                Back to track
              </button>
            </div>
          </div>
        </div>
      )}

      {duoLoadingVisible && (
        <div
          ref={duoLoadingDialogRef}
          className="duo-start duo-loading"
          role="dialog"
          aria-modal="true"
          aria-labelledby="duo-loading-title"
          tabIndex={-1}
        >
          <div className="overlay-card">
            <p className="overlay-kicker">Loading</p>
            <p className="overlay-title" id="duo-loading-title">Preparing duel</p>
            <p className="duo-loading-copy">Check your seats while the song cues.</p>
            {seatGuide}
            <button type="button" className="btn primary unlock-btn" data-loading="true" disabled aria-busy="true">
              Loading song…
            </button>
            <AudioLoadProgress progress={audioProgress} />
            <button
              type="button"
              className="btn ghost duo-loading-back"
              onClick={() => nav(track ? trackReturnHref : libraryReturnHref)}
            >
              Back to track
            </button>
          </div>
        </div>
      )}

      {/* Ready card — shown once BOTH fields finished decoding. The real button
          is the only activation target: keyboard-safe and resistant to backdrop
          mis-taps. It unlocks audio + opens both fields in the same frame. */}
      {duoReadyVisible && (
        <div
          ref={duoStartDialogRef}
          className="duo-start"
          role="dialog"
          aria-modal="true"
          aria-labelledby="duo-ready-title"
        >
          <div className="overlay-card">
            <p className="overlay-kicker">Both receivers locked</p>
            <p className="overlay-title" id="duo-ready-title">Duel ready</p>
            <button
              ref={duoStartButtonRef}
              type="button"
              className="btn primary unlock-btn"
              data-gamepad-default
              onClick={() => void startDuo()}
              disabled={starting}
              aria-busy={starting}
            >
              {starting ? "Starting…" : "Start"}
            </button>
            {startError && <p className="duo-start-error" role="alert">{startError}</p>}
            {dialogGamepadIndexes.length > 0 && (
              <p
                className="unlock-gamepad-start duo-gamepad-start"
                data-ready={audioReadyForControllerStart}
                role="note"
                aria-label={audioReadyForControllerStart
                  ? "Duo controller start ready. Press the bottom face button to start or the right face button to return to the track."
                  : "Duo controller start unavailable until browser audio is unlocked. Activate Start once."}
              >
                {audioReadyForControllerStart
                  ? "Face down · Start · Face right · Back"
                  : `${touchUi ? "Tap" : "Click"} Start once · Browser audio`}
              </p>
            )}
            {seatGuide}
          </div>
        </div>
      )}

      {confirmExit && (
        <ExitGameDialog
          trackTitle={track.title}
          duo
          gamepadIndexes={dialogGamepadIndexes}
          onKeepPlaying={keepPlaying}
          onLeave={leaveDuo}
        />
      )}
      {duoResult && (
        <div
          ref={resultDialogRef}
          className="duo-result"
          role="dialog"
          aria-modal="true"
          aria-label="Duo results"
          aria-describedby="duo-result-title"
          onKeyDown={handleResultKeyDown}
        >
          <div className="overlay-card duo-result-card">
            <p className="overlay-kicker">Duo · {track.title}</p>
            <p className="overlay-title" id="duo-result-title">{outcome?.headline}</p>
            {outcome?.reason === "clear" && (
              <p className="duo-result-rule">CLEAR BEATS FAIL</p>
            )}
            <div className="duo-scoreline">
              {scoreCols.map(([who, r]) => {
                const player = who === "P1" ? "p1" : "p2";
                const isWinner = outcome?.winner === "draw" || outcome?.winner === player;
                return (
                  <div
                    className={`duo-scorecol${isWinner ? " is-winner" : ""}${r.failed ? " is-failed" : ""}`}
                    key={who}
                  >
                    {mode === "arcade" && (
                      <span className={`duo-scorecol-status ${r.failed ? "failed" : "cleared"}`}>
                        {r.failed ? "HP DEPLETED" : "CLEARED"}
                      </span>
                    )}
                    <span className="duo-scorecol-who">{who}</span>
                    <span className="duo-scorecol-grade">{r.grade}</span>
                    <span className="duo-scorecol-score">
                      <small>SCORE</small>
                      {r.score.toLocaleString("en-US")}
                    </span>
                    <span className="duo-scorecol-meta duo-scorecol-stats">
                      <span>ACC <strong>{formatDuoAccuracy(r.accuracy)}</strong></span>
                      <span>MAX <strong>x{r.maxCombo}</strong></span>
                    </span>
                    <span className="duo-scorecol-meta duo-scorecol-judgments">
                      <span>JUDGE <abbr title="Perfect / Great / Good / Miss">P/G/G/M</abbr></span>
                      <strong>{r.judgments.perfect}/{r.judgments.great}/{r.judgments.good}/{r.judgments.miss}</strong>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="duo-result-actions">
              <button ref={resultRematchButtonRef} type="button" className="btn primary" data-gamepad-default onClick={rematch}>
                Rematch
              </button>
              {/* 两边都打完了，没有可丢的 —— 不再拦一道确认。 */}
              <button ref={resultExitButtonRef} type="button" className="btn" onClick={leaveDuo}>
                Exit
              </button>
            </div>
            {dialogGamepadIndexes.length > 0 && <GamepadDialogHint backLabel="Exit" />}
          </div>
        </div>
      )}
    </section>
  );
}
