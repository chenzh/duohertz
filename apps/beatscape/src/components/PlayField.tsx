import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  ChallengeTarget,
  ChartJSON,
  PlayMode,
  PlayResult,
  PracticeAttemptSummary,
} from "../types/chart";
import type { RefObject } from "react";
import type { LiveScoreTarget, LiveStats } from "./playfield/liveStats";
import { Conductor, unlockAudio } from "../audio/playback";
import { getAudioContext } from "../audio/context";
import { playHit, playKeyTick, setSfxVolume } from "../audio/hitsounds";
import { playHapticCue, type HapticCue, type HapticTargets } from "../lib/haptics";
import { GameSession, type JudgeFx } from "../engine/playState";
import { approachSec } from "../engine/geometry";
import {
  isCoarsePointer,
  LaneInputTracker,
  laneFromClientX,
  laneFromTouchDrag,
  receptorYFromGeometry,
  type LaneInputTransition,
} from "../input/touchInput";
import { hasBrowserShortcutModifier, laneFromKeyEvent } from "../input/keyMap";
import { inputEventPerformanceTimeMs, songTimeAtInputMs } from "../input/eventTiming";
import {
  gamepadButtonIsPressed,
  laneFromStandardGamepadButton,
  pressedStandardGamepadButtons,
  STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON,
  STANDARD_GAMEPAD_MENU_BUTTON,
} from "../input/gamepadInput";
import { useKeyLabels } from "../input/useKeyLabels";
import { usePhysicalKeyboardInput } from "../input/usePhysicalKeyboardInput";
import { loadKeys, loadOffsetMs, loadSettings, saveSettings } from "../storage/settings";
import { useDeviceSettings } from "../storage/useDeviceSettings";
import { SCAPE_COPY, districtColor, JUDGE_COLORS, LANE_RGB } from "../constants/scape";
import { Link, useNavigate, useRouter } from "../router";
import { trackEvent } from "../lib/analytics";
import { calibrationHref } from "../lib/calibration";
import { chartMechanicGuides } from "../lib/runSetup";
import {
  approachMultiplierFromScrollBias,
  formatNoteSpeed,
  NOTE_SPEED_MAX,
  NOTE_SPEED_MIN,
  noteSpeedFromScrollBias,
  nudgeNoteSpeed,
  scrollBiasFromNoteSpeed,
} from "../lib/noteSpeed";
import { prefersReducedMotion } from "./playfield/canvasHelpers";
import { createPlayfieldRenderer } from "./playfield/renderLoop";
import { useDevQaParams } from "./playfield/useDevQaParams";
import { PlayHud } from "./playfield/PlayHud";
import type { Fx, ScorePop } from "./playfield/renderLoop";
import { ScoreStreak, SurgeMeter, type SurgeTier } from "../engine/surge";
import {
  exitGameFullscreen,
  FULLSCREEN_CHANGE_EVENTS,
  gameFullscreenElement,
  requestGameFullscreen,
} from "../lib/fullscreen";
import { cycleModalFocus } from "../lib/modalFocus";
import { PauseAudioControls } from "./PauseAudioControls";
import { PracticeTempoPicker } from "./PracticeTempoPicker";
import { GamepadDialogHint } from "./GamepadDialogHint";
import { audioLoadSupportCode, type AudioLoadSupportCode } from "../audio/audioLoadIssue";
import type { AudioLoadProgress as AudioProgress } from "../audio/earlyAudio";
import { AudioLoadProgress } from "./AudioLoadProgress";
import { loadRuns } from "../lib/progress";
import { useGamepadDialogNavigation } from "../input/useGamepadDialogNavigation";
import { normalizePracticeRepetitions } from "../lib/practiceDrill";
import type { PracticeTempo } from "../lib/practiceTempo";

const COUNTDOWN_MS = 3000;
const GAMEPAD_LANE_HINT = ["◀", "▼", "▲", "▶"];

type DrillRecap = {
  completedRepetition: number;
  nextRepetition: number;
  totalRepetitions: number;
  accuracy: number;
  misses: number;
};

type Props = {
  chart: ChartJSON;
  audioUrl: string;
  mode: PlayMode;
  /** Untrusted-but-sanitized friendly target carried by a cross-device share URL. */
  challengeTarget?: ChallengeTarget;
  /** Validated device-local Arcade record captured before this run starts. */
  personalBest?: { score: number; accuracy: number };
  /** UTC date of a validated Daily route; absent for forged or stale query flags. */
  dailyDateKey?: string;
  /** Absolute chart time for a section-practice retry. Ignored outside Practice. */
  startAtMs?: number;
  /** Exclusive chart-time end for a bounded section-practice retry. */
  endAtMs?: number;
  /** Number of automatic passes through a bounded practice section. */
  practiceRepetitions?: number;
  /** Reports the current automatic practice pass for page-level context. */
  onPracticeRepetitionChange?: (repetition: number) => void;
  onStart?: () => void;
  onFinish: (result: PlayResult) => void;
  /** Home hero embed — no immersive chrome / fullscreen. */
  variant?: "full" | "hero";
  /** When true, music + SFX stay silent (home default). */
  muted?: boolean;
  /** Skip unlock overlay and start as soon as audio is ready (user gesture already unlocked audio). */
  autoStart?: boolean;
  /** District key (e.g. "Pulse Core") — ties the field's beat-wash + watermark to the track's character. */
  district?: string;
  /**
   * B-1 · Optional live-stats bridge. When provided, PlayField runs a
   * low-frequency (~20Hz) rAF that copies sessionRef/surgeTierRef into it so a
   * comic-panel HUD can read the values without ever re-rendering React.
   */
  statsRef?: RefObject<LiveStats>;
  /** First Shift · surface a receptor-line rescue after three opening misses. */
  openingCoach?: boolean;
  /** Optional player-facing context for the ready card, e.g. a First Shift node. */
  startContext?: string;
  /**
   * B-1 · When true, the renderer's built-in score / accuracy / SIGNAL-gauge
   * panels are skipped so the comic-panel PlayHud is the single source of
   * truth for the score row. Defaults to `!!statsRef` — passing a statsRef
   * implies the PlayHud is mounted, so the canvas HUD must step aside.
   */
  useComicHud?: boolean;
  // --- Duo mode (PRD-extra) — all optional, single-player call sites unchanged ---
  /**
   * Duo · Lane key binding for THIS field. Defaults to the saved keys
   * (`loadKeys`). In duo mode P1 keeps the saved binding and P2 gets the
   * opposite-hand preset so both players can share one keyboard.
   * Must be a stable array reference (the caller memoizes it).
   */
  keys?: string[];
  /**
   * Browser Gamepad API index assigned to this field. Only controllers with a
   * W3C `standard` mapping are assigned; keyboard and touch stay active.
   */
  gamepadIndex?: number;
  /** Duo parent hook for controller Menu pause/resume ownership. */
  onGamepadPause?: () => void;
  /** Duo parent hook for a controller disappearing or changing mid-run. */
  onGamepadInterrupted?: (message: string) => void;
  /** Duo · Short label rendered in the HUD capsule (e.g. "P1" / "P2"). */
  playerLabel?: string;
  /** Appended to the field's own `.play-wrap` classes (duo side-swap uses it). */
  className?: string;
  /**
   * Duo · Mute the MUSIC bus only — hit SFX keep playing. Two fields decoding
   * and playing the same track simultaneously would layer it on itself with
   * the decode skew as a delay, which reads as a flanger / echo artefact. So
   * in duo mode P1 carries the music and shared count-in cues while P2 runs
   * silent for those global sounds; both players still hear their own judgment
   * hitsounds.
   */
  muteMusic?: boolean;
  /**
   * Duo · Start gate counter. The parent bumps it once EVERY field has
   * finished decoding audio, so both conductors `begin()` in the same React
   * commit — i.e. the same frame. Letting each field auto-start on its own
   * would skew the two charts by however much one decode took longer.
   * 0 / undefined = no gate (normal single-player behaviour).
   */
  startGate?: number;
  /** Duo · Fired once this field's audio is decoded and it is armed. */
  onReady?: () => void;
  /**
   * Duo · Suppress this field's own "tap to enter" overlay. In duo mode the
   * parent owns the start gesture (one click starts BOTH fields via
   * `startGate`), so the per-field unlock card would just be noise.
   */
  hideStartOverlay?: boolean;
  /**
   * Duo · Pause broadcasting. When provided, this field no longer toggles its
   * own pause on Esc / P / the pause button / tab-hide — it just calls this
   * callback and lets the parent broadcast `pauseSync` so BOTH fields switch
   * together. Without it (single player) behaviour is unchanged.
   */
  onPauseChange?: () => void;
  /** Reports the field's settled pause state to page-level run services. */
  onPauseStateChange?: (paused: boolean) => void;
  /** Single player · Opens the page-owned leave confirmation from the pause dialog. */
  onExitRequest?: () => void;
  /** Duo · Hide this field's duplicate pause card behind the parent's shared dialog. */
  hidePauseOverlay?: boolean;
  /**
   * Duo · Pause broadcast counter. Every bump toggles this field's pause.
   * The parent bumps once per user action (debounced when both fields report
   * the same tab-hide), so both sides flip in lockstep and stay in sync.
   */
  pauseSync?: number;
  /** A parent dialog freezes audio and input without changing the user's pause state. */
  suspended?: boolean;
  /** Duo · Parent-owned retry counter; one bump restarts both receivers together. */
  audioRetrySync?: number;
  /** Duo · Report terminal audio failure so the parent can show one shared dialog. */
  onAudioLoadError?: (supportCode: AudioLoadSupportCode) => void;
  /** Duo · Reports the shared download to the page-owned loading card. */
  onAudioLoadProgress?: (progress: AudioProgress) => void;
  /** Duo · Hide this field's duplicate error card behind the shared dialog. */
  hideAudioLoadError?: boolean;
  /** Duo · The parent shows one shared loading card for both fields. */
  hideAudioLoadingOverlay?: boolean;
};

