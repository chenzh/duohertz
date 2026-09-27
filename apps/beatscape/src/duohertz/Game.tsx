import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { decodedAudioCache, type DecodedAudioLease } from "../audio/decodedAudioCache";
import { DEMO_CHARTS, DEMO_DURATION_MS, scheduleDemoAudio, scheduleInputFeedback } from "./demo";
import type { DuohertzChart, DuohertzTier, KeyIndex } from "./chart";
import { DuohertzSession, type JudgmentEvent } from "./session";
import { loadSettings, saveSettings, SETTINGS_CHANGE_EVENT, SETTINGS_STORAGE_KEY } from "../storage/settings";
import { connectedStandardGamepadIndexes, gamepadButtonIsPressed, STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON, STANDARD_GAMEPAD_RIGHT_FACE_BUTTON } from "../input/gamepadInput";
import { hasBrowserShortcutModifier } from "../input/keyMap";
import { useKeyLabels } from "../input/useKeyLabels";
import { pressedDuohertzGamepadKeys } from "./gamepad";
import { DuohertzResultPanel } from "./ResultPanel";
import { DuohertzTimingCalibration } from "./TimingCalibration";
import { clockTimeAtInputMs, judgedSongTimeMs, loadDuohertzOffsetMs } from "./timing";
import { canBindDuohertzCode, DEFAULT_DUOHERTZ_KEYMAP, loadDuohertzKeymap, saveDuohertzKeymap,
  type DuohertzBinding } from "./keymap";
import "./lab.css";
import "./shell.css";

type RunState = "idle" | "starting" | "playing" | "paused" | "resuming" | "finished" | "interrupted";
type PlayMode = "solo" | "duo";
type GameTrack = "sketch" | string;
export type DuohertzPlayableTrack = {
  id: string;
  title: string;
  audioUrl: string;
  coverUrl: string;
  coverThumbUrl?: string;
  coverAlt: string;
  durationMs: number;
  charts: Record<DuohertzTier, DuohertzChart>;
};
export type DuohertzCharacterCard = {
  name: string;
  title: string;
  role: string;
  region: string;
  height: string;
  identity: string;
  traits: string;
  quote: string;
  story: string;
  art: string;
  alt: string;
  sideArt: string;
  sideAlt: string;
};
type GameProps = {
  tracks: readonly DuohertzPlayableTrack[];
  initialTrackId: string;
  preview: boolean;
  allowSketch?: boolean;
  characters?: readonly DuohertzCharacterCard[];
  libraryHref: string;
  radioHref?: string;
};
type Pulse = { id: number; key: KeyIndex };
type Runtime = {
  context: AudioContext;
  musicGain: GainNode;
  feedbackGain: GainNode;
  start: number;
  session: DuohertzSession;
  mode: PlayMode;
  sources: Set<AudioScheduledSourceNode>;
  frame: number;
  step: () => void;
  paused: boolean;
  suspendPending: Promise<void> | null;
  pauseGeneration: number;
  timingOffsetMs: number;
};

const LAB_TIMING = { perfectMs: 60, greatMs: 105, goodMs: 155 };
const NOTE_APPROACH_MS = 1600;
const TIERS: DuohertzTier[] = ["easy", "standard", "hard"];

function notePosition(timeMs: number, songMs: number): number {
  return Math.max(0, Math.min(100, (1 - (timeMs - songMs) / NOTE_APPROACH_MS) * 100));
}

function stopRuntime(runtime: Runtime | null) {
  if (!runtime) return;
  cancelAnimationFrame(runtime.frame);
  for (const source of runtime.sources) {
    try { source.stop(); } catch { /* already ended */ }
  }
  runtime.sources.clear();
  void runtime.context.close();
}

function trackSource(runtime: Runtime, source: AudioScheduledSourceNode) {
  runtime.sources.add(source);
  source.addEventListener("ended", () => runtime.sources.delete(source), { once: true });
}

function noteKeys(note: (typeof DEMO_CHARTS)["easy"]["notes"][number]): KeyIndex[] {
  return note.type === "chord" ? note.keys : [note.key];
}

