import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { scheduleCalibrationPulse } from "../audio/calibrationPulse";
import { getAudioContext, unlockAudio } from "../audio/context";
import { LANE_COLORS, SCAPE_COPY } from "../constants/scape";
import {
  pressedStandardGamepadButtons,
  STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON,
  STANDARD_GAMEPAD_RIGHT_FACE_BUTTON,
} from "../input/gamepadInput";
import { useGamepadAssignments } from "../input/useGamepadAssignments";
import { laneFromKeyEvent } from "../input/keyMap";
import { useKeyLabels } from "../input/useKeyLabels";
import {
  analyzeCalibration,
  CALIBRATION_BEAT_COUNT,
  CALIBRATION_BEAT_MS,
  calibrationBeatTimes,
  CALIBRATION_LEAD_IN_MS,
  CALIBRATION_TAP_WINDOW_MS,
  calibrationTimingDirection,
  matchCalibrationTap,
  safeCalibrationReturn,
  type CalibrationSample,
} from "../lib/calibration";
import { firstPlayHref } from "../lib/firstPlay";
import { Link, useNavigate, useRouter } from "../router";
import { CALIBRATION_PAGE_META, usePageMeta } from "../seo/pageMeta";
import { loadKeys, loadOffsetMs, saveOffsetMs, setOnboarded } from "../storage/settings";

type Phase = "intro" | "playing" | "done";

function formatOffset(ms: number): string {
  if (ms === 0) return "0 ms";
  return `${ms > 0 ? "+" : ""}${ms} ms`;
}

function readAssignedStandardGamepad(index: number): Gamepad | null {
  try {
    const gamepad = navigator.getGamepads?.()[index] ?? null;
    return gamepad?.connected && gamepad.mapping === "standard" ? gamepad : null;
  } catch {
    // Permissions Policy may revoke access after a controller connected.
    return null;
  }
}