export function PlayField({
  chart,
  audioUrl,
  mode,
  challengeTarget,
  personalBest,
  dailyDateKey,
  startAtMs,
  endAtMs,
  practiceRepetitions,
  onPracticeRepetitionChange,
  onStart,
  onFinish,
  variant = "full",
  muted = false,
  autoStart = false,
  district,
  statsRef,
  openingCoach = false,
  startContext,
  useComicHud,
  keys: keysProp,
  gamepadIndex,
  onGamepadPause,
  onGamepadInterrupted,
  playerLabel,
  className,
  muteMusic = false,
  startGate,
  onReady,
  hideStartOverlay = false,
  onPauseChange,
  onPauseStateChange,
  onExitRequest,
  hidePauseOverlay = false,
  pauseSync,
  suspended = false,
  audioRetrySync = 0,
  onAudioLoadError,
  onAudioLoadProgress,
  hideAudioLoadError = false,
  hideAudioLoadingOverlay = false,
}: Props) {
  const { path, search } = useRouter();
  const nav = useNavigate();
  const timingHref = calibrationHref(`${path}${search}`);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const conductorRef = useRef<Conductor | null>(null);
  const sessionRef = useRef<GameSession | null>(null);
  const pressedRef = useRef<Set<number>>(new Set());
  const inputTrackerRef = useRef(new LaneInputTracker());
  const gamepadPollRef = useRef<((frameTimeMs: number) => void) | null>(null);
  const clearActiveInputs = () => {
    inputTrackerRef.current.clear();
    pressedRef.current.clear();
    sessionRef.current?.clearHeldInputs();
  };
  const fxRef = useRef<Fx[]>([]);
  const finishedRef = useRef(false);
  const failureRef = useRef<HTMLDivElement>(null);
  const seenComboBreaksRef = useRef(0);
  const lastCountInt = useRef<number>(-1);
  const offsetMsRef = useRef(0);
  const approachRef = useRef(1);
  const lastNoteMsRef = useRef(0);
  const laneFlashRef = useRef<number[]>([0, 0, 0, 0]);
  // B-1 · The HUD-bypass flag is read inside the canvas rAF. Caching it in a
  // ref keeps the render loop's effect dep stable — otherwise toggling the
  // comic HUD on/off mid-run would tear down the whole rAF (and the
  // pre-rendered halftone + note sprites), causing a visible frame drop.
  const useComicHudRef = useRef(useComicHud ?? !!statsRef);
  useComicHudRef.current = useComicHud ?? !!statsRef;
  const spritesRef = useRef<HTMLCanvasElement[]>([]);
  const dimRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  // --- juice: particles / screen shake / combo milestone ---
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; born: number; life: number; r: number; g: number; b: number; size: number }>>([]);
  const shakeRef = useRef<{ mag: number; until: number }>({ mag: 0, until: 0 });
  const milestoneRef = useRef<{ text: string; born: number } | null>(null);
  const scorePopsRef = useRef<ScorePop[]>([]);
  const comboBreakRef = useRef(0);
  const prevComboRef = useRef(0);
  // --- SIGNAL atmosphere layer (research: docs/BEATSCAPE-SURGE-FX.md) ---
  const surgeRef = useRef(new SurgeMeter());
  const streakRef = useRef(new ScoreStreak());
  const prevNeonRef = useRef(0);
  const surgeTierRef = useRef<SurgeTier>(0);
  const lastEffMsRef = useRef(0);
  const ringsRef = useRef<number[]>([]);
  const surgeDropRef = useRef(0);
  const halftonePatRef = useRef<CanvasPattern | null>(null);
  const raysRef = useRef<HTMLCanvasElement | null>(null);
  const ringSpriteRef = useRef<HTMLCanvasElement | null>(null);
  // --- LIGHTING rig (docs/BEATSCAPE-SURGE-FX.md §2.4): combo-driven stage light ---
  const colsRef = useRef<Array<{ born: number; lane: number }>>([]);
  const sweepsRef = useRef<Array<{ born: number; corner: number }>>([]);
  const lastLaneRef = useRef(0);
  const lightComboPrevRef = useRef(0);
  const lastShowBarRef = useRef(-1);
  const fullscreenWasActiveRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const finishCycleRef = useRef<(result: PlayResult) => void>(() => {});
  const onPracticeRepetitionChangeRef = useRef(onPracticeRepetitionChange);
  onPracticeRepetitionChangeRef.current = onPracticeRepetitionChange;
  // Duo · Kept in a ref so a new inline `onReady` closure from the parent does
  // NOT re-run the audio-load effect below (which would re-decode the track).
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  // Duo · Same trick for the pause broadcast: stable ref, no effect churn.
  const onPauseChangeRef = useRef(onPauseChange);
  onPauseChangeRef.current = onPauseChange;
  const onGamepadPauseRef = useRef(onGamepadPause);
  onGamepadPauseRef.current = onGamepadPause;
  const onGamepadInterruptedRef = useRef(onGamepadInterrupted);
  onGamepadInterruptedRef.current = onGamepadInterrupted;
  const onPauseStateChangeRef = useRef(onPauseStateChange);
  onPauseStateChangeRef.current = onPauseStateChange;
  const onAudioLoadErrorRef = useRef(onAudioLoadError);
  onAudioLoadErrorRef.current = onAudioLoadError;
  const onAudioLoadProgressRef = useRef(onAudioLoadProgress);
  onAudioLoadProgressRef.current = onAudioLoadProgress;

  const sectionPractice = mode === "practice" && startAtMs !== undefined && Number.isFinite(startAtMs);
  const sectionStartMs = sectionPractice
    ? Math.max(0, startAtMs)
    : 0;
  const sectionEndMs = sectionPractice && Number.isFinite(endAtMs) && (endAtMs ?? 0) > sectionStartMs
    ? endAtMs
    : undefined;
  const practiceRepetitionTotal = normalizePracticeRepetitions(
    practiceRepetitions,
    sectionEndMs !== undefined,
  );
  const practiceRepetitionRef = useRef(1);
  const practiceAttemptsRef = useRef<PracticeAttemptSummary[]>([]);

  const [settings, setSettings] = useState(loadSettings);
  const startKicker = variant === "hero"
    ? SCAPE_COPY.heroPlayKicker
    : startContext
      ?? (mode === "practice"
        ? practiceRepetitionTotal > 1
          ? `${practiceRepetitionTotal}-rep drill`
          : sectionPractice ? "Section practice" : SCAPE_COPY.practiceRun
        : mode === "arcade"
          ? SCAPE_COPY.arcadeRun
          : SCAPE_COPY.runReady);
  // Pause-menu mix and accessibility controls are live during a run. Note
  // speed and thumb assist may change while this field is ready or frozen;
  // active judging keeps its current geometry/settings until Pause gives the
  // player a safe 3-second re-entry. Timing offset stays locked once started.
  const liveAudioSettings = useDeviceSettings();
  // Stable reference: the keyboard effect below keys off this array.
  // Duo · `keysProp` overrides it (P2 gets its own binding). Both hooks run
  // unconditionally so the hook order stays fixed across renders; the caller
  // memoizes keysProp so the reference is stable.
  const savedKeys = useMemo(loadKeys, []);
  const keys = keysProp ?? savedKeys;
  const keyHint = useKeyLabels(keys);
  const keyHintJoined = useMemo(() => keyHint.join(" · "), [keyHint]);
  const pauseKeyIsLane = keys.includes("KeyP");
  const restartKeyIsLane = keys.includes("KeyR");
  const liveLaneHint = gamepadIndex === undefined ? keyHint : GAMEPAD_LANE_HINT;
  const persistentKeyHints = useMemo(() => (
    variant === "hero"
    || Boolean(playerLabel)
    || mode === "practice"
    || loadRuns().length < 3
  ), [mode, playerLabel, variant]);
  const liveScoreTarget = useMemo<LiveScoreTarget | undefined>(() => {
    if (challengeTarget) return { kind: "challenge", score: challengeTarget.score };
    if (personalBest) return { kind: "personal-best", score: personalBest.score };
    return undefined;
  }, [challengeTarget?.score, personalBest?.score]);
  // Dev-only visual-QA URL params (?surge / ?autostart / ?streak|?combo),
  // compiled out of production builds — extracted to keep PlayField focused.
  const { demoSurge, devAutoStart, demoStreak } = useDevQaParams();

  const [loading, setLoading] = useState(true);
  const [audioProgress, setAudioProgress] = useState<AudioProgress | null>(null);
  const [error, setError] = useState("");
  const [audioRetryAttempt, setAudioRetryAttempt] = useState(0);
  const loadRetryButtonRef = useRef<HTMLButtonElement>(null);
  const loadBackButtonRef = useRef<HTMLButtonElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const pauseButtonRef = useRef<HTMLButtonElement>(null);
  const pauseResumeButtonRef = useRef<HTMLButtonElement>(null);
  const pauseRestartButtonRef = useRef<HTMLButtonElement>(null);
  const pauseExitButtonRef = useRef<HTMLButtonElement>(null);
  const pauseDialogRef = useRef<HTMLDivElement>(null);
  const pauseDialogWasOpenRef = useRef(false);
  const focusStartAfterLoadRef = useRef(false);
  const [needsStart, setNeedsStart] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [noteSpeedSaveFailed, setNoteSpeedSaveFailed] = useState(false);
  const startingRef = useRef(false);
  const [audioReadyForControllerStart, setAudioReadyForControllerStart] = useState(false);
  const audioReadyForControllerStartRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [gamepadInterruption, setGamepadInterruption] = useState("");
  const [drillRecap, setDrillRecap] = useState<DrillRecap | null>(null);
  const [practiceTempo, setPracticeTempo] = useState<PracticeTempo>(1);
  const practiceTempoRef = useRef<PracticeTempo>(1);
  const previousGamepadIndexRef = useRef(gamepadIndex);
  const gamepadWasInterruptedRef = useRef(false);
  const resumingRef = useRef(false);
  const pauseDialogVisible = paused && !hidePauseOverlay && !suspended;
  const pauseGamepadIndexes = useMemo(
    () => gamepadIndex === undefined ? [] : [gamepadIndex],
    [gamepadIndex],
  );
  useEffect(() => {
    const context = getAudioContext();
    const sync = () => {
      const ready = String(context.state) === "running";
      audioReadyForControllerStartRef.current = ready;
      setAudioReadyForControllerStart(ready);
    };
    sync();
    context.addEventListener("statechange", sync);
    return () => context.removeEventListener("statechange", sync);
  }, []);
  useEffect(() => {
    onPauseStateChangeRef.current?.(paused);
  }, [paused]);

  const changePracticeTempo = (tempo: PracticeTempo) => {
    if (mode !== "practice") return;
    practiceTempoRef.current = tempo;
    setPracticeTempo(tempo);
    conductorRef.current?.setBaseRate(tempo);
    trackEvent("practice_tempo_change", { tempo });
  };
  useEffect(() => {
    if (pauseDialogVisible) {
      pauseDialogWasOpenRef.current = true;
      pauseResumeButtonRef.current?.focus();
      return;
    }
    // Keep the marker while the page-owned exit confirmation temporarily
    // covers a manually paused run. If the player cancels, Resume takes focus
    // again; only an actual resume/restart returns focus to the HUD control.
    if (!paused && pauseDialogWasOpenRef.current) {
      pauseDialogWasOpenRef.current = false;
      pauseButtonRef.current?.focus();
    }
  }, [pauseDialogVisible, paused]);
  useEffect(() => {
    if (error && !hideAudioLoadError) loadRetryButtonRef.current?.focus();
  }, [error, hideAudioLoadError]);
  useEffect(() => {
    if (
      focusStartAfterLoadRef.current
      && !loading
      && !error
      && needsStart
      && !autoStart
      && !hideStartOverlay
    ) {
      focusStartAfterLoadRef.current = false;
      startButtonRef.current?.focus();
    }
  }, [loading, error, needsStart, autoStart, hideStartOverlay]);
  // 开始前的声音自检：点过一次就把按钮标成"已确认有声"。
  const [soundChecked, setSoundChecked] = useState(false);
  const [soundChecking, setSoundChecking] = useState(false);
  const [soundCheckError, setSoundCheckError] = useState("");
  const soundCheckingRef = useRef(false);
  // Eligibility is attached to each real touch press below, rather than to the
  // whole device. A Surface-style coarse-pointer device may still be played by
  // keyboard, and those key hits must never receive two-thumb scoring help.
  const [touchUi] = useState(isCoarsePointer);
  const physicalKeyboardSeen = usePhysicalKeyboardInput();
  const showTouchLegend = touchUi && !physicalKeyboardSeen;
  const showLiveKeyHintsRef = useRef(!touchUi || physicalKeyboardSeen);
  showLiveKeyHintsRef.current = !touchUi || physicalKeyboardSeen;
  const chordAssistRef = useRef(settings.chordAssist);

  // A phone rotation rebuilds the usable viewport while the OS animates and
  // the player moves both thumbs. Letting the audio clock continue through
  // that transition creates unavoidable misses. Pause only when the viewport
  // truly crosses portrait/landscape, not for browser-chrome or desktop window
  // resizes. The existing Resume path supplies the safe 3-second re-entry.
  // Duo fields both report the same resize; the parent collapses them into one
  // pauseSync bump so the two conductors remain locked together.
  useEffect(() => {
    if (variant !== "full" || !touchUi) return;
    const orientation = () => window.innerWidth > window.innerHeight ? "landscape" : "portrait";
    let previous = orientation();
    const onResize = () => {
      const next = orientation();
      if (next === previous) return;
      previous = next;
      if (
        needsStartRef.current
        || pausedRef.current
        || suspendedRef.current
        || finishedRef.current
      ) return;
      const conductor = conductorRef.current;
      if (!conductor?.playing) return;
      clearActiveInputs();
      if (onPauseChangeRef.current) onPauseChangeRef.current();
      else {
        conductor.pause();
        setPaused(true);
      }
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [touchUi, variant]);

  const noteSpeed = noteSpeedFromScrollBias(settings.scrollBias);
  useEffect(() => {
    if (!needsStart && !paused) return;
    const scrollBias = liveAudioSettings.scrollBias;
    setSettings((current) => (
      Object.is(current.scrollBias, scrollBias)
        ? current
        : { ...current, scrollBias }
    ));
  }, [liveAudioSettings.scrollBias, needsStart, paused]);
  useEffect(() => {
    if (!needsStart && !paused) return;
    chordAssistRef.current = liveAudioSettings.chordAssist;
    sessionRef.current?.setChordAssist(liveAudioSettings.chordAssist);
  }, [liveAudioSettings.chordAssist, needsStart, paused]);
  const changeNoteSpeed = (direction: -1 | 1) => {
    if (!needsStart || starting) return;
    const nextSpeed = nudgeNoteSpeed(noteSpeed, direction);
    const scrollBias = scrollBiasFromNoteSpeed(nextSpeed);
    setSettings((current) => ({ ...current, scrollBias }));
    setNoteSpeedSaveFailed(!saveSettings({ scrollBias }));
    trackEvent("note_speed_ready_change", { noteSpeed: nextSpeed });
  };
  // Scroll speed changes only approach geometry. Updating it before Start must
  // not tear down the decoded track or reconstruct the conductor/session.
  useEffect(() => {
    approachRef.current = approachSec(
      chart.ar,
      chart.bpm,
      approachMultiplierFromScrollBias(settings.scrollBias),
    );
  }, [chart.ar, chart.bpm, settings.scrollBias]);
  const mechanicGuides = useMemo(
    () => variant === "full"
      ? chartMechanicGuides(chart, showTouchLegend && gamepadIndex === undefined ? "touch" : "press")
      : [],
    [chart, gamepadIndex, showTouchLegend, variant],
  );
  const needsStartRef = useRef(needsStart);
  const pausedRef = useRef(paused);
  const suspendedRef = useRef(suspended);
  needsStartRef.current = needsStart;
  pausedRef.current = paused || suspended;
  suspendedRef.current = suspended;

  // A drill changes sessions inside the same page, so the player needs one
  // explicit hand-off between attempts. Keep the recap for exactly the safe
  // count-in (including a paused count-in) and remove it when live judging
  // resumes. This adds feedback without extending the drill by another gate.
  useEffect(() => {
    if (!drillRecap) return;
    let frame = 0;
    const watchCountIn = () => {
      const conductor = conductorRef.current;
      if (
        !conductor
        || needsStartRef.current
        || finishedRef.current
        || conductor.countdownRemainingMs <= 0
      ) {
        setDrillRecap(null);
        return;
      }
      frame = requestAnimationFrame(watchCountIn);
    };
    frame = requestAnimationFrame(watchCountIn);
    return () => cancelAnimationFrame(frame);
  }, [drillRecap]);

  // Losing the controller that owns this field must never turn into a stream
  // of unavoidable misses. Freeze the run (or the whole Duo through the
  // parent broadcast), release held lanes, and explain the keyboard/touch
  // fallback. A replacement controller may take the same seat, but resuming
  // remains an explicit player decision with the normal safe count-in.
  useEffect(() => {
    const previous = previousGamepadIndexRef.current;
    previousGamepadIndexRef.current = gamepadIndex;
    if (previous === gamepadIndex) return;

    const subject = playerLabel ? `${playerLabel} controller` : "Controller";
    if (previous !== undefined) {
      if (needsStartRef.current || finishedRef.current) {
        gamepadWasInterruptedRef.current = false;
        setGamepadInterruption("");
        return;
      }
      gamepadWasInterruptedRef.current = true;
      const message = gamepadIndex === undefined
        ? `${subject} disconnected. Keyboard and touch stay active.`
        : `${subject} changed. A replacement pad is ready.`;
      setGamepadInterruption(message);
      onGamepadInterruptedRef.current?.(message);

      if (
        paused
      ) return;
      const conductor = conductorRef.current;
      if (!conductor) return;
      clearActiveInputs();
      if (onPauseChangeRef.current) onPauseChangeRef.current();
      else {
        conductor.pause();
        pausedRef.current = true;
        setPaused(true);
      }
      return;
    }

    if (gamepadIndex !== undefined && gamepadWasInterruptedRef.current) {
      const message = `${subject} reconnected. Resume when ready.`;
      setGamepadInterruption(message);
      onGamepadInterruptedRef.current?.(message);
    }
    // Mutable gameplay refs deliberately avoid re-subscribing this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamepadIndex, playerLabel]);

  // Leaving fullscreen via a browser/system gesture does not necessarily hide
  // the document, so visibilitychange cannot protect the run. Pause here before
  // the player collects misses behind browser chrome. Duo reports from both
  // fields collapse through the parent's existing broadcast debounce.
  useEffect(() => {
    if (variant !== "full") return;
    const syncFullscreen = () => {
      const active = gameFullscreenElement() !== null;
      if (active) {
        fullscreenWasActiveRef.current = true;
        return;
      }
      // Some engines resolve an explicit exit before React observes the entry
      // event. An inactive fullscreen-change during a live run is still an
      // exit transition and must freeze the chart before browser chrome can
      // swallow inputs. The initial inactive sync is harmless because the run
      // still has its start gate up.
      fullscreenWasActiveRef.current = false;
      if (
        needsStartRef.current
        || pausedRef.current
        || suspendedRef.current
        || finishedRef.current
      ) return;
      const conductor = conductorRef.current;
      if (!conductor) return;
      clearActiveInputs();
      if (onPauseChangeRef.current) onPauseChangeRef.current();
      else {
        conductor.pause();
        setPaused(true);
      }
    };
    syncFullscreen();
    for (const event of FULLSCREEN_CHANGE_EVENTS) document.addEventListener(event, syncFullscreen);
    return () => {
      for (const event of FULLSCREEN_CHANGE_EVENTS) document.removeEventListener(event, syncFullscreen);
    };
  }, [variant]);
  // 这些开关由 rAF / input listeners 读取，所以走 ref 而不是闭包：
  //   · 写进 rAF effect 的依赖 → 中途改音量/音色会销毁重建整个循环，连带重跑
  //     sprite 预渲染和 halftone 图案，玩家看到一次明显卡帧；
  //   · 不写进依赖、直接读 settings.xxx → 读到的是 effect 上次运行时的过期值
  //     （监听器会保留启动时的闭包）。
  const mutedRef = useRef(muted);
  const muteMusicRef = useRef(muteMusic);
  const hitsoundRef = useRef(liveAudioSettings.hitsound);
  const backgroundDimRef = useRef(liveAudioSettings.backgroundDim);
  const hapticsRef = useRef(liveAudioSettings.haptics);
  const fancyFxRef = useRef(settings.fancyFx);
  // Keep the in-app preference live without rebuilding the renderer. Canvas
  // combines it with the cached system media query on every frame so an OS
  // change during a run is honored immediately in both directions.
  const reduceMotionRef = useRef(liveAudioSettings.reduceMotion);
  reduceMotionRef.current = liveAudioSettings.reduceMotion;
  mutedRef.current = muted;
  muteMusicRef.current = muteMusic;
  hitsoundRef.current = liveAudioSettings.hitsound;
  backgroundDimRef.current = liveAudioSettings.backgroundDim;
  hapticsRef.current = liveAudioSettings.haptics;
  fancyFxRef.current = settings.fancyFx;
  const hapticTargetsRef = useRef<HapticTargets>({ touch: touchUi, gamepadIndex });
  hapticTargetsRef.current.touch = touchUi;
  hapticTargetsRef.current.gamepadIndex = gamepadIndex;
  const emitHaptic = (cue: HapticCue) => {
    if (!hapticsRef.current || mutedRef.current) return;
    playHapticCue(cue, hapticTargetsRef.current);
  };

  // Immersive: hide site chrome while playing (full page only). Also owns the
  // viewport NEON level attribute — cleaned up on unmount.
  useEffect(() => {
    if (variant !== "full") return;
    document.documentElement.classList.add("play-immersive");
    document.body.classList.add("play-immersive");
    return () => {
      document.documentElement.classList.remove("play-immersive");
      document.body.classList.remove("play-immersive");
      delete document.body.dataset.neon;
    };
  }, [variant]);

  // Keep the CSS motion layer in lockstep with the live Canvas ref. This is a
  // safety control: changing it while paused must take effect before Resume,
  // without rebuilding the renderer or restarting the authoritative clock.
  useEffect(() => {
    if (variant !== "full") return;
    if (liveAudioSettings.reduceMotion) document.body.dataset.reduceMotion = "1";
    else delete document.body.dataset.reduceMotion;
    return () => {
      delete document.body.dataset.reduceMotion;
    };
  }, [variant, liveAudioSettings.reduceMotion]);

  // B-1 · Low-frequency (~20Hz) stats bridge. Copies the live session + SIGNAL
  // tier into `statsRef` so the comic-panel HUD can read it on its own rAF
  // without ever forcing a React re-render of the canvas game loop. Writes a
  // plain ref object — no setState, no per-frame churn.
  useEffect(() => {
    if (!statsRef) return;
    let raf = 0;
    let prev = 0;
    const STEP = 50; // ~20Hz
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - prev < STEP) return;
      prev = t;
      const s = sessionRef.current;
      if (!s) return;
      const out = statsRef.current;
      if (!out) return;
      out.score = s.score;
      out.combo = s.combo;
      out.maxCombo = s.maxCombo;
      out.hp = s.hp;
      out.perfect = s.judgments.perfect;
      out.great = s.judgments.great;
      out.good = s.judgments.good;
      out.miss = s.judgments.miss;
      out.judged = s.judgments.perfect + s.judgments.great + s.judgments.good + s.judgments.miss;
      out.total = s.totalNotes;
      out.surgeTier = surgeTierRef.current;
      const conductor = conductorRef.current;
      out.playbackRate = conductor?.playbackRate ?? 1;
      out.rateRemainingMs = conductor?.rateRemainingMs ?? 0;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [statsRef]);

  // Load audio + build the session once per chart.
  useEffect(() => {
    let cancelled = false;
    setAudioProgress(null);
    finishedRef.current = false;
    seenComboBreaksRef.current = 0;
    prevComboRef.current = 0;
    lastCountInt.current = -1;
    fxRef.current = [];
    clearActiveInputs();
    surgeRef.current.reset();
    streakRef.current.reset();
    prevNeonRef.current = 0;
    surgeTierRef.current = 0;
    lastEffMsRef.current = 0;
    ringsRef.current = [];
    surgeDropRef.current = 0;
    colsRef.current = [];
    sweepsRef.current = [];
    lastLaneRef.current = 0;
    lightComboPrevRef.current = 0;
    lastShowBarRef.current = -1;
    if (wrapRef.current) wrapRef.current.dataset.surge = "0";

    const conductor = new Conductor();
    // Initial bus levels; live mute toggles via the effect below.
    // 走 ref 读 muted，好让音量相关设置不必进依赖（见下面的 deps 注释）。
    conductor.setMusicVolume(
      mutedRef.current || muteMusicRef.current ? 0 : liveAudioSettings.musicVolume,
    );
    setSfxVolume(
      mutedRef.current || !liveAudioSettings.hitsound ? 0 : liveAudioSettings.sfxVolume,
    );
    conductorRef.current = conductor;
    const session = new GameSession(chart, mode, {
      chordAssist: chordAssistRef.current,
      startAtMs: sectionStartMs,
      endAtMs: sectionEndMs,
      sectionPractice,
    });
    sessionRef.current = session;

    approachRef.current = approachSec(
      chart.ar,
      chart.bpm,
      approachMultiplierFromScrollBias(settings.scrollBias),
    );
    offsetMsRef.current = loadOffsetMs() + (chart.audio_offset_ms || 0);
    const judgedThroughMs = Math.max(...session.notes.map((n) => n.endMs), 0) + 500;
    lastNoteMsRef.current = sectionEndMs === undefined
      ? judgedThroughMs
      : Math.max(sectionEndMs, judgedThroughMs);

    conductor.onEnded = () => {
      // handled in the rAF loop; kept as a safety net
    };

    void (async () => {
      try {
        await conductor.load(audioUrl, (progress) => {
          if (cancelled) return;
          if (!hideAudioLoadingOverlay) {
            setAudioProgress((previous) => {
              if (progress.phase === "decode") return previous?.phase === "decode" ? previous : progress;
              if (previous?.phase === "download" && previous.totalBytes === progress.totalBytes) {
                const before = previous.totalBytes === null ? null : Math.floor(previous.loadedBytes / previous.totalBytes * 100);
                const after = progress.totalBytes === null ? null : Math.floor(progress.loadedBytes / progress.totalBytes * 100);
                if (before === after) return previous;
              }
              return progress;
            });
          }
          onAudioLoadProgressRef.current?.(progress);
        });
        if (cancelled) return;
        setLoading(false);
        setNeedsStart(true);
        // Duo · Tell the parent this field is armed. The parent counts these
        // and bumps `startGate` only once every field is ready.
        onReadyRef.current?.();
      } catch (e) {
        if (!cancelled) {
          const supportCode = audioLoadSupportCode(e);
          setLoading(false);
          setError(supportCode);
          onAudioLoadErrorRef.current?.(supportCode);
        }
      }
    })();

    return () => {
      cancelled = true;
      // dispose() 而不是 stop()：stop() 只停音源、保留整条 gain/filter/analyser
      // 播放链（那是为了能恢复播放）。离开对局时整条链都要断开，否则每次挂载
      // 都泄漏一套节点，而且音量设置一变就会再泄漏一套。
      conductor.dispose();
      conductorRef.current = null;
      sessionRef.current = null;
      clearActiveInputs();
    };
    // 依赖里刻意不含 settings.musicVolume / sfxVolume / hitsound / muted：
    // 它们属于"实时生效"的音量，由下面那个 effect 直接作用在当前 conductor 上。
    // 放进依赖的话，改一次音量就会重跑这里 —— 重新 new Conductor + 重新 fetch
    // 并解码整段音频，玩家在对局中途调音量会直接被丢回加载态。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, mode, audioUrl, sectionPractice, sectionStartMs, sectionEndMs, audioRetryAttempt, audioRetrySync]);

  // Live mute toggle (home sound button) without remounting the chart.
  useEffect(() => {
    const conductor = conductorRef.current;
    if (!conductor) return;
    conductor.setMusicVolume(muted || muteMusic ? 0 : liveAudioSettings.musicVolume);
    setSfxVolume(muted || !liveAudioSettings.hitsound ? 0 : liveAudioSettings.sfxVolume);
  }, [
    muted,
    muteMusic,
    liveAudioSettings.musicVolume,
    liveAudioSettings.sfxVolume,
    liveAudioSettings.hitsound,
  ]);

  // Reset state when the chart changes.
  useEffect(() => {
    setLoading(true);
    setError("");
    setNeedsStart(true);
    startingRef.current = false;
    setStarting(false);
    setStartError("");
    soundCheckingRef.current = false;
    setSoundChecked(false);
    setSoundChecking(false);
    setSoundCheckError("");
    setPaused(false);
    resumingRef.current = false;
    setResuming(false);
    setRestarting(false);
    setResumeError("");
    setGamepadInterruption("");
    practiceTempoRef.current = 1;
    setPracticeTempo(1);
    setDrillRecap(null);
    gamepadWasInterruptedRef.current = false;
    practiceRepetitionRef.current = 1;
    practiceAttemptsRef.current = [];
    onPracticeRepetitionChangeRef.current?.(1);
  }, [chart, mode, audioUrl, sectionStartMs, sectionEndMs, practiceRepetitionTotal, audioRetryAttempt, audioRetrySync]);

  const retryAudioLoad = () => {
    focusStartAfterLoadRef.current = true;
    setLoading(true);
    setError("");
    setNeedsStart(true);
    startingRef.current = false;
    setStarting(false);
    setStartError("");
    setAudioRetryAttempt((attempt) => attempt + 1);
  };

  const leaveAudioError = () => {
    nav(variant === "hero" ? "/" : `/track/${chart.track_id}`);
  };

  const handleAudioErrorKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      leaveAudioError();
      return;
    }
    if (event.key !== "Tab") return;
    event.preventDefault();
    const retry = loadRetryButtonRef.current;
    const back = loadBackButtonRef.current;
    if (event.shiftKey) (document.activeElement === retry ? back : retry)?.focus();
    else (document.activeElement === back ? retry : back)?.focus();
  };

  /**
   * 开始前的声音自检：一次用户点击里解锁 AudioContext 并打一记打击音，
   * 让玩家在进歌之前就知道有没有声音 —— 而不是进歌后才发现。
   */
  const soundCheck = async () => {
    // React cannot commit disabled=true between two same-turn activations.
    // Keep the browser-permission attempt single-shot with a synchronous ref.
    if (soundCheckingRef.current) return;
    soundCheckingRef.current = true;
    setSoundChecking(true);
    setSoundCheckError("");
    trackEvent("sound_check");
    try {
      await unlockAudio();
      // 自检结束后音量要回到玩家本来的设置，不能因为听过一次就把 SFX 顶到 0.6。
      const restore = muted || !settings.hitsound ? 0 : settings.sfxVolume;
      setSfxVolume(0.6);
      playHit("perfect", 0);
      setSoundChecked(true);
      window.setTimeout(() => setSfxVolume(restore), 900);
    } catch {
      setSoundChecked(false);
      setSoundCheckError("Sound check could not start. Check browser sound permission, then try again.");
    } finally {
      soundCheckingRef.current = false;
      setSoundChecking(false);
    }
  };

  const startRun = async () => {
    const conductor = conductorRef.current;
    if (!conductor || suspendedRef.current || startingRef.current) return;
    startingRef.current = true;
    setStarting(true);
    setStartError("");
    // Invoke both gated APIs before the first await so mobile browsers see the
    // same direct pointer gesture for audio unlock and fullscreen.
    const audioUnlock = unlockAudio();
    const fullscreenWasActive = gameFullscreenElement() !== null;
    // Duo's parent owns the real gesture and fullscreen request. Its gated
    // child effects run later and would only issue two redundant, usually
    // denied requests outside the activation stack.
    const fullscreenRequest = variant === "full" && !hideStartOverlay
      ? requestGameFullscreen()
      : null;
    try {
      await audioUnlock;
      if (conductorRef.current !== conductor || suspendedRef.current) {
        startingRef.current = false;
        setStarting(false);
        return;
      }
      const audioStartMs = sectionPractice
        ? Math.max(0, sectionStartMs + offsetMsRef.current)
        : 0;
      conductor.setBaseRate(practiceTempoRef.current);
      conductor.begin(COUNTDOWN_MS, audioStartMs);
      setNeedsStart(false);
      setPaused(false);
      onStart?.();
    } catch {
      startingRef.current = false;
      setStarting(false);
      setStartError("Audio could not start. Check browser sound permission, then try again.");
      if (fullscreenRequest && !fullscreenWasActive) {
        void fullscreenRequest.then((result) => {
          if (result === "requested" && !startingRef.current && needsStartRef.current) {
            return exitGameFullscreen();
          }
        });
      }
    } finally {
      if (fullscreenRequest) void fullscreenRequest;
    }
  };

  // Home combined Play+Sound already unlocked AudioContext — start when ready.
  // Dev-only: the ?surge=N visual-QA lock implies auto-start so stills can be
  // captured headlessly without a click gesture.
  const autoStartedRef = useRef(false);
  const effectiveAutoStart = autoStart || devAutoStart || (import.meta.env.DEV && demoSurge > 0);
  useEffect(() => {
    autoStartedRef.current = false;
  }, [chart, mode, audioUrl, sectionStartMs, sectionEndMs]);
  useEffect(() => {
    if (suspended) {
      if (needsStart) autoStartedRef.current = false;
      return;
    }
    if (!effectiveAutoStart || loading || error || !needsStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void startRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot after load
  }, [effectiveAutoStart, loading, error, needsStart, suspended]);

  // Duo · Start gate. The parent bumps `startGate` from 0 → n once every field
  // has reported `onReady`, so all conductors `begin()` from the same React
  // commit — same frame, charts in lockstep. Without this, each field would
  // begin as soon as ITS decode finished and the two charts would drift apart
  // by the decode-time difference (tens of ms — very visible as note offset).
  useEffect(() => {
    if (suspended) {
      if (needsStart) autoStartedRef.current = false;
      return;
    }
    if (!startGate) return;
    if (loading || error || !needsStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void startRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot per gate bump
  }, [startGate, loading, error, needsStart, suspended]);

  // Dev-only QA hook (docs/BEATSCAPE-SURGE-FX.md): lets an injected autoplayer
  // READ game state. Input still flows through the real keyboard event path.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __bs: unknown }).__bs = {
      get session() { return sessionRef.current; },
      get conductor() { return conductorRef.current; },
      get surge() { return surgeRef.current; },
      get offset() { return offsetMsRef.current; },
    };
    return () => { delete (window as unknown as { __bs?: unknown }).__bs; };
  }, []);

  const resumeRun = async () => {
    const conductor = conductorRef.current;
    if (
      !conductor
      || !pausedRef.current
      || suspendedRef.current
      || finishedRef.current
      || resumingRef.current
    ) return;
    resumingRef.current = true;
    setResuming(true);
    setResumeError("");
    try {
      // Must be called directly from the Resume click/key gesture. A system
      // interruption can leave the shared context suspended even though the
      // chart itself is correctly frozen.
      await unlockAudio();
      if (
        conductorRef.current !== conductor
        || suspendedRef.current
        || finishedRef.current
        || !pausedRef.current
      ) return;
      lastCountInt.current = -1;
      conductor.resume(conductor.countdownRemainingMs > 0 ? 0 : COUNTDOWN_MS);
      pausedRef.current = false;
      setPaused(false);
      gamepadWasInterruptedRef.current = false;
      setGamepadInterruption("");
    } catch {
      setResumeError("Audio could not resume. Check browser sound permission, then try again.");
    } finally {
      resumingRef.current = false;
      setResuming(false);
    }
  };

  const togglePause = () => {
    const conductor = conductorRef.current;
    if (!conductor || suspendedRef.current || finishedRef.current) return;
    // Duo · Hand the toggle to the parent: it bumps `pauseSync`, which flips
    // BOTH fields in the same commit. Toggling locally here would let one
    // player freeze while the other keeps playing — the charts would drift.
    if (onPauseChangeRef.current) {
      if (!pausedRef.current) clearActiveInputs();
      onPauseChangeRef.current();
      return;
    }
    if (pausedRef.current) {
      void resumeRun();
      return;
    }
    setResumeError("");
    clearActiveInputs();
    conductor.pause();
    pausedRef.current = true;
    setPaused(true);
  };

  // Duo · Parent's pause broadcast: flip this field once per bump. Bumps are
  // debounced on the parent side, so one user action = one bump = one flip
  // here — including the tab-hide case where BOTH fields report at once.
  useEffect(() => {
    if (!pauseSync) return;
    const conductor = conductorRef.current;
    if (!conductor || finishedRef.current) return;
    setPaused((prev) => {
      if (prev) {
        lastCountInt.current = -1;
        conductor.resume(conductor.countdownRemainingMs > 0 ? 0 : COUNTDOWN_MS);
        gamepadWasInterruptedRef.current = false;
        setGamepadInterruption("");
      }
      else {
        clearActiveInputs();
        conductor.pause();
      }
      return !prev;
    });
  }, [pauseSync]);

  // The exit dialog is a temporary hold, independent of manual pause. Closing
  // it resumes an active run but keeps an already-paused run paused. Both Duo
  // fields receive the same value; no toggle broadcast or remount is needed.
  useEffect(() => {
    const conductor = conductorRef.current;
    if (!conductor || needsStart || finishedRef.current) return;
    if (suspended || paused) {
      clearActiveInputs();
      conductor.pause();
    }
    else if (conductor.isPaused) {
      lastCountInt.current = -1;
      conductor.resume(conductor.countdownRemainingMs > 0 ? 0 : COUNTDOWN_MS);
    }
  }, [suspended, paused, needsStart]);

  const resetLiveSession = (conductor: Conductor) => {
    conductor.stop();
    sessionRef.current = new GameSession(chart, mode, {
      chordAssist: chordAssistRef.current,
      startAtMs: sectionStartMs,
      endAtMs: sectionEndMs,
      sectionPractice,
    });
    surgeRef.current.reset();
    streakRef.current.reset();
    prevNeonRef.current = 0;
    if (variant === "full") document.body.dataset.neon = "0";
    surgeTierRef.current = 0;
    lastEffMsRef.current = 0;
    ringsRef.current = [];
    colsRef.current = [];
    sweepsRef.current = [];
    lightComboPrevRef.current = 0;
    lastShowBarRef.current = -1;
    surgeDropRef.current = 0;
    seenComboBreaksRef.current = 0;
    prevComboRef.current = 0;
    finishedRef.current = false;
    lastCountInt.current = -1;
    particlesRef.current = [];
    fxRef.current = [];
    scorePopsRef.current = [];
    milestoneRef.current = null;
    clearActiveInputs();
    laneFlashRef.current = [0, 0, 0, 0];
    if (wrapRef.current) wrapRef.current.dataset.surge = "0";
    if (failureRef.current) {
      failureRef.current.dataset.show = "0";
      failureRef.current.setAttribute("aria-hidden", "true");
    }
  };

  const beginFreshSession = (conductor: Conductor) => {
    resetLiveSession(conductor);
    const audioStartMs = sectionPractice
      ? Math.max(0, sectionStartMs + offsetMsRef.current)
      : 0;
    conductor.setBaseRate(practiceTempoRef.current);
    conductor.begin(COUNTDOWN_MS, audioStartMs);
    pausedRef.current = false;
    setPaused(false);
    if (suspendedRef.current) conductor.pause();
  };

  finishCycleRef.current = (result) => {
    const conductor = conductorRef.current;
    const currentRepetition = practiceRepetitionRef.current;
    const attempt: PracticeAttemptSummary = {
      accuracy: result.accuracy,
      misses: result.judgments.miss,
      score: result.score,
      grade: result.grade,
    };
    const attempts = practiceRepetitionTotal > 1
      ? [...practiceAttemptsRef.current, attempt]
      : [];
    if (practiceRepetitionTotal > 1) practiceAttemptsRef.current = attempts;
    if (
      conductor
      && practiceRepetitionTotal > 1
      && currentRepetition < practiceRepetitionTotal
    ) {
      const nextRepetition = currentRepetition + 1;
      practiceRepetitionRef.current = nextRepetition;
      beginFreshSession(conductor);
      setDrillRecap({
        completedRepetition: currentRepetition,
        nextRepetition,
        totalRepetitions: practiceRepetitionTotal,
        accuracy: result.accuracy,
        misses: result.judgments.miss,
      });
      onPracticeRepetitionChangeRef.current?.(nextRepetition);
      return;
    }
    onFinishRef.current({
      ...result,
      ...(practiceRepetitionTotal > 1
        ? {
            practiceRepetitions: practiceRepetitionTotal,
            practiceAttempts: attempts,
          }
        : {}),
    });
  };

  // FEEL PACK: instant retry — same chart, fresh session, straight to countdown.
  const restartRun = async () => {
    const conductor = conductorRef.current;
    // The stable key listener must read current readiness, not the loading=true
    // value captured when it was installed before the audio finished loading.
    if (
      !conductor
      || conductor.durationMs <= 0
      || suspendedRef.current
      || finishedRef.current
      || resumingRef.current
    ) return;

    // Restart is one transaction: never discard the existing session until
    // the same click/key gesture has restored system audio. If an interruption
    // beat the statechange handler, freeze here before awaiting permission.
    if (String(getAudioContext().state) !== "running" && !pausedRef.current) {
      clearActiveInputs();
      conductor.pause();
      pausedRef.current = true;
      setPaused(true);
    }
    resumingRef.current = true;
    setRestarting(true);
    setResumeError("");
    try {
      await unlockAudio();
      if (
        conductorRef.current !== conductor
        || finishedRef.current
      ) return;

      setDrillRecap(null);
      beginFreshSession(conductor);
      onStart?.();
      // The user may open the exit panel while the audio permission promise is
      // pending. Preserve their Restart intent, but keep the fresh run frozen
      // behind that panel until Keep playing releases the page-owned hold.
      if (suspendedRef.current) conductor.pause();
    } catch {
      setResumeError("Audio could not restart. Check browser sound permission, then try again.");
    } finally {
      resumingRef.current = false;
      setRestarting(false);
    }
  };

  const handlePauseKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    // Browser/OS commands keep their native behavior. Every plain gameplay
    // key stays inside the modal so a lane press cannot leak into the field.
    if (hasBrowserShortcutModifier(event)) return;
    event.stopPropagation();
    const pauseShortcut = !pauseKeyIsLane && (event.key === "p" || event.key === "P");
    if (event.key === "Escape" || pauseShortcut) {
      event.preventDefault();
      if (!event.repeat) togglePause();
      return;
    }
    if (!restartKeyIsLane && event.code === "KeyR" && !onPauseChangeRef.current) {
      event.preventDefault();
      if (!event.repeat) void restartRun();
      return;
    }
    if (event.key !== "Tab") return;
    event.preventDefault();
    cycleModalFocus(event.currentTarget, event.shiftKey);
  };

  useGamepadDialogNavigation({
    containerRef: pauseDialogRef,
    enabled: pauseDialogVisible,
    gamepadIndexes: pauseGamepadIndexes,
    onBack: togglePause,
  });

  // Juice: burst particles + screen shake on every judged hit/miss.
  const spawnHitFx = (lane: number, judgment: JudgeFx["judgment"]) => {
    // FEEL PACK haptics: crisp tick per scoring hit, firm pulse on miss.
    // Touch and an assigned controller share the setting but remain entirely
    // independent from hitsound audio. Unsupported surfaces are safe no-ops.
    emitHaptic(judgment === "miss" ? "miss" : "hit");
    const { w, h } = dimRef.current;
    if (!w || !h) return;
    const receptorY = receptorYFromGeometry(h, Math.min(w, h));
    const laneW = w / 4;
    const cx = (lane + 0.5) * laneW;
    const isPerfect = judgment === "perfect";
    const [r, g, b] =
      judgment === "miss"
        ? [254, 44, 85]
        : isPerfect
          ? [255, 214, 10]
          : LANE_RGB[lane];
    if (fancyFxRef.current && !reduceMotionRef.current && !prefersReducedMotion()) {
      const count =
        judgment === "perfect" ? 22 : judgment === "great" ? 14 : judgment === "good" ? 8 : 8;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * (isPerfect ? 6.5 : 5);
        particlesRef.current.push({
          x: cx,
          y: receptorY,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 2.4,
          born: performance.now(),
          life: 380 + Math.random() * 260,
          r,
          g,
          b,
          size: 1.6 + Math.random() * (isPerfect ? 3.2 : 2.4),
        });
      }
      // Screen shake and particles are optional motion. Essential judgment and
      // score feedback stay visible through the renderer's stationary fade.
      const mag =
        judgment === "perfect" ? 6 : judgment === "great" ? 3.5 : judgment === "good" ? 2 : 7;
      shakeRef.current = { mag, until: performance.now() + 150 };
    }
  };

  // Shared FX-commit: identical 5-step sequence previously duplicated in
  // handlePress + handleRelease (audit P2-2). Pushes the judged hit into the
  // fx queue, advances the SIGNAL/streak atmosphere, fires juice + hit SFX.
  const commitFx = (fx: JudgeFx) => {
    fxRef.current.push({
      lane: fx.lane,
      judgment: fx.judgment,
      born: performance.now(),
      deltaMs: fx.deltaMs,
      ...(fx.accent ? { accent: fx.accent } : {}),
      ...(fx.chordFeedback ? { chordFeedback: fx.chordFeedback } : {}),
    });
    // The engine attaches the exact awarded points before any subsequent event
    // can mutate combo. This keeps direct input and batched auto-judgments on
    // one score-feedback truth, including a Good's reset x1 award.
    const { w, h } = dimRef.current;
    if (w && h && fx.scoreGain > 0) {
      scorePopsRef.current.push({
        x: (fx.lane + 0.5) * (w / 4),
        y: receptorYFromGeometry(h, Math.min(w, h)) - 78,
        text: `+${fx.scoreGain}`,
        born: performance.now(),
        color: JUDGE_COLORS[fx.judgment],
      });
    }
    surgeRef.current.apply(fx.judgment);
    streakRef.current.apply(fx.judgment);
    spawnHitFx(fx.lane, fx.judgment);
    if (hitsoundRef.current) playHit(fx.judgment, surgeTierRef.current, fx.accent);
  };

  // Auto-pause when the tab is hidden, the browser window loses focus, OR the
  // shared AudioContext is interrupted; user
  // resumes explicitly on return (PRD §4.11). `visibilitychange` alone misses
  // desktop app switching and system chrome that can swallow keyup/pointerup.
  // Duo · Broadcast instead of pausing locally, so both fields freeze together.
  // Both fields fire the same interruption; the parent debounces the two
  // reports into a single `pauseSync` bump.
  useEffect(() => {
    const pauseForInterruption = () => {
      if (finishedRef.current || !conductorRef.current?.playing) return;
      clearActiveInputs();
      if (onPauseChangeRef.current) {
        onPauseChangeRef.current();
        return;
      }
      conductorRef.current.pause();
      setPaused(true);
    };
    const onVis = () => {
      if (document.hidden) pauseForInterruption();
    };
    const audioContext = getAudioContext();
    const onAudioStateChange = () => {
      if (String(audioContext.state) !== "running") pauseForInterruption();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", pauseForInterruption);
    audioContext.addEventListener("statechange", onAudioStateChange);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", pauseForInterruption);
      audioContext.removeEventListener("statechange", onAudioStateChange);
    };
  }, []);

  // The game loop. Reads the audio clock, draws to canvas, never re-renders React.
  // Moved verbatim to playfield/renderLoop.ts (P2-2) — PlayField just wires the
  // refs/values/closures it needs through a context object.
  useEffect(() => {
    if (!canvasRef.current || !wrapRef.current) return;
    return createPlayfieldRenderer({
      canvasRef,
      wrapRef,
      failureRef,
      conductorRef,
      sessionRef,
      pressedRef,
      laneFlashRef,
      spritesRef,
      halftonePatRef,
      ringSpriteRef,
      raysRef,
      dimRef,
      shakeRef,
      fxRef,
      particlesRef,
      milestoneRef,
      scorePopsRef,
      comboBreakRef,
      prevComboRef,
      seenComboBreaksRef,
      surgeRef,
      streakRef,
      prevNeonRef,
      surgeTierRef,
      lastEffMsRef,
      ringsRef,
      colsRef,
      sweepsRef,
      lastLaneRef,
      lightComboPrevRef,
      lastShowBarRef,
      surgeDropRef,
      needsStartRef,
      pausedRef,
      mutedRef,
      muteMusicRef,
      hitsoundRef,
      backgroundDimRef,
      fancyFxRef,
      reduceMotionRef,
      offsetMsRef,
      approachRef,
      lastNoteMsRef,
      lastCountInt,
      finishedRef,
      showKeyHintsRef: showLiveKeyHintsRef,
      chart,
      sectionPractice,
      variant,
      district,
      demoSurge,
      demoStreak,
      keyHint: liveLaneHint,
      persistentKeyHints,
      beforeSessionAdvance: (frameTimeMs) => gamepadPollRef.current?.(frameTimeMs),
      spawnHitFx,
      emitHaptic,
      onFinish: (result) => finishCycleRef.current(result),
      useComicHud: useComicHudRef.current,
    });
  }, [
    mode,
    liveLaneHint,
    persistentKeyHints,
    chart.bpm,
    district,
    demoSurge,
    demoStreak,
    sectionPractice,
    sectionStartMs,
    variant,
  ]);

  const effectiveInputSongTimeMs = (
    conductor: Conductor,
    inputPerformanceTimeMs?: number,
  ): number => {
    const playbackRate = conductor.playbackRate;
    const songTimeMs = conductor.songTimeMs();
    const inputSongTimeMs = inputPerformanceTimeMs === undefined
      ? songTimeMs
      : songTimeAtInputMs(
          songTimeMs,
          playbackRate,
          inputPerformanceTimeMs,
          performance.now(),
        );
    return inputSongTimeMs - offsetMsRef.current;
  };

  const handlePress = (
    lane: number,
    touchChordAssist: boolean,
    inputPerformanceTimeMs?: number,
  ) => {
    const conductor = conductorRef.current;
    const session = sessionRef.current;
    if (
      !conductor
      || !session
      || needsStartRef.current
      || pausedRef.current
      || finishedRef.current
    ) return;
    if (pressedRef.current.has(lane)) return;
    // Fresh notes stay inert throughout every countdown. The sole exception is
    // an already-landed Hold or armed Slide whose physical owner was cleared by
    // Pause/blur: the player can re-grab it before GO instead of receiving an
    // unavoidable Miss after doing exactly what the safe re-entry UI asked.
    if (conductor.countdownRemainingMs > 0) {
      const rearmedHold = session.canRearmHold(lane);
      const rearmedSlide = session.rearmSlideTarget(lane);
      if (!rearmedHold && !rearmedSlide) return;
      pressedRef.current.add(lane);
      laneFlashRef.current[lane] = performance.now();
      lastLaneRef.current = lane;
      if (rearmedSlide) emitHaptic("confirm");
      return;
    }
    pressedRef.current.add(lane);
    laneFlashRef.current[lane] = performance.now();
    lastLaneRef.current = lane;
    const eff = effectiveInputSongTimeMs(conductor, inputPerformanceTimeMs);
    const fx = session.press(lane, eff, { touchChordAssist });
    if (fx) {
      commitFx(fx);
    } else {
      // The locked rail can be obscured by a thumb or missed in peripheral
      // vision. Pair it with a tiny tactile tick on the active feedback surface
      // so early Slide arrival is confirmed before the endpoint judgment.
      if (session.isSlideTargetHeld(lane)) emitHaptic("confirm");
      if (hitsoundRef.current) playKeyTick();
    }
  };

  const handleRelease = (lane: number, inputPerformanceTimeMs?: number) => {
    if (!pressedRef.current.delete(lane)) return;
    const conductor = conductorRef.current;
    const session = sessionRef.current;
    if (
      !conductor
      || !session
      || needsStartRef.current
      || pausedRef.current
      || finishedRef.current
      || conductor.countdownRemainingMs > 0
    ) return;
    const eff = effectiveInputSongTimeMs(conductor, inputPerformanceTimeMs);
    const fx = session.release(lane, eff);
    if (fx) {
      commitFx(fx);
    }
  };

  const applyInputTransition = (
    transition: LaneInputTransition,
    touchChordAssist: boolean,
    inputPerformanceTimeMs?: number,
  ) => {
    if (transition.release !== null) handleRelease(transition.release, inputPerformanceTimeMs);
    if (transition.press !== null) {
      handlePress(transition.press, touchChordAssist, inputPerformanceTimeMs);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || suspendedRef.current || finishedRef.current) return;
      // Preserve browser/OS commands such as Ctrl/Cmd+R, Ctrl/Cmd+P and
      // Alt+Arrow navigation. Keyup still flows below so adding a modifier
      // after a valid lane press cannot strand its physical owner.
      if (hasBrowserShortcutModifier(e)) return;
      // Before the run starts, the ready overlay owns keyboard interaction.
      // A bindable Space/Enter must still activate its focused native button;
      // gameplay begins owning those keys only after the start transaction.
      if (needsStartRef.current) return;
      const lane = laneFromKeyEvent(e, keys);
      if (lane >= 0) {
        e.preventDefault();
        const inputTimeMs = inputEventPerformanceTimeMs(
          e.timeStamp,
          performance.now(),
          performance.timeOrigin,
        );
        applyInputTransition(
          inputTrackerRef.current.begin(`key:${e.code}`, lane, inputTimeMs),
          false,
          inputTimeMs,
        );
        return;
      }
      // FEEL PACK: instant retry — R restarts the chart unless R is lane-bound.
      // Duo · disabled: this restarts only THIS field, and the two charts would
      // leave the lockstep they started in. Rematch on the result card is the
      // duo way to replay.
      if (e.code === "KeyR" && !finishedRef.current && !onPauseChangeRef.current) {
        e.preventDefault();
        void restartRun();
        return;
      }
      // Escape / P 暂停或继续——对局里玩家没有别的退出键，必须有键盘暂停。
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        e.preventDefault();
        togglePause();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const inputTimeMs = inputEventPerformanceTimeMs(
        e.timeStamp,
        performance.now(),
        performance.timeOrigin,
      );
      applyInputTransition(inputTrackerRef.current.end(`key:${e.code}`), false, inputTimeMs);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);

  // Gamepad buttons expose state snapshots rather than key-style press/release
  // events, so read the assigned controller once per game-render frame. The W3C
  // timestamp records the browser's latest hardware update; bounded timing
  // normalization keeps rAF / long-task queueing from degrading a physical
  // Perfect. Unsupported, stale or invalid timestamps safely fall back to the
  // poll time. The renderer invokes this sampler before session.tick(), so a
  // still-valid edge cannot lose the same frame to automatic Miss. D-pad and
  // face-button sources remain independent owners: holding both controls for
  // one lane cannot cut a Hold when only one is released.
  useEffect(() => {
    if (gamepadIndex === undefined || typeof navigator.getGamepads !== "function") return;

    let activeButtons = new Set<number>();
    let menuPressed = false;
    const sourceFor = (button: number) => `gamepad:${gamepadIndex}:button:${button}`;
    const readGamepad = (): Gamepad | null => {
      try {
        const gamepad = navigator.getGamepads()[gamepadIndex];
        return gamepad?.connected === true && gamepad.mapping === "standard" ? gamepad : null;
      } catch {
        return null;
      }
    };

    // A controller may be discovered because the player is already holding a
    // button. Seed the edge state without scoring that stale press; the next
    // release + press becomes the first intentional gameplay input.
    const initialGamepad = readGamepad();
    if (initialGamepad) {
      activeButtons = pressedStandardGamepadButtons(initialGamepad);
      menuPressed = gamepadButtonIsPressed(initialGamepad?.buttons[STANDARD_GAMEPAD_MENU_BUTTON]);
    }

    const poll = (now: number) => {
      const gamepad = readGamepad();
      const inputTimeMs = inputEventPerformanceTimeMs(
        gamepad?.timestamp ?? 0,
        now,
        performance.timeOrigin,
      );
      const pressed = gamepad
        ? pressedStandardGamepadButtons(gamepad)
        : new Set<number>();
      const acceptsInput = !needsStartRef.current
        && !pausedRef.current
        && !suspendedRef.current
        && !finishedRef.current;
      const nextMenuPressed = gamepadButtonIsPressed(
        gamepad?.buttons[STANDARD_GAMEPAD_MENU_BUTTON],
      );
      if (
        nextMenuPressed
        && !menuPressed
        && !needsStartRef.current
        && !suspendedRef.current
        && !finishedRef.current
      ) {
        if (onGamepadPauseRef.current) onGamepadPauseRef.current();
        else togglePause();
      }
      menuPressed = nextMenuPressed;

      for (const button of pressed) {
        if (activeButtons.has(button)) continue;
        activeButtons.add(button);
        if (
          button === STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON
          && needsStartRef.current
          && !suspendedRef.current
          && !finishedRef.current
          && !startingRef.current
          && audioReadyForControllerStartRef.current
          && variant === "full"
          && !autoStart
          && !hideStartOverlay
        ) {
          void startRun();
          continue;
        }
        if (!acceptsInput) continue;
        const lane = laneFromStandardGamepadButton(button);
        if (lane === null) continue;
        applyInputTransition(
          inputTrackerRef.current.begin(sourceFor(button), lane, inputTimeMs),
          false,
          inputTimeMs,
        );
      }

      for (const button of [...activeButtons]) {
        if (pressed.has(button)) continue;
        activeButtons.delete(button);
        applyInputTransition(
          inputTrackerRef.current.end(sourceFor(button)),
          false,
          inputTimeMs,
        );
      }
    };

    gamepadPollRef.current = poll;
    return () => {
      if (gamepadPollRef.current === poll) gamepadPollRef.current = null;
      for (const button of activeButtons) {
        applyInputTransition(inputTrackerRef.current.end(sourceFor(button)), false);
      }
    };
    // Handlers intentionally read the same current refs as keyboard/pointer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamepadIndex]);

  // getBoundingClientRect() 会强制浏览器同步算一次布局。pointermove 在移动端能到
  // 120Hz+，每移动一次都读就是在反复强制回流。DOMRect 是快照而非活对象，所以缓存
  // 并在画布尺寸、视口位置或全屏状态变化时失效。
  const rectRef = useRef<DOMRect | null>(null);
  useEffect(() => {
    const invalidate = () => {
      rectRef.current = null;
    };
    window.addEventListener("resize", invalidate);
    // capture=true 才能收到内部滚动容器的滚动事件。
    window.addEventListener("scroll", invalidate, { passive: true, capture: true });
    const canvas = canvasRef.current;
    const observer = canvas && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(invalidate)
      : null;
    if (canvas) observer?.observe(canvas);
    for (const event of FULLSCREEN_CHANGE_EVENTS) document.addEventListener(event, invalidate);
    return () => {
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("scroll", invalidate, true);
      observer?.disconnect();
      for (const event of FULLSCREEN_CHANGE_EVENTS) document.removeEventListener(event, invalidate);
    };
  }, []);
  const fieldRect = (): DOMRect | null => {
    if (!rectRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      rectRef.current = canvas.getBoundingClientRect();
    }
    return rectRef.current;
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    // A right-click or stylus barrel button must not become a lane hit before
    // the subsequent contextmenu event is suppressed.
    if (e.button !== 0) {
      e.preventDefault();
      return;
    }
    if (finishedRef.current) return;
    const rect = fieldRect();
    if (!rect) return;
    const lane = laneFromClientX(e.clientX, rect);
    if (lane == null) return;
    const inputTimeMs = inputEventPerformanceTimeMs(
      e.timeStamp,
      performance.now(),
      performance.timeOrigin,
    );
    const transition = inputTrackerRef.current.begin(e.pointerId, lane, inputTimeMs);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    applyInputTransition(transition, e.pointerType === "touch", inputTimeMs);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!inputTrackerRef.current.hasSource(e.pointerId)) return;
    const rect = fieldRect();
    if (!rect) return;
    const lane = e.pointerType === "touch"
      ? laneFromTouchDrag(e.clientX, rect, inputTrackerRef.current.laneForSource(e.pointerId))
      : laneFromClientX(e.clientX, rect);
    const inputTimeMs = inputEventPerformanceTimeMs(
      e.timeStamp,
      performance.now(),
      performance.timeOrigin,
    );
    applyInputTransition(
      inputTrackerRef.current.move(e.pointerId, lane, inputTimeMs),
      e.pointerType === "touch",
      inputTimeMs,
    );
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    const inputTimeMs = inputEventPerformanceTimeMs(
      e.timeStamp,
      performance.now(),
      performance.timeOrigin,
    );
    applyInputTransition(inputTrackerRef.current.end(e.pointerId), false, inputTimeMs);
  };

  const startControl = (
    <>
      <button
        ref={startButtonRef}
        type="button"
        className="btn primary unlock-btn"
        data-loading={loading}
        onClick={() => void startRun()}
        disabled={loading || starting}
        aria-busy={loading || starting}
      >
        {loading
          ? "Loading song…"
          : starting
          ? "Starting…"
          : variant === "hero" ? SCAPE_COPY.heroPlayAction : SCAPE_COPY.tapToEnter}
      </button>
      {loading && <AudioLoadProgress progress={audioProgress} />}
      {startError && <p className="start-run-error" role="alert">{startError}</p>}
    </>
  );
  const showReadyDuringLoad = variant === "full" && needsStart && !autoStart && !hideStartOverlay;

  return (
    <div
      className={`play-wrap${variant === "hero" ? " play-wrap-hero" : ""}${
        playerLabel ? " play-wrap-duo" : ""
      }${className ? ` ${className}` : ""}`}
      ref={wrapRef}
      data-background-dim={Math.round(liveAudioSettings.backgroundDim * 100)}
      data-note-speed={formatNoteSpeed(noteSpeed)}
      style={district ? ({ "--district-color": districtColor(district) } as React.CSSProperties) : undefined}
    >
      <canvas
        ref={canvasRef}
        className="play-canvas"
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onLostPointerCapture={onPointerUp}
      />
      {statsRef && (
        <PlayHud
          statsRef={statsRef}
          mode={mode}
          playerLabel={playerLabel}
          scoreTarget={liveScoreTarget}
          openingCoach={openingCoach}
          openingCoachTouch={showTouchLegend}
          practiceTempo={practiceTempo}
        />
      )}
      {drillRecap && (
        <div
          className="drill-recap"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span>Rep {drillRecap.completedRepetition} complete</span>
          <strong>
            {drillRecap.accuracy}% · {drillRecap.misses === 0
              ? "clean"
              : `${drillRecap.misses} ${drillRecap.misses === 1 ? "miss" : "misses"}`}
          </strong>
          <small>Next · Rep {drillRecap.nextRepetition}/{drillRecap.totalRepetitions}</small>
        </div>
      )}
      <div
        ref={failureRef}
        className="play-failure"
        data-show="0"
        role="alert"
        aria-hidden="true"
        aria-atomic="true"
      >
        <div className="play-failure-card">
          <span>ARCADE RUN</span>
          <strong>SIGNAL LOST</strong>
          <span>HP DEPLETED</span>
        </div>
      </div>
      {loading && !error && !showReadyDuringLoad && !hideAudioLoadingOverlay && (
        <div className="overlay">
          <div className="overlay-card">
            <p className="overlay-kicker">Loading</p>
            <p className="overlay-title">Cueing audio</p>
            <AudioLoadProgress progress={audioProgress} />
          </div>
        </div>
      )}
      {error && !hideAudioLoadError && (
        <div
          className="overlay load-error"
          role="alertdialog"
          aria-modal="true"
          aria-label="Audio loading failed"
          onKeyDown={handleAudioErrorKeyDown}
        >
          <div className="overlay-card">
            <p className="overlay-kicker">Signal lost</p>
            <p>We couldn't cue this track. Check your connection, then try again.</p>
            <small className="load-error-detail">Support code: {error}</small>
            <div className="audio-load-actions">
              <button ref={loadRetryButtonRef} type="button" className="btn primary" onClick={retryAudioLoad}>
                Retry loading
              </button>
              <button ref={loadBackButtonRef} type="button" className="btn" onClick={leaveAudioError}>
                {variant === "hero" ? "Back to Home" : "Back to track"}
              </button>
            </div>
          </div>
        </div>
      )}
      {!error && needsStart && !autoStart && !hideStartOverlay && (!loading || showReadyDuringLoad) && (
        // One explicit button owns activation. The card also contains audio,
        // timing and help controls, so making its backdrop a second invisible
        // start target would turn harmless taps into accidental runs.
        <div className="overlay overlay-tap">
          <div className="overlay-card">
            <p className="overlay-kicker" aria-live={startKicker === SCAPE_COPY.runReady ? "polite" : undefined}>
              {loading && startKicker === SCAPE_COPY.runReady ? "Preparing your run" : startKicker}
            </p>
            {dailyDateKey && variant === "full" && (
              <div
                className="daily-run-context"
                role="note"
                aria-label={`Daily challenge for ${dailyDateKey}`}
              >
                <span>Daily challenge</span>
                <strong>Standard Arcade</strong>
                <small>{dailyDateKey} UTC · Local score</small>
              </div>
            )}
            {challengeTarget && variant === "full" && (
              <div className="challenge-target" role="note" aria-label="Shared score challenge">
                <span>Shared challenge</span>
                <strong>Beat {challengeTarget.score.toLocaleString("en-US")} pts</strong>
                <small>{challengeTarget.accuracy}% accuracy · Grade {challengeTarget.grade}</small>
              </div>
            )}
            {personalBest && !challengeTarget && variant === "full" && (
              <div className="personal-best-target" role="note" aria-label="Personal best score target">
                <span>Personal best</span>
                <strong>Beat {personalBest.score.toLocaleString("en-US")} pts</strong>
                <small>{personalBest.accuracy}% accuracy · Arcade record</small>
              </div>
            )}
            {!openingCoach && startControl}
            {showTouchLegend ? (
              <div
                className="unlock-touch-lanes"
                role="img"
                aria-label="Four touch lanes"
              >
                <span aria-hidden />
                <span aria-hidden />
                <span aria-hidden />
                <span aria-hidden />
              </div>
            ) : (
              <div
                className="unlock-keys"
                role="img"
                aria-label={`Lane keys: ${keyHintJoined}`}
              >
                {keyHint.map((k, i) => (
                  <span key={i} className="key-chip" aria-hidden>
                    {k}
                  </span>
                ))}
              </div>
            )}
            {gamepadIndex !== undefined && (
              <div
                className="unlock-gamepad"
                role="note"
                aria-label="Controller ready. Use the D-pad or four face buttons."
              >
                <span className="unlock-gamepad-buttons" aria-hidden>◀ ▼ ▲ ▶</span>
                <span>
                  <strong>Controller ready</strong>
                  <small>D-pad or face buttons</small>
                </span>
              </div>
            )}
            {gamepadIndex !== undefined && variant === "full" && (
              <p
                className="unlock-gamepad-start"
                data-ready={audioReadyForControllerStart}
                role="note"
                aria-label={audioReadyForControllerStart
                  ? "Controller start ready. Press the bottom face button to start."
                  : "Controller start unavailable until browser audio is unlocked. Activate Start playing once."}
              >
                {audioReadyForControllerStart
                  ? "Face down · Start"
                  : `${touchUi ? "Tap" : "Click"} Start once · Browser audio`}
              </p>
            )}
            <p className="unlock-hint">
              {gamepadIndex !== undefined
                ? touchUi
                  ? "Controller connected · touch lanes stay active"
                  : "Controller connected · keyboard stays active"
                : physicalKeyboardSeen && touchUi
                  ? "External keyboard ready · touch lanes stay active"
                  : touchUi
                    ? variant === "hero"
                      ? SCAPE_COPY.heroPlayHintTouch
                      : SCAPE_COPY.touchPlayHint
                    : SCAPE_COPY.heroPlayHintKeys}
            </p>
            {variant === "full" && !openingCoach ? (
              <div
                className="unlock-note-speed-control"
                role="group"
                aria-label="Note speed · visual only · saves for all modes"
              >
                <button
                  type="button"
                  aria-label="Decrease note speed"
                  onClick={() => changeNoteSpeed(-1)}
                  disabled={starting || noteSpeed <= NOTE_SPEED_MIN}
                >
                  −
                </button>
                <output aria-live="polite">
                  <span>Note speed</span>
                  <strong>{formatNoteSpeed(noteSpeed)}</strong>
                  <small>{noteSpeedSaveFailed ? "This run only" : "Visual · saves"}</small>
                </output>
                <button
                  type="button"
                  aria-label="Increase note speed"
                  onClick={() => changeNoteSpeed(1)}
                  disabled={starting || noteSpeed >= NOTE_SPEED_MAX}
                >
                  +
                </button>
              </div>
            ) : (
              <p className="unlock-note-speed">
                Note speed <strong>{formatNoteSpeed(noteSpeed)}</strong>
                <span>Visual only</span>
              </p>
            )}
            {mode === "practice" && (
              <PracticeTempoPicker
                className="unlock-practice-tempo"
                tempo={practiceTempo}
                onChange={changePracticeTempo}
              />
            )}
            {mechanicGuides.length > 0 && (
              <div className="unlock-mechanics" aria-label="Chart moves">
                <span className="unlock-mechanics-label">Chart moves</span>
                <div className="unlock-mechanics-list">
                  {mechanicGuides.map((guide) => (
                    <span className={`unlock-mechanic unlock-mechanic-${guide.type}`} key={guide.type}>
                      <span
                        className="unlock-mechanic-preview"
                        data-mechanic-preview={guide.type}
                        aria-hidden="true"
                      >
                        <i className="unlock-mechanic-path" />
                        <i className="unlock-mechanic-note unlock-mechanic-note-start" />
                        <i className="unlock-mechanic-note unlock-mechanic-note-end" />
                      </span>
                      <span className="unlock-mechanic-copy">
                        <b>{guide.label}</b>
                        <small>{guide.detail}</small>
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {openingCoach && startControl}
            {variant === "full" && !touchUi && !onPauseChange && (
              <p
                className="unlock-shortcuts"
                role="note"
                aria-label={`Keyboard shortcuts. ${pauseKeyIsLane ? "Escape" : "P or Escape"} pauses.${
                  restartKeyIsLane ? "" : " R restarts."
                }`}
              >
                <span>
                  {!pauseKeyIsLane && <><kbd>P</kbd><i aria-hidden>/</i></>}
                  <kbd>Esc</kbd>
                  <b>Pause</b>
                </span>
                {!restartKeyIsLane && (
                  <span>
                    <kbd>R</kbd>
                    <b>Restart</b>
                  </span>
                )}
              </p>
            )}
            {/* 校准不是开玩的前置考试：先说明操作与声音状态，需要的人再点进去。 */}
            <div className="unlock-extras">
              <button
                type="button"
                className="btn compact unlock-sound"
                onClick={() => void soundCheck()}
                disabled={soundChecking}
                aria-busy={soundChecking}
              >
                {soundChecking ? "Checking…" : soundChecked ? "Sound check ✓" : "Sound check"}
              </button>
              <Link
                className="unlock-link"
                to={timingHref}
                onClick={() => trackEvent("calibrate_open")}
              >
                Adjust timing
              </Link>
              <details className="unlock-nosound">
                <summary>No sound?</summary>
                <p>
                  Check your device volume and system mute first. Music and SFX have their
                  own sliders in <Link to="/settings">Settings</Link>; the offset lives under
                  Adjust timing.
                </p>
              </details>
            </div>
            {soundCheckError && (
              <p className="start-run-error unlock-sound-error" role="alert">{soundCheckError}</p>
            )}
            {variant === "full" && (
              <p className="unlock-rights">{SCAPE_COPY.rightsShort}</p>
            )}
          </div>
        </div>
      )}
      {!loading && !error && needsStart && autoStart && (
        <div className="overlay">
          <div className="overlay-card">
            <p className="overlay-kicker">{SCAPE_COPY.heroPlayKicker}</p>
            <p className="overlay-title">Cueing…</p>
          </div>
        </div>
      )}
      {!loading && !error && !needsStart && !paused && (
        <button
          ref={pauseButtonRef}
          type="button"
          className="pause-btn"
          onClick={togglePause}
          aria-label="Pause"
        >
          <span className="pause-btn-visual" aria-hidden>
            <svg viewBox="0 0 24 24" focusable="false">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </span>
        </button>
      )}
      {pauseDialogVisible && (
        <div
          ref={pauseDialogRef}
          className="overlay pause-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="single-pause-title"
          aria-describedby="single-pause-copy"
          onKeyDown={handlePauseKeyDown}
        >
          <div className="overlay-card">
            <p className="overlay-kicker">Receiver holding</p>
            <p className="overlay-title" id="single-pause-title">{SCAPE_COPY.pauseTitle}</p>
            <p className="pause-copy" id="single-pause-copy">
              Audio and chart are frozen. Resume starts a 3-second count-in.
              {gamepadIndex !== undefined
                ? " Press Menu to resume."
                : !showTouchLegend
                  ? ` Press ${pauseKeyIsLane ? "Esc" : "P or Esc"} to resume.`
                  : ""}
            </p>
            {gamepadInterruption && (
              <p className="gamepad-interruption" role="status">
                <span aria-hidden>⌁</span>
                {gamepadInterruption}
              </p>
            )}
            <PauseAudioControls
              practiceTempo={mode === "practice" ? practiceTempo : undefined}
              onPracticeTempoChange={mode === "practice" ? changePracticeTempo : undefined}
            />
            {onPauseChange ? (
              <button
                ref={pauseResumeButtonRef}
                type="button"
                className="btn primary unlock-btn"
                onClick={togglePause}
              >
                {SCAPE_COPY.resume}
              </button>
            ) : (
              <div className="pause-actions">
                <button
                  ref={pauseResumeButtonRef}
                  type="button"
                  className="btn primary"
                  data-gamepad-default
                  onClick={togglePause}
                  disabled={resuming || restarting}
                  aria-busy={resuming}
                >
                  {resuming ? "Resuming…" : SCAPE_COPY.resume}
                </button>
                <button
                  ref={pauseRestartButtonRef}
                  type="button"
                  className="btn"
                  onClick={() => void restartRun()}
                  disabled={resuming || restarting}
                  aria-busy={restarting}
                >
                  {restarting
                    ? "Restarting…"
                    : sectionPractice ? "Restart section" : "Restart track"}
                </button>
                {onExitRequest && (
                  <button
                    ref={pauseExitButtonRef}
                    type="button"
                    className="btn pause-exit"
                    onClick={onExitRequest}
                  >
                    Leave track
                  </button>
                )}
              </div>
            )}
            {pauseGamepadIndexes.length > 0 && <GamepadDialogHint />}
            {resumeError && <p className="start-run-error" role="alert">{resumeError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/** Skewed parallelogram used for every HUD panel (PRD §7.6 comic framing). */