export function DuohertzGame({ tracks, initialTrackId, preview, allowSketch = false,
  characters = [], libraryHref, radioHref }: GameProps) {
  if (!allowSketch && !tracks.some((item) => item.id === initialTrackId)) {
    throw new Error(`duohertz track is unavailable: ${initialTrackId}`);
  }
  const [tier, setTier] = useState<DuohertzTier>("easy");
  const [playMode, setPlayMode] = useState<PlayMode>("solo");
  const [track, setTrack] = useState<GameTrack>(initialTrackId);
  const [trackQuery, setTrackQuery] = useState("");
  const [runState, setRunState] = useState<RunState>("idle");
  const [songMs, setSongMs] = useState(0);
  const [stats, setStats] = useState<ReturnType<DuohertzSession["result"]> | null>(null);
  const [duoStats, setDuoStats] = useState<[ReturnType<DuohertzSession["resultForKey"]>, ReturnType<DuohertzSession["resultForKey"]>] | null>(null);
  const [last, setLast] = useState<JudgmentEvent | null>(null);
  const [error, setError] = useState("");
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [resumeSeconds, setResumeSeconds] = useState(3);
  const [settings, setSettings] = useState(loadSettings);
  const [timingOffsetMs, setTimingOffsetMs] = useState(loadDuohertzOffsetMs);
  const [keymap, setKeymap] = useState(loadDuohertzKeymap);
  const [binding, setBinding] = useState<DuohertzBinding | null>(null);
  const [keymapMessage, setKeymapMessage] = useState("");
  const [calibrationBusy, setCalibrationBusy] = useState(false);
  const [characterView, setCharacterView] = useState<"front" | "side">("front");
  const runtimeRef = useRef<Runtime | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef(settings);
  const startPendingTokenRef = useRef<number | null>(null);
  const startAudioLeaseRef = useRef<DecodedAudioLease | null>(null);
  const startTokenRef = useRef(0);
  const ownersRef = useRef(new Map<KeyIndex, Set<string>>());
  const gamepadIndexesRef = useRef<number[]>([]);
  const gamepadHeldRef = useRef(new Map<KeyIndex, string>());
  const lastUiMsRef = useRef(-Infinity);
  const nextPulseIdRef = useRef(0);
  const pulseTimersRef = useRef<Set<number>>(new Set());
  const resumeTimerRef = useRef<number | null>(null);
  const selected = track === "sketch" ? null : tracks.find((item) => item.id === track) ?? null;
  const visibleTracks = useMemo(() => {
    const query = trackQuery.trim().toLowerCase();
    return query ? tracks.filter((item) => `${item.title} ${item.id}`.toLowerCase().includes(query)) : tracks;
  }, [trackQuery, tracks]);
  const activeTier = playMode === "duo" && tier === "easy" ? "standard" : tier;
  const [oneLabel, leftLabel, rightLabel] = useKeyLabels([keymap.one, keymap.left, keymap.right], "auto");
  const chart = selected ? selected.charts[activeTier] : DEMO_CHARTS[activeTier];
  const durationMs = selected ? selected.durationMs : DEMO_DURATION_MS;
  const runActive = runState === "starting" || runState === "playing" || runState === "paused" || runState === "resuming";

  function selectedGamepads(): (Gamepad | null)[] {
    if (typeof navigator.getGamepads !== "function") return [];
    try {
      const gamepads = navigator.getGamepads();
      return gamepadIndexesRef.current.map((index) => gamepads[index] ?? null);
    } catch {
      // Browser permissions can revoke controller access during an active run.
      return [];
    }
  }

  function pressedGamepadOwners(inputCount: 1 | 2, mode: PlayMode,
    gamepads = selectedGamepads()): Map<KeyIndex, string> {
    const owners = new Map<KeyIndex, string>();
    const [first, second] = gamepads;
    const firstIndex = gamepadIndexesRef.current[0];
    if (mode === "solo") {
      if (!first || firstIndex === undefined) return owners;
      for (const key of pressedDuohertzGamepadKeys(first, inputCount)) owners.set(key, `gamepad:${firstIndex}:${key}`);
      return owners;
    }
    if (first?.connected && first.mapping === "standard" && firstIndex !== undefined
      && gamepadButtonIsPressed(first.buttons[STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON])) {
      owners.set(0, `gamepad:${firstIndex}:0`);
    }
    const secondIndex = gamepadIndexesRef.current[1];
    if (second?.connected && second.mapping === "standard" && secondIndex !== undefined) {
      if (gamepadButtonIsPressed(second.buttons[STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON])) owners.set(1, `gamepad:${secondIndex}:0`);
    } else if (secondIndex === undefined && first?.connected && first.mapping === "standard" && firstIndex !== undefined
      && gamepadButtonIsPressed(first.buttons[STANDARD_GAMEPAD_RIGHT_FACE_BUTTON])) {
      owners.set(1, `gamepad:${firstIndex}:1`);
    }
    return owners;
  }

  function captureGamepadBaseline(inputCount: 1 | 2, mode: PlayMode, assign = false) {
    if (assign) {
      try {
        gamepadIndexesRef.current = connectedStandardGamepadIndexes(navigator.getGamepads()).slice(0, mode === "duo" ? 2 : 1);
      } catch {
        gamepadIndexesRef.current = [];
      }
    }
    gamepadHeldRef.current = pressedGamepadOwners(inputCount, mode);
  }

  function pollGamepad(inputCount: 1 | 2, mode: PlayMode) {
    const gamepads = selectedGamepads();
    const disconnectedIndex = gamepadIndexesRef.current.findIndex((_, index) =>
      !gamepads[index]?.connected || gamepads[index]?.mapping !== "standard");
    if (disconnectedIndex !== -1) {
      setError(mode === "duo"
        ? `Player ${disconnectedIndex + 1} controller disconnected. Reconnect it or use keyboard/touch, then Resume.`
        : "Controller disconnected. Reconnect it or use keyboard/touch, then Resume.");
      pauseRun();
      return;
    }
    const next = pressedGamepadOwners(inputCount, mode, gamepads);
    const previous = gamepadHeldRef.current;
    gamepadHeldRef.current = next;
    const timestampFor = (key: KeyIndex) => {
      if (mode === "duo" && key === 1 && gamepadIndexesRef.current[1] !== undefined) {
        return gamepads[1]?.connected ? gamepads[1].timestamp : undefined;
      }
      return gamepads[0]?.connected ? gamepads[0].timestamp : undefined;
    };
    for (const [key, owner] of previous) {
      if (next.get(key) !== owner) release(key, owner, timestampFor(key));
    }
    for (const [key, owner] of next) {
      if (previous.get(key) !== owner) press(key, owner, timestampFor(key));
    }
  }

  function clearResumeTimer() {
    if (resumeTimerRef.current !== null) window.clearInterval(resumeTimerRef.current);
    resumeTimerRef.current = null;
  }

  function clearPulseTimers() {
    for (const timer of pulseTimersRef.current) window.clearTimeout(timer);
    pulseTimersRef.current.clear();
  }

  function endRun(next: RunState) {
    startTokenRef.current++;
    startAudioLeaseRef.current?.release();
    startAudioLeaseRef.current = null;
    startPendingTokenRef.current = null;
    clearResumeTimer();
    const runtime = runtimeRef.current;
    if (runtime) {
      setStats(runtime.session.result());
      setDuoStats(runtime.mode === "duo" ? [runtime.session.resultForKey(0), runtime.session.resultForKey(1)] : null);
      stopRuntime(runtime);
      runtimeRef.current = null;
    }
    ownersRef.current.clear();
    gamepadIndexesRef.current = [];
    gamepadHeldRef.current.clear();
    clearPulseTimers();
    setPulses([]);
    setRunState(next);
  }

  function pauseRun() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.pauseGeneration++;
    if (runtime.paused) {
      clearResumeTimer();
      runtime.suspendPending = runtime.context.suspend();
      void runtime.suspendPending.catch(() => {
        if (runtimeRef.current === runtime) endRun("interrupted");
      });
      setRunState("paused");
      return;
    }
    runtime.paused = true;
    cancelAnimationFrame(runtime.frame);
    ownersRef.current.clear();
    clearPulseTimers();
    setPulses([]);
    runtime.suspendPending = runtime.context.suspend();
    void runtime.suspendPending.catch(() => {
      if (runtimeRef.current === runtime) endRun("interrupted");
    });
    setRunState("paused");
  }

  async function wakeRuntime(runtime: Runtime, pauseGeneration: number) {
    try {
      await runtime.suspendPending;
      if (runtimeRef.current !== runtime || runtime.pauseGeneration !== pauseGeneration || document.hidden) return;
      await runtime.context.resume();
      if (runtimeRef.current !== runtime) return;
      if (runtime.pauseGeneration !== pauseGeneration || document.hidden) {
        runtime.suspendPending = runtime.context.suspend();
        setRunState("paused");
        return;
      }
      runtime.paused = false;
      captureGamepadBaseline(runtime.session.chart.input_count, runtime.mode, true);
      lastUiMsRef.current = -Infinity;
      setError("");
      setRunState("playing");
      runtime.frame = requestAnimationFrame(runtime.step);
    } catch {
      if (runtimeRef.current === runtime) endRun("interrupted");
    }
  }

  function resumeRun() {
    const runtime = runtimeRef.current;
    if (!runtime?.paused || resumeTimerRef.current !== null || document.hidden) return;
    setResumeSeconds(3);
    setRunState("resuming");
    const pauseGeneration = runtime.pauseGeneration;
    let seconds = 3;
    resumeTimerRef.current = window.setInterval(() => {
      if (runtimeRef.current !== runtime || document.hidden) {
        clearResumeTimer();
        if (runtimeRef.current === runtime) setRunState("paused");
        return;
      }
      seconds--;
      if (seconds > 0) setResumeSeconds(seconds);
      else {
        clearResumeTimer();
        void wakeRuntime(runtime, pauseGeneration);
      }
    }, 1000);
  }

  async function startRun() {
    if (startPendingTokenRef.current !== null || calibrationBusy) return;
    setBinding(null);
    endRun("idle");
    const startToken = startTokenRef.current;
    startPendingTokenRef.current = startToken;
    setSongMs(0);
    setDuoStats(null);
    setLast(null);
    setError("");
    let context: AudioContext | null = null;
    let audioLease: DecodedAudioLease | null = null;
    try {
      setRunState("starting");
      context = new AudioContext();
      const audioContext = context;
      await audioContext.resume();
      if (startToken !== startTokenRef.current) {
        void audioContext.close();
        return;
      }
      let buffer: AudioBuffer | null = null;
      if (selected) {
        audioLease = decodedAudioCache.acquire(audioContext, selected.audioUrl);
        startAudioLeaseRef.current = audioLease;
        buffer = await audioLease.promise;
        if (startToken !== startTokenRef.current) {
          void audioContext.close();
          return;
        }
      }
      const start = audioContext.currentTime + 0.24;
      const musicGain = audioContext.createGain();
      musicGain.gain.value = settingsRef.current.musicVolume;
      musicGain.connect(audioContext.destination);
      const feedbackGain = audioContext.createGain();
      feedbackGain.gain.value = settingsRef.current.hitsound ? settingsRef.current.sfxVolume : 0;
      feedbackGain.connect(audioContext.destination);
      const session = new DuohertzSession(chart, LAB_TIMING);
      const sources: AudioScheduledSourceNode[] = [];
      if (buffer) {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(musicGain);
        source.start(start);
        sources.push(source);
      } else {
        sources.push(...scheduleDemoAudio(audioContext, start, musicGain));
      }
      const runtime: Runtime = { context: audioContext, musicGain, feedbackGain, start, session, mode: playMode, sources: new Set(), frame: 0, step: () => {}, paused: false, suspendPending: null, pauseGeneration: 0, timingOffsetMs };
      for (const source of sources) trackSource(runtime, source);
      runtimeRef.current = runtime;
      captureGamepadBaseline(chart.input_count, playMode, true);
      setStats(session.result());
      if (playMode === "duo") setDuoStats([session.resultForKey(0), session.resultForKey(1)]);
      setRunState("playing");
      if (!preview && window.matchMedia("(max-width: 640px)").matches) {
        window.requestAnimationFrame(() => {
          if (runtimeRef.current === runtime) stageRef.current?.scrollIntoView({ block: "center" });
        });
      }
      const frame = () => {
        if (runtimeRef.current !== runtime || runtime.paused) return;
        const now = (audioContext.currentTime - start) * 1000;
        pollGamepad(chart.input_count, playMode);
        if (runtime.paused) return;
        const missed = session.tick(judgedSongTimeMs(now, runtime.timingOffsetMs));
        if (missed.length) setLast(missed[missed.length - 1]);
        if (now - lastUiMsRef.current >= 32) {
          setSongMs(Math.max(0, now));
          setStats(session.result());
          if (playMode === "duo") setDuoStats([session.resultForKey(0), session.resultForKey(1)]);
          lastUiMsRef.current = now;
        }
        if (now >= durationMs + LAB_TIMING.goodMs + Math.max(0, runtime.timingOffsetMs)) {
          setSongMs(durationMs);
          endRun("finished");
          return;
        }
        runtime.frame = requestAnimationFrame(frame);
      };
      runtime.step = frame;
      runtime.frame = requestAnimationFrame(frame);
    } catch {
      if (context) void context.close();
      if (startToken !== startTokenRef.current) return;
      setError("Audio could not start. Check this browser's sound permission and try again.");
      setRunState("idle");
    } finally {
      if (startPendingTokenRef.current === startToken) startPendingTokenRef.current = null;
      if (startAudioLeaseRef.current === audioLease) startAudioLeaseRef.current = null;
    }
  }

  function inputSongTimeMs(runtime: Runtime, eventTimeStamp?: number) {
    const sampledAt = performance.now();
    const now = (runtime.context.currentTime - runtime.start) * 1000;
    return judgedSongTimeMs(clockTimeAtInputMs(now, eventTimeStamp, sampledAt, performance.timeOrigin),
      runtime.timingOffsetMs);
  }

  function press(key: KeyIndex, owner: string, eventTimeStamp?: number) {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.paused) return;
    const owners = ownersRef.current.get(key) ?? new Set<string>();
    if (owners.has(owner)) return;
    const firstOwner = owners.size === 0;
    owners.add(owner);
    ownersRef.current.set(key, owners);
    if (!firstOwner) return;
    if (settingsRef.current.hitsound && settingsRef.current.sfxVolume > 0) {
      trackSource(runtime, scheduleInputFeedback(runtime.context, key, runtime.feedbackGain));
    }
    const pulseId = ++nextPulseIdRef.current;
    setPulses((current) => [...current.slice(-5), { id: pulseId, key }]);
    const pulseTimer = window.setTimeout(() => {
      pulseTimersRef.current.delete(pulseTimer);
      setPulses((current) => current.filter((pulse) => pulse.id !== pulseId));
    }, 640);
    pulseTimersRef.current.add(pulseTimer);
    const event = runtime.session.press(key, inputSongTimeMs(runtime, eventTimeStamp));
    if (event) setLast(event);
    setStats(runtime.session.result());
    if (runtime.mode === "duo") setDuoStats([runtime.session.resultForKey(0), runtime.session.resultForKey(1)]);
  }

  function release(key: KeyIndex, owner: string, eventTimeStamp?: number) {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.paused) return;
    const owners = ownersRef.current.get(key);
    if (!owners?.delete(owner) || owners.size > 0) return;
    ownersRef.current.delete(key);
    const event = runtime.session.release(key, inputSongTimeMs(runtime, eventTimeStamp));
    if (event) setLast(event);
    setStats(runtime.session.result());
    if (runtime.mode === "duo") setDuoStats([runtime.session.resultForKey(0), runtime.session.resultForKey(1)]);
  }

  useEffect(() => {
    if (binding === null) return;
    const captureBinding = (event: KeyboardEvent) => {
      if (event.code === "Tab") {
        setBinding(null);
        return;
      }
      if (hasBrowserShortcutModifier(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      if (event.code === "Escape") {
        setBinding(null);
        setKeymapMessage("Key change canceled.");
        return;
      }
      if (!canBindDuohertzCode(event.code)) {
        setKeymapMessage("Choose a letter, number, arrow, or Space key.");
        return;
      }
      const next = { ...keymap, [binding]: event.code };
      if (next.left === next.right) {
        setKeymapMessage("Left and right need different keys.");
        return;
      }
      if (!saveDuohertzKeymap(next)) {
        setKeymapMessage("Could not save keys on this device. Try again.");
        return;
      }
      setKeymap(next);
      setBinding(null);
      setKeymapMessage("Keyboard controls saved on this device.");
    };
    window.addEventListener("keydown", captureBinding, true);
    return () => window.removeEventListener("keydown", captureBinding, true);
  }, [binding, keymap]);

  useEffect(() => {
    const keyFor = (code: string): KeyIndex | null => {
      if (playMode === "solo" && tier === "easy") return code === keymap.one ? 0 : null;
      if (code === keymap.left) return 0;
      if (code === keymap.right) return 1;
      return null;
    };
    const keyDown = (event: KeyboardEvent) => {
      if (hasBrowserShortcutModifier(event)) return;
      if (event.code === "Escape" && runtimeRef.current) {
        event.preventDefault();
        if (!event.repeat) {
          if (runtimeRef.current.paused && resumeTimerRef.current === null) resumeRun();
          else pauseRun();
        }
        return;
      }
      const key = keyFor(event.code);
      if (key === null || !runtimeRef.current || runtimeRef.current.paused) return;
      const target = event.target;
      if (target instanceof Element
        && target.closest("button, input, select, textarea, a, summary, [contenteditable], [role='button']")
        && !target.closest(".dh-lab__start, .dh-lab__pad")) return;
      event.preventDefault();
      if (!event.repeat) press(key, `keyboard:${event.code}`, event.timeStamp);
    };
    const keyUp = (event: KeyboardEvent) => {
      const key = keyFor(event.code);
      if (key === null || !runtimeRef.current || runtimeRef.current.paused) return;
      if (!ownersRef.current.get(key)?.has(`keyboard:${event.code}`)) return;
      event.preventDefault();
      release(key, `keyboard:${event.code}`, event.timeStamp);
    };
    const visibility = () => {
      if (!document.hidden) return;
      if (runtimeRef.current) pauseRun();
      else if (startPendingTokenRef.current !== null) endRun("interrupted");
    };
    const blur = () => {
      if (runtimeRef.current) pauseRun();
      else if (startPendingTokenRef.current !== null) endRun("interrupted");
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [tier, playMode, keymap]);

  useEffect(() => () => {
    startTokenRef.current++;
    startAudioLeaseRef.current?.release();
    clearResumeTimer();
    stopRuntime(runtimeRef.current);
    runtimeRef.current = null;
    gamepadIndexesRef.current = [];
    gamepadHeldRef.current.clear();
    clearPulseTimers();
  }, []);

  useEffect(() => {
    const refresh = () => {
      const next = loadSettings();
      settingsRef.current = next;
      setSettings(next);
      const runtime = runtimeRef.current;
      if (runtime) {
        runtime.musicGain.gain.setTargetAtTime(next.musicVolume, runtime.context.currentTime, 0.02);
        runtime.feedbackGain.gain.setTargetAtTime(next.hitsound ? next.sfxVolume : 0, runtime.context.currentTime, 0.02);
      }
    };
    const storage = (event: StorageEvent) => {
      if (event.key === SETTINGS_STORAGE_KEY) refresh();
    };
    window.addEventListener(SETTINGS_CHANGE_EVENT, refresh);
    window.addEventListener("storage", storage);
    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", storage);
    };
  }, []);

  function pointerDown(event: ReactPointerEvent<HTMLButtonElement>, key: KeyIndex) {
    if (!runtimeRef.current || runtimeRef.current.paused) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    press(key, `pointer:${event.pointerId}`, event.timeStamp);
  }

  function pointerUp(event: ReactPointerEvent<HTMLButtonElement>, key: KeyIndex) {
    release(key, `pointer:${event.pointerId}`, event.timeStamp);
  }

  function revealStartAfterSetup(keyboardSelection: boolean) {
    if (preview) return;
    window.requestAnimationFrame(() => {
      actionsRef.current?.scrollIntoView({ block: "center" });
      if (keyboardSelection) actionsRef.current?.querySelector("button")?.focus({ preventScroll: true });
    });
  }

  if (!selected && !allowSketch) throw new Error(`duohertz track is unavailable: ${track}`);

  const keyCountControls = <div className="dh-lab__controls" role="group" aria-label="Choose key count">
    {TIERS.map((choice) => (
      <button key={choice} type="button" disabled={runActive || (playMode === "duo" && choice === "easy")}
        aria-pressed={activeTier === choice} onClick={(event) => { setTier(choice); setStats(null); setDuoStats(null); setSongMs(0); setLast(null); revealStartAfterSetup(event.detail === 0); }}>
        {choice === "easy" ? "1 key · Easy" : choice === "standard" ? "2 keys · Standard" : "2 keys · Hard"}
      </button>
    ))}
  </div>;

  const settingsControls = <>
    <div className="dh-lab__mode" role="group" aria-label="Choose play mode">
      <button type="button" disabled={runActive} aria-pressed={playMode === "solo"}
        onClick={(event) => { setPlayMode("solo"); setStats(null); setDuoStats(null); setSongMs(0); setLast(null); revealStartAfterSetup(event.detail === 0); }}>
        Solo · one player
      </button>
      <button type="button" disabled={runActive} aria-pressed={playMode === "duo"}
        onClick={(event) => { setPlayMode("duo"); if (tier === "easy") setTier("standard"); setStats(null); setDuoStats(null); setSongMs(0); setLast(null); revealStartAfterSetup(event.detail === 0); }}>
        Duo · two players
      </button>
    </div>
    {preview && keyCountControls}

    <div className="dh-lab__audio" role="group" aria-label="Sound levels">
      <label>Music · {Math.round(settings.musicVolume * 100)}%
        <input type="range" min="0" max="100" step="5" value={Math.round(settings.musicVolume * 100)}
          onChange={(event) => saveSettings({ musicVolume: Number(event.target.value) / 100 })} />
      </label>
      <label>Beat feedback · {settings.hitsound ? `${Math.round(settings.sfxVolume * 100)}%` : "off"}
        <input type="range" min="0" max="100" step="5" value={Math.round(settings.sfxVolume * 100)}
          disabled={!settings.hitsound}
          onChange={(event) => saveSettings({ sfxVolume: Number(event.target.value) / 100 })} />
      </label>
      <label className="dh-lab__audio-toggle">
        <input type="checkbox" checked={settings.hitsound}
          onChange={(event) => saveSettings({ hitsound: event.target.checked })} />
        Play beat feedback
      </label>
    </div>

    {!runActive && <DuohertzTimingCalibration currentOffsetMs={timingOffsetMs}
      onOffsetChange={setTimingOffsetMs} onBusyChange={setCalibrationBusy} />}
    <details className="dh-lab__keymap" onToggle={(event) => { if (!event.currentTarget.open) setBinding(null); }}>
      <summary>Keyboard controls · {oneLabel ?? "Space"} / {leftLabel ?? "F"} / {rightLabel ?? "J"}</summary>
      <div className="dh-lab__keymap-body">
        <p>Choose physical keys for one-key play and the left/right beats. Changes apply to duohertz only.</p>
        {(["one", "left", "right"] as const).map((name) => <button key={name} type="button"
          disabled={runActive} aria-pressed={binding === name}
          onClick={() => { setBinding(name); setKeymapMessage("Press a key, or Escape to cancel."); }}>
          {name === "one" ? "One key" : name === "left" ? "Left beat" : "Right beat"}: {binding === name ? "Press a key…"
            : name === "one" ? oneLabel : name === "left" ? leftLabel : rightLabel}
        </button>)}
        <button type="button" disabled={runActive} onClick={() => {
          const defaults = { ...DEFAULT_DUOHERTZ_KEYMAP };
          if (saveDuohertzKeymap(defaults)) {
            setKeymap(defaults);
            setBinding(null);
            setKeymapMessage("Default keyboard controls restored.");
          } else setKeymapMessage("Could not save keys on this device. Try again.");
        }}>Restore defaults</button>
        <p role="status" aria-live="polite">{keymapMessage}</p>
      </div>
    </details>
  </>;

  const startLabel = preview ? "Play track with sound" : playMode === "duo" ? "Start Duo beat"
    : activeTier === "easy" ? "Start one-key beat" : "Start two-key beat";
  const actions = <div ref={actionsRef} className="dh-lab__actions">
    <button type="button" className="dh-lab__start" disabled={runState === "starting" || calibrationBusy} onClick={() => void startRun()}>
      {runState === "starting" ? "Starting sound…" : runActive ? "Restart track" : startLabel}
    </button>
    {runState === "playing" && <button type="button" onClick={pauseRun}>Pause</button>}
    {runState === "paused" && <button type="button" onClick={resumeRun}>Resume</button>}
    {runState === "resuming" && <span className="dh-lab__countdown" role="status">Resuming in {resumeSeconds}…</span>}
    {runActive && <button type="button" onClick={() => endRun("interrupted")}>Stop</button>}
  </div>;

  return (
    <section className="dh-lab" data-reduce-motion={settings.reduceMotion || undefined}>
      <header className="dh-lab__header">
        <p className="dh-lab__eyebrow">duohertz · {preview ? "development lab" : "music game"}</p>
        <h1>{preview ? "duohertz" : selected?.title ?? "duohertz"}</h1>
        <p>duohertz · be your true hertz</p>
        {preview && <p>Tap the beat. See the sound.</p>}
        {preview && <small>Internal audio and chart candidates. None is a released track or the new catalog.</small>}
      </header>

      {!preview && keyCountControls}
      {!preview && actions}

      {(allowSketch || tracks.length > 1) && <div className="dh-lab__tracks" role="group"
        aria-label={preview ? "Choose development audio" : "Choose music"}>
        {tracks.length > 1 && <>
          <label className="dh-lab__track-search">{preview ? "Find candidate" : "Find music"}
            <input type="search" value={trackQuery} disabled={runActive}
              placeholder="Track title or ID" onChange={(event) => setTrackQuery(event.target.value)} />
          </label>
          <p className="dh-lab__track-count" role="status">{visibleTracks.length} of {tracks.length} tracks</p>
        </>}
        {allowSketch && <button type="button" aria-pressed={track === "sketch"} disabled={runActive}
          onClick={() => { setTrack("sketch"); setStats(null); setDuoStats(null); setSongMs(0); setLast(null); }}>
          8-second sketch
        </button>}
        {visibleTracks.map((item) => (
          <button key={item.id} type="button" aria-pressed={track === item.id} disabled={runActive}
            onClick={() => { setTrack(item.id); setStats(null); setDuoStats(null); setSongMs(0); setLast(null); }}>
            {item.title} · {item.durationMs / 1000}s {preview ? "candidate" : "track"}
          </button>
        ))}
        {visibleTracks.length === 0 && <p className="dh-lab__track-empty">No matching tracks. Try another title or ID.</p>}
      </div>}

      {preview && settingsControls}

      {preview && actions}
      {error && <p role="alert">{error}</p>}
      {runState === "paused" && <p role="status">Paused. Music and chart timing are frozen. Resume when ready.</p>}
      {runState === "interrupted" && <p role="status">Track stopped. Start again when ready.</p>}
      {runState === "finished" && <p role="status">Track complete. Your result is below.</p>}

      <div ref={stageRef} className="dh-lab__stage" data-input-count={chart.input_count} aria-label={playMode === "duo" ? "Duo: two one-key play areas" : `${chart.input_count} key play area`}>
        {Array.from({ length: chart.input_count }, (_, index) => {
          const key = index as KeyIndex;
          const visible = chart.notes.filter((note) => noteKeys(note).includes(key)
            && note.t * 1000 - songMs < NOTE_APPROACH_MS
            && (note.type === "hold" ? note.end * 1000 > songMs : note.t * 1000 - songMs > -180));
          return (
            <div key={key} className="dh-lab__lane">
              {playMode === "duo" && <strong className="dh-lab__player-label">Player {key + 1}</strong>}
              <div className="dh-lab__fall" aria-hidden="true">
                {visible.map((note) => (
                  <span key={`${note.id}:${key}`} className={`dh-lab__note dh-lab__note--${note.type}`}
                    style={note.type === "hold" ? {
                      top: `${notePosition(note.end * 1000, songMs)}%`,
                      height: `${notePosition(note.t * 1000, songMs) - notePosition(note.end * 1000, songMs)}%`,
                    } : { top: `${notePosition(note.t * 1000, songMs)}%` }} />
                ))}
                {pulses.filter((pulse) => pulse.key === key).map((pulse) => (
                  <span className="dh-lab__pulse" key={pulse.id}>
                    <span className="dh-lab__ripple" />
                    <span className="dh-lab__spark dh-lab__spark--left" />
                    <span className="dh-lab__spark dh-lab__spark--center" />
                    <span className="dh-lab__spark dh-lab__spark--right" />
                  </span>
                ))}
                <span className="dh-lab__line" />
              </div>
              <button type="button" className="dh-lab__pad" disabled={runState !== "playing"}
                onPointerDown={(event) => pointerDown(event, key)}
                onPointerUp={(event) => pointerUp(event, key)}
                onPointerCancel={(event) => pointerUp(event, key)}
                onLostPointerCapture={(event) => pointerUp(event, key)}
                aria-label={playMode === "duo" ? `Player ${key + 1} beat` : chart.input_count === 1 ? "Tap or hold the beat" : `${key === 0 ? "Left" : "Right"} beat`}>
                <span>{chart.input_count === 1 ? oneLabel : key === 0 ? leftLabel : rightLabel}</span>
                <small>{key === 0 ? "Pulse" : "Echo"}</small>
              </button>
            </div>
          );
        })}
      </div>

      <div className="dh-lab__readout" aria-live="polite">
        <span>{(songMs / 1000).toFixed(1)} / {(durationMs / 1000).toFixed(1)} s</span>
        {playMode === "solo" && <>
          <span>{stats ? `${stats.judged}/${stats.total} notes` : `${chart.total_notes} notes`}</span>
          <span>{stats && stats.judged > 0 ? `${stats.accuracy}% accuracy` : "— accuracy"}</span>
        </>}
        <span>{last ? `${playMode === "duo" ? `P${last.key + 1} ` : ""}${last.judgment.toUpperCase()}` : "Listen for the beat"}</span>
      </div>
      {playMode === "duo" && <div className="dh-lab__duo-results" aria-label="Independent Duo results">
        {[0, 1].map((key) => {
          const result = duoStats?.[key];
          return <section key={key} aria-label={`Player ${key + 1} result`}>
            <strong>Player {key + 1}</strong>
            <span>{result ? `${result.judged}/${result.total} notes` : "— notes"}</span>
            <span>{result && result.judged > 0 ? `${result.accuracy}% accuracy` : "— accuracy"}</span>
          </section>;
        })}
      </div>}
      {runState === "finished" && stats && <DuohertzResultPanel
        title={selected?.title ?? "8-second sketch"}
        tier={activeTier}
        mode={playMode}
        result={stats}
        duoResults={duoStats}
        coverUrl={selected?.coverThumbUrl ?? selected?.coverUrl}
        onReplay={() => void startRun()}
        libraryHref={libraryHref}
        radioHref={radioHref}
        preview={preview}
      />}
      <p className="dh-lab__hint">{playMode === "duo"
        ? `P1: ${leftLabel} or left pad. P2: ${rightLabel} or right pad. Two controllers use each bottom face button; one shared controller uses bottom and right face buttons.`
        : tier === "easy"
        ? track === "sketch" ? `Press ${oneLabel}, the bottom controller face button, or tap the pad. Hold the final beat until the sound ends.` : `Press ${oneLabel}, the bottom controller face button, or tap the pad. Hold each long note until its tail.`
        : `Press ${leftLabel} and ${rightLabel}, use the bottom and right controller face buttons, or tap both pads. Hard includes simultaneous beats.`}</p>
      {!preview && settingsControls}

      {selected && (
        <figure className="dh-lab__candidate-art">
          <img src={selected.coverThumbUrl ?? selected.coverUrl} width="120" height="120" alt={selected.coverAlt} />
          <figcaption>{selected.title}{preview ? " · candidate art, awaiting review" : ""}</figcaption>
        </figure>
      )}
      {characters.length > 0 && <section className="dh-lab__characters" aria-labelledby="dh-lab-characters-heading">
        <h2 id="dh-lab-characters-heading">The Soundfield · character concepts</h2>
        <p>Front and side concept candidates. Names, visual similarity and final art review remain open.</p>
        <div className="dh-lab__character-views" role="group" aria-label="Character concept view">
          <button type="button" aria-pressed={characterView === "front"} onClick={() => setCharacterView("front")}>Front</button>
          <button type="button" aria-pressed={characterView === "side"} onClick={() => setCharacterView("side")}>Side</button>
        </div>
        <div className="dh-lab__character-grid">
          {characters.map((character) => (
            <article className="dh-lab__character" key={character.name}>
              <img src={characterView === "front" ? character.art : character.sideArt} alt={characterView === "front" ? character.alt : character.sideAlt} width="180" height="270" loading="lazy" />
              <div>
                <h3>{character.name}</h3>
                <p className="dh-lab__character-title">{character.title}</p>
                <p className="dh-lab__character-meta">{character.role} · {character.region} · {character.height}</p>
                <p className="dh-lab__character-identity">{character.identity}</p>
                <p className="dh-lab__character-traits">{character.traits}</p>
                <blockquote>“{character.quote}”</blockquote>
                <details className="dh-lab__character-story">
                  <summary>Read {character.name}'s story</summary>
                  <p>{character.story}</p>
                </details>
              </div>
            </article>
          ))}
        </div>
      </section>}
    </section>
  );
}