export function CalibrationPage() {
  usePageMeta(CALIBRATION_PAGE_META);
  const nav = useNavigate();
  const { search } = useRouter();
  const returnTo = useMemo(() => safeCalibrationReturn(search), [search]);
  const currentOffset = useMemo(loadOffsetMs, []);
  const keys = useMemo(loadKeys, []);
  const laneLabels = useKeyLabels(keys);
  const [gamepadIndex] = useGamepadAssignments(1);
  const controllerReady = gamepadIndex !== null;

  const [phase, setPhase] = useState<Phase>("intro");
  const [samples, setSamples] = useState<CalibrationSample[]>([]);
  const [activeLane, setActiveLane] = useState(-1);
  const [beatNumber, setBeatNumber] = useState(0);
  const [audioError, setAudioError] = useState("");
  const [starting, setStarting] = useState(false);
  const [round, setRound] = useState(0);

  const beatTimesRef = useRef<number[]>([]);
  const usedBeatIndexesRef = useRef(new Set<number>());
  const startingRef = useRef(false);
  const startAttemptRef = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const result = useMemo(() => analyzeCalibration(samples), [samples]);
  const timingDirection = calibrationTimingDirection(result.offsetMs);

  const destinationLabel = returnTo === "/settings"
    ? "Save & return to Settings"
    : returnTo?.startsWith("/play/")
      ? "Save & return to run"
      : returnTo
        ? "Save & return"
        : "Save & play first track";

  const leave = useCallback((offset?: number) => {
    // Navigating away is an explicit cancellation. A delayed browser
    // permission result must not start a calibration round after that intent.
    startAttemptRef.current++;
    startingRef.current = false;
    setStarting(false);
    if (offset !== undefined) saveOffsetMs(offset);
    setOnboarded();
    nav(returnTo ?? firstPlayHref());
  }, [nav, returnTo]);

  const start = useCallback(async () => {
    // React cannot commit disabled=true between two same-turn activations, so
    // own the permission attempt synchronously as well as in rendered state.
    if (startingRef.current) return;
    const attempt = ++startAttemptRef.current;
    startingRef.current = true;
    setStarting(true);
    setAudioError("");
    try {
      await unlockAudio();
      if (startAttemptRef.current !== attempt) return;
      setSamples([]);
      usedBeatIndexesRef.current.clear();
      setActiveLane(-1);
      setBeatNumber(0);
      setRound((value) => value + 1);
      setPhase("playing");
    } catch {
      if (startAttemptRef.current === attempt) {
        setAudioError("Audio could not start. Check browser sound permission, then try again.");
      }
    } finally {
      if (startAttemptRef.current === attempt) {
        startingRef.current = false;
        setStarting(false);
      }
    }
  }, []);

  useEffect(() => () => {
    startAttemptRef.current++;
    startingRef.current = false;
  }, []);

  useEffect(() => {
    document.body.classList.toggle("calibration-running", phase === "playing");
    document.body.classList.toggle("calibration-complete", phase === "done");
    return () => {
      document.body.classList.remove("calibration-running");
      document.body.classList.remove("calibration-complete");
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    resultRef.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;

    const ctx = getAudioContext();
    const firstBeatMs = ctx.currentTime * 1_000 + CALIBRATION_LEAD_IN_MS;
    const beatTimes = calibrationBeatTimes(firstBeatMs);
    beatTimesRef.current = beatTimes;
    const cancelPulses = beatTimes.map((beatMs, index) => (
      scheduleCalibrationPulse(ctx, beatMs / 1_000, index === 0 || index === 4)
    ));

    let raf = 0;
    let previousLane = -2;
    let previousBeatNumber = -1;
    const updateVisual = () => {
      const nowMs = ctx.currentTime * 1_000;
      let nextLane = -1;
      for (let index = 0; index < beatTimes.length; index++) {
        const delta = nowMs - beatTimes[index]!;
        if (delta >= 0 && delta <= 145) {
          nextLane = index % laneLabels.length;
          break;
        }
      }

      const nextBeatNumber = nowMs < firstBeatMs
        ? 0
        : Math.min(
          CALIBRATION_BEAT_COUNT,
          Math.floor((nowMs - firstBeatMs) / CALIBRATION_BEAT_MS) + 1,
        );
      if (nextLane !== previousLane) {
        previousLane = nextLane;
        setActiveLane(nextLane);
      }
      if (nextBeatNumber !== previousBeatNumber) {
        previousBeatNumber = nextBeatNumber;
        setBeatNumber(nextBeatNumber);
      }

      const finishAtMs = beatTimes[beatTimes.length - 1]! + CALIBRATION_TAP_WINDOW_MS + 60;
      if (nowMs >= finishAtMs) {
        setActiveLane(-1);
        setPhase("done");
        return;
      }
      raf = requestAnimationFrame(updateVisual);
    };
    raf = requestAnimationFrame(updateVisual);

    return () => {
      cancelAnimationFrame(raf);
      cancelPulses.forEach((cancel) => cancel());
    };
  }, [phase, round, laneLabels.length]);

  const recordTap = useCallback(() => {
    if (phase !== "playing") return;
    const nowMs = getAudioContext().currentTime * 1_000;
    const sample = matchCalibrationTap(
      nowMs,
      beatTimesRef.current,
      usedBeatIndexesRef.current,
    );
    if (!sample) return;
    usedBeatIndexesRef.current.add(sample.beatIndex);
    setSamples((current) => [...current, sample]);
  }, [phase]);

  const runPrimaryResultAction = useCallback(() => {
    if (result.status === "steady") leave(result.offsetMs);
    else void start();
  }, [leave, result.offsetMs, result.status, start]);

  const runSecondaryResultAction = useCallback(() => {
    if (result.status === "steady") void start();
    else if (result.status === "variable") leave(result.offsetMs);
    else leave();
  }, [leave, result.offsetMs, result.status, start]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase !== "playing" || event.repeat) return;
      if (laneFromKeyEvent(event, keys) < 0) return;
      event.preventDefault();
      recordTap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, keys, recordTap]);

  useEffect(() => {
    if (phase !== "playing" || gamepadIndex === null) return;

    let frame = 0;
    let neutral = false;
    let previous = new Set<number>();
    const tick = () => {
      const gamepad = readAssignedStandardGamepad(gamepadIndex);
      if (!gamepad) {
        neutral = false;
        previous = new Set();
        frame = requestAnimationFrame(tick);
        return;
      }

      const pressed = pressedStandardGamepadButtons(gamepad);
      if (!neutral) {
        // Seed the live physical state. A button carried into calibration must
        // be released before a fresh edge can become a timing sample.
        neutral = pressed.size === 0;
      } else {
        for (const button of pressed) {
          if (previous.has(button)) continue;
          recordTap();
          break;
        }
      }
      previous = pressed;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [gamepadIndex, phase, recordTap]);

  useEffect(() => {
    if (phase !== "done" || gamepadIndex === null) return;

    let frame = 0;
    let neutral = false;
    let previousBottom = false;
    let previousRight = false;
    const tick = () => {
      const gamepad = readAssignedStandardGamepad(gamepadIndex);
      if (!gamepad) {
        neutral = false;
        previousBottom = false;
        previousRight = false;
        frame = requestAnimationFrame(tick);
        return;
      }

      const pressed = pressedStandardGamepadButtons(gamepad);
      const bottom = pressed.has(STANDARD_GAMEPAD_BOTTOM_FACE_BUTTON);
      const right = pressed.has(STANDARD_GAMEPAD_RIGHT_FACE_BUTTON);
      if (!neutral) {
        neutral = !bottom && !right;
      } else if (bottom && !previousBottom) {
        runPrimaryResultAction();
      } else if (right && !previousRight) {
        runSecondaryResultAction();
      }
      previousBottom = bottom;
      previousRight = right;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [gamepadIndex, phase, runPrimaryResultAction, runSecondaryResultAction]);

  const controllerResultHint = controllerReady ? (
    <div
      className="calib-result-controller"
      role="note"
      aria-label={result.status === "steady"
        ? returnTo === "/settings"
          ? "Controller result actions. Face down saves and returns to Settings. Face right tries calibration again."
          : "Controller result actions. Face down saves and continues. Face right tries calibration again."
        : result.status === "variable"
          ? "Controller result actions. Face down tries calibration again. Face right uses this offset anyway."
          : "Controller result actions. Face down tries calibration again. Face right keeps the current offset."}
    >
      <span>Controller</span>
      <strong>
        Face down · {result.status === "steady" ? "Save & return" : "Try again"}
      </strong>
      <strong>
        Face right · {result.status === "steady"
          ? "Try again"
          : result.status === "variable"
            ? "Use anyway"
            : "Keep current"}
      </strong>
    </div>
  ) : null;

  return (
    <section className="calibrate calibrate-panel">
      <Link to={returnTo ?? "/"} className="back-link">
        {returnTo === "/settings" ? "Settings" : "Back"}
      </Link>
      <header className="page-header calibrate-header">
        <p className="eyebrow">Timing setup</p>
        <h1>{SCAPE_COPY.calibrateTitle}</h1>
        <p className="tagline">Listen to the pulse, then hit any lane when you hear it.</p>
      </header>

      {phase === "intro" && (
        <div className="calib-intro panel">
          <div className="calib-facts" aria-label="Calibration details">
            <span>8 pulses</span>
            <span>About 5 sec</span>
            <span>Current {formatOffset(currentOffset)}</span>
          </div>
          {controllerReady && (
            <div
              className="unlock-gamepad calib-gamepad"
              role="note"
              aria-label="Controller ready for timing calibration. Click or tap Start once for browser audio, then use the D-pad or four face buttons."
            >
              <span className="unlock-gamepad-buttons" aria-hidden>◀ ▼ ▲ ▶</span>
              <span>
                <strong>Controller ready</strong>
                <small>Start once · then D-pad or face buttons</small>
              </span>
            </div>
          )}
          <button
            type="button"
            className="btn primary calib-main-action"
            onClick={() => void start()}
            disabled={starting}
            aria-busy={starting}
          >
            {starting ? "Starting…" : "Start 8-pulse test"}
          </button>
          <p>
            Use the same speakers or headphones you play with. Bluetooth delay varies by device,
            so recalibrate after switching audio output.
          </p>
        </div>
      )}

      {phase === "playing" && (
        <div className="calib-run">
          <div className="calib-status-row">
            <strong>{beatNumber === 0 ? "Get ready…" : `Pulse ${beatNumber} / ${CALIBRATION_BEAT_COUNT}`}</strong>
            <span>{samples.length} taps captured</span>
          </div>
          <button
            type="button"
            className="btn linkish calib-cancel-run"
            onClick={() => leave()}
          >
            Cancel test
          </button>
          <div className="calib-progress-track" aria-hidden="true">
            <span style={{ width: `${(beatNumber / CALIBRATION_BEAT_COUNT) * 100}%` }} />
          </div>
          {controllerReady && (
            <div
              className="unlock-gamepad calib-gamepad calib-gamepad-live"
              role="note"
              aria-label="Controller timing input active. Use the D-pad or four face buttons on each pulse."
            >
              <span className="unlock-gamepad-buttons" aria-hidden>◀ ▼ ▲ ▶</span>
              <span>
                <strong>Controller timing input</strong>
                <small>D-pad or face buttons · keyboard and touch stay active</small>
              </span>
            </div>
          )}
          <div className="calib-lanes" aria-label="Tap any lane on each pulse">
            {laneLabels.map((label, index) => (
              <button
                key={index}
                type="button"
                className={`calib-lane${activeLane === index ? " flash" : ""}`}
                style={{ ["--lane-color" as string]: LANE_COLORS[index] }}
                aria-label={`Lane ${index + 1} · ${label}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  recordTap();
                }}
              >
                <span>{index + 1}</span>
                <kbd>{label}</kbd>
              </button>
            ))}
          </div>
          <p className="calib-progress" aria-live="polite">
            {samples.length === 0
              ? controllerReady
                ? "Press a D-pad or face button on the sound — not before it."
                : "Tap a lane on the sound — not before it."
              : `${samples.length} of ${CALIBRATION_BEAT_COUNT} pulses recorded`}
          </p>
        </div>
      )}

      {phase === "done" && (
        <div
          ref={resultRef}
          className={`calib-done calib-done-${result.status}`}
          role="region"
          aria-label="Calibration result"
          tabIndex={-1}
        >
          {result.status === "not-enough" ? (
            <>
              <p className="eyebrow">No result saved</p>
              <h2>We need a few more taps</h2>
              <p>
                Only {result.sampleCount} pulse{result.sampleCount === 1 ? " was" : "s were"} captured.
                Tap any lane on at least three pulses.
              </p>
              {controllerResultHint}
              <button
                type="button"
                className="btn primary calib-main-action"
                onClick={() => void start()}
                disabled={starting}
                aria-busy={starting}
              >
                {starting ? "Starting…" : "Try again"}
              </button>
            </>
          ) : (
            <>
              <p className="eyebrow">Suggested offset</p>
              <output className="calib-offset" aria-label={`Suggested offset ${formatOffset(result.offsetMs)}`}>
                {formatOffset(result.offsetMs)}
              </output>
              <p className="calib-direction" data-direction={timingDirection}>
                <strong>
                  {timingDirection === "centered"
                    ? "Timing centered"
                    : `${timingDirection === "late" ? "Late" : "Early"} input detected`}
                </strong>
                <span>
                  {timingDirection === "centered"
                    ? "No timing correction is needed."
                    : `Applying this offset compensates ${Math.abs(result.offsetMs)} ms of ${timingDirection} input.`}
                </span>
              </p>
              <p>
                {result.status === "steady"
                  ? `Consistent run · typical variation ${Math.round(result.medianAbsoluteDeviationMs)} ms.`
                  : `Your taps varied by ${Math.round(result.medianAbsoluteDeviationMs)} ms. Another pass will be more reliable.`}
              </p>
              {result.clamped && (
                <p className="field-hint">BeatScape supports ±200 ms, so this result is capped.</p>
              )}
              {controllerResultHint}
              <div className="calib-result-actions">
                {result.status === "steady" ? (
                  <>
                    <button type="button" className="btn primary" onClick={() => leave(result.offsetMs)}>
                      {destinationLabel}
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => void start()}
                      disabled={starting}
                      aria-busy={starting}
                    >
                      {starting ? "Starting…" : "Try again"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => void start()}
                      disabled={starting}
                      aria-busy={starting}
                    >
                      {starting ? "Starting…" : "Try again"}
                    </button>
                    <button type="button" className="btn ghost" onClick={() => leave(result.offsetMs)}>
                      Use {formatOffset(result.offsetMs)} anyway
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {audioError && <p className="error" role="alert">{audioError}</p>}

      {phase !== "playing" && (
        <button type="button" className="btn linkish calib-keep" onClick={() => leave()}>
          Keep current offset · {formatOffset(currentOffset)}
        </button>
      )}
    </section>
  );
}
