import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { scheduleCalibrationPulse } from "../audio/calibrationPulse";
import {
  analyzeCalibration, calibrationBeatTimes, matchCalibrationTap,
  CALIBRATION_BEAT_COUNT, CALIBRATION_BEAT_MS, CALIBRATION_LEAD_IN_MS,
  type CalibrationAnalysis, type CalibrationSample,
} from "../lib/calibration";
import { clockTimeAtInputMs, saveDuohertzOffsetMs } from "./timing";

type Round = {
  context: AudioContext;
  beatTimesMs: number[];
  samples: CalibrationSample[];
  used: Set<number>;
  cancelPulses: (() => void)[];
  timer: number;
};

export function DuohertzTimingCalibration({ currentOffsetMs, onOffsetChange, onBusyChange }: {
  currentOffsetMs: number;
  onOffsetChange: (offsetMs: number) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "starting" | "listening" | "result">("idle");
  const [expanded, setExpanded] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [result, setResult] = useState<CalibrationAnalysis | null>(null);
  const [message, setMessage] = useState("");
  const roundRef = useRef<Round | null>(null);
  const pendingContextRef = useRef<AudioContext | null>(null);
  const startPendingRef = useRef(false);
  const generationRef = useRef(0);

  function closeRound(round: Round) {
    window.clearTimeout(round.timer);
    round.cancelPulses.forEach((cancel) => cancel());
    void round.context.close().catch(() => {});
    if (roundRef.current === round) roundRef.current = null;
  }

  function cancel() {
    generationRef.current++;
    if (roundRef.current) closeRound(roundRef.current);
    if (pendingContextRef.current) {
      void pendingContextRef.current.close().catch(() => {});
      pendingContextRef.current = null;
    }
    startPendingRef.current = false;
    onBusyChange(false);
    setPhase("idle");
  }

  async function start() {
    if (startPendingRef.current || roundRef.current) return;
    startPendingRef.current = true;
    const generation = ++generationRef.current;
    setPhase("starting");
    setResult(null);
    setTapCount(0);
    setMessage("");
    onBusyChange(true);
    let context: AudioContext | null = null;
    try {
      context = new AudioContext();
      pendingContextRef.current = context;
      await context.resume();
      if (pendingContextRef.current === context) pendingContextRef.current = null;
      if (generation !== generationRef.current) {
        void context.close().catch(() => {});
        return;
      }
      const startSeconds = context.currentTime + CALIBRATION_LEAD_IN_MS / 1000;
      const round: Round = {
        context,
        beatTimesMs: calibrationBeatTimes(startSeconds * 1000),
        samples: [],
        used: new Set(),
        cancelPulses: [],
        timer: 0,
      };
      roundRef.current = round;
      for (let index = 0; index < CALIBRATION_BEAT_COUNT; index++) {
        round.cancelPulses.push(scheduleCalibrationPulse(context,
          startSeconds + index * CALIBRATION_BEAT_MS / 1000, index === 0));
      }
      round.timer = window.setTimeout(() => {
        if (roundRef.current !== round) return;
        const analysis = analyzeCalibration(round.samples);
        closeRound(round);
        onBusyChange(false);
        setResult(analysis);
        setPhase("result");
      }, CALIBRATION_LEAD_IN_MS + (CALIBRATION_BEAT_COUNT - 1) * CALIBRATION_BEAT_MS + 450);
      setPhase("listening");
    } catch {
      if (context) void context.close().catch(() => {});
      if (generation !== generationRef.current) return;
      onBusyChange(false);
      setPhase("idle");
      setMessage("Sound could not start. Check this browser's audio permission and try again.");
    } finally {
      if (generation === generationRef.current) startPendingRef.current = false;
    }
  }

  function tap(eventTimeStamp?: number) {
    const round = roundRef.current;
    if (!round) return;
    const sampledAt = performance.now();
    const tapTimeMs = clockTimeAtInputMs(round.context.currentTime * 1000,
      eventTimeStamp, sampledAt, performance.timeOrigin);
    const sample = matchCalibrationTap(tapTimeMs, round.beatTimesMs, round.used);
    if (!sample) return;
    round.used.add(sample.beatIndex);
    round.samples.push(sample);
    setTapCount(round.samples.length);
  }

  function pointerTap(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    tap(event.timeStamp);
  }

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (event.repeat || (event.code !== "Space" && event.code !== "KeyF" && event.code !== "KeyJ")
        || !roundRef.current) return;
      const target = event.target;
      if (target instanceof Element
        && target.closest("button, input, select, textarea, a, summary, [contenteditable], [role='button']")
        && !target.closest(".dh-lab__calibration-pad")) return;
      event.preventDefault();
      tap(event.timeStamp);
    };
    const interrupted = () => {
      if (document.hidden && (roundRef.current || startPendingRef.current)) cancel();
    };
    window.addEventListener("keydown", keyDown);
    document.addEventListener("visibilitychange", interrupted);
    return () => {
      window.removeEventListener("keydown", keyDown);
      document.removeEventListener("visibilitychange", interrupted);
    };
  });

  useEffect(() => () => {
    generationRef.current++;
    if (roundRef.current) closeRound(roundRef.current);
    if (pendingContextRef.current) void pendingContextRef.current.close().catch(() => {});
  }, []);

  function applyOffset(offsetMs: number) {
    const saved = saveDuohertzOffsetMs(offsetMs);
    onOffsetChange(offsetMs);
    setMessage(saved ? "Timing saved for this browser." : "Timing applied for this page; browser storage is unavailable.");
  }

  return <section className="dh-lab__calibration" aria-label="Timing calibration">
    <button type="button" className="dh-lab__calibration-toggle" aria-expanded={expanded}
      aria-controls="dh-timing-settings" disabled={phase === "starting" || phase === "listening"}
      onClick={() => setExpanded((value) => !value)}>
      <span>Timing sync</span>
      <span>{currentOffsetMs > 0 ? "+" : ""}{currentOffsetMs} ms <span aria-hidden="true">{expanded ? "−" : "+"}</span></span>
    </button>
    {expanded && <div id="dh-timing-settings" className="dh-lab__calibration-body">
      <h2>Match sound and taps</h2>
      <p>Current timing: {currentOffsetMs > 0 ? "+" : ""}{currentOffsetMs} ms. A positive value compensates taps that arrive after the beat.</p>
      {phase === "idle" && <button type="button" onClick={() => void start()}>Check timing with 8 beats</button>}
      {phase === "starting" && <>
        <button type="button" disabled>Starting sound…</button>
        <button type="button" onClick={cancel}>Cancel timing check</button>
      </>}
      {phase === "listening" && <>
        <p role="status">Listen, then tap each pulse. {tapCount} of {CALIBRATION_BEAT_COUNT} captured.</p>
        <button type="button" className="dh-lab__calibration-pad" onPointerDown={pointerTap}>
          Tap the pulse · Space / F / J
        </button>
        <button type="button" onClick={cancel}>Cancel timing check</button>
      </>}
      {phase === "result" && result && <>
        <p role="status">{result.status === "steady"
          ? `Suggested timing: ${result.offsetMs > 0 ? "+" : ""}${result.offsetMs} ms from ${result.sampleCount} taps.`
          : result.status === "not-enough" ? "Not enough taps to measure timing. Try again."
            : "Your taps varied too much for a reliable adjustment. Try again."}</p>
        {result.status === "steady" && <button type="button" onClick={() => applyOffset(result.offsetMs)}>Use suggested timing</button>}
        <button type="button" onClick={() => void start()}>Try timing check again</button>
      </>}
      {phase !== "starting" && phase !== "listening" && currentOffsetMs !== 0 &&
        <button type="button" onClick={() => applyOffset(0)}>Reset to 0 ms</button>}
      {message && <p role="status">{message}</p>}
    </div>}
  </section>;
}
