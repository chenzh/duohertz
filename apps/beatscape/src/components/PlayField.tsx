import { useCallback, useEffect, useRef, useState } from "react";
import type { ChartJSON, PlayMode, PlayResult } from "../types/chart";
import { decodeAudioUrl, SongPlayer } from "../audio/playback";
import { playBreak, playHit, playKeyDown, resumeAudio } from "../audio/hitsounds";
import {
  loadKeys,
  loadOffsetMs,
  loadSettings,
} from "../storage/settings";
import {
  approachLeadFor,
  approachLeadMs,
  audioRate,
  finalize,
  initPlay,
  noteLanes,
  noteTime,
  noteY,
  pressLane,
  releaseLane,
  tickMisses,
  visualArFor,
  visualScrollBias,
  type LivePlay,
} from "../engine/playState";
import { accuracyPercent } from "../engine/judge";
import {
  TouchLaneTracker,
  isCoarsePointer,
  isLandscapePhone,
  laneContains,
  laneFromClientX,
  readSafeAreaBottomPx,
  receptorYFromGeometry,
} from "../input/touchInput";

type Props = {
  chart: ChartJSON;
  audioUrl: string;
  mode: PlayMode;
  casualSpeed: number;
  onFinish: (result: PlayResult) => void;
  onFail: (result: PlayResult) => void;
};

const LEAD_MS = 1400;
const LANE_COLORS = ["#3DDCFF", "#8B5CF6", "#EC4899", "#F59E0B"];

export function PlayField({ chart, audioUrl, mode, casualSpeed, onFinish, onFail }: Props) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef(new TouchLaneTracker());
  const playerRef = useRef<SongPlayer | null>(null);
  const [play, setPlay] = useState<LivePlay>(() => initPlay(chart, mode));
  const [songMs, setSongMs] = useState(0);
  const [fieldH, setFieldH] = useState(520);
  const [fieldW, setFieldW] = useState(360);
  const [safeBottom, setSafeBottom] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [audioRetry, setAudioRetry] = useState(0);
  const [needsUnlock, setNeedsUnlock] = useState(true);
  const [pressed, setPressed] = useState<Set<number>>(() => new Set());
  const [touchUi, setTouchUi] = useState(false);
  const [landscape, setLandscape] = useState(false);
  const playRef = useRef(play);
  const startedRef = useRef(started);
  const pressedRef = useRef(pressed);
  const onFinishRef = useRef(onFinish);
  const onFailRef = useRef(onFail);
  playRef.current = play;
  startedRef.current = started;
  pressedRef.current = pressed;
  onFinishRef.current = onFinish;
  onFailRef.current = onFail;

  const settings = loadSettings();
  const offsetMs = loadOffsetMs() + chart.audio_offset_ms;
  const keys = loadKeys();
  const scrollBias = visualScrollBias(mode, casualSpeed) * (1 + settings.scrollBias);
  const receptorY = receptorYFromGeometry(fieldH, fieldW, safeBottom);
  const visualAr = visualArFor(chart, mode);
  const lead = approachLeadMs(visualAr, approachLeadFor(chart, mode, LEAD_MS));

  useEffect(() => {
    setTouchUi(isCoarsePointer());
    const onOrient = () => setLandscape(isLandscapePhone());
    onOrient();
    window.addEventListener("resize", onOrient);
    window.addEventListener("orientationchange", onOrient);
    return () => {
      window.removeEventListener("resize", onOrient);
      window.removeEventListener("orientationchange", onOrient);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setReady(false);
      setLoadError("");
      playerRef.current?.stop();
      try {
        const ctx = new AudioContext();
        const buf = await decodeAudioUrl(ctx, audioUrl);
        if (cancelled) return;
        const player = new SongPlayer(ctx, buf);
        player.onEnded = () => {
          setPlay((p) => {
            if (!p.finished) onFinishRef.current(finalize(p));
            return { ...p, finished: true };
          });
        };
        playerRef.current = player;
        setReady(true);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Audio load failed");
      }
    }
    void init();
    return () => {
      cancelled = true;
      playerRef.current?.stop();
    };
  }, [audioUrl, audioRetry]);

  useEffect(() => {
    setPlay(initPlay(chart, mode));
    setSongMs(0);
    setCountdown(3);
    setStarted(false);
    setNeedsUnlock(true);
    touchRef.current.releaseAll();
    setPressed(new Set());
    playerRef.current?.stop();
  }, [chart, mode, audioUrl]);

  const beginRun = async () => {
    await resumeAudio();
    await playerRef.current?.resume();
    setNeedsUnlock(false);
  };

  useEffect(() => {
    if (!ready || needsUnlock || countdown > 0) return;
    if (countdown === 0 && !started) {
      void playerRef.current?.resume().then(() => {
        playerRef.current?.play(0);
        setStarted(true);
        setCountdown(-1);
      });
    }
  }, [countdown, started, ready, needsUnlock]);

  useEffect(() => {
    if (countdown > 0 && ready && !needsUnlock) {
      const id = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [countdown, ready, needsUnlock]);

  useEffect(() => {
    if (!started) return;
    const rate = audioRate(mode, playRef.current.practiceSlowUntil);
    playerRef.current?.setRate(rate);
  }, [mode, songMs, started]);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const measure = () => {
      setFieldH(el.clientHeight);
      setFieldW(el.clientWidth);
      setSafeBottom(readSafeAreaBottomPx());
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const syncPressedFromTouch = useCallback(() => {
    const lanes = touchRef.current.activeLanes();
    setPressed(new Set(lanes));
  }, []);

  const tick = useCallback(() => {
    if (!started) return;
    const player = playerRef.current;
    if (!player) return;
    const ms = player.currentMs();
    setSongMs(ms);
    setPlay((p) => {
      const next = tickMisses(p, ms, offsetMs, mode);
      if (next.failed && !p.failed) onFailRef.current(finalize(next));
      return next;
    });
  }, [mode, offsetMs, started]);

  useEffect(() => {
    let id = 0;
    const loop = () => {
      tick();
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [tick]);

  const handlePress = useCallback(
    (lane: number) => {
      if (!startedRef.current) return;
      setPressed((s) => new Set(s).add(lane));
      if (settings.hitsound) playKeyDown();
      const ms = playerRef.current?.currentMs() ?? 0;
      setPlay((p) => {
        const prevCombo = p.combo;
        const next = pressLane(p, chart, lane as 0 | 1 | 2 | 3, ms, offsetMs, mode);
        if (settings.hitsound && next.lastFx?.lane === lane && next.lastFx.judgment !== "miss") {
          playHit(next.lastFx.judgment);
        }
        if (next.combo === 0 && prevCombo > 0) playBreak();
        return next;
      });
    },
    [chart, mode, offsetMs, settings.hitsound],
  );

  const handleRelease = useCallback(
    (lane: number) => {
      setPressed((s) => {
        const n = new Set(s);
        n.delete(lane);
        return n;
      });
      if (!startedRef.current) return;
      const ms = playerRef.current?.currentMs() ?? 0;
      setPlay((p) => releaseLane(p, lane, ms, offsetMs, mode));
    },
    [mode, offsetMs],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const lane = keys.findIndex((k) => k.toLowerCase() === e.key.toLowerCase());
      if (lane < 0) return;
      e.preventDefault();
      if (!pressedRef.current.has(lane)) handlePress(lane);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const lane = keys.findIndex((k) => k.toLowerCase() === e.key.toLowerCase());
      if (lane < 0) return;
      handleRelease(lane);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [keys, handlePress, handleRelease]);

  const fieldRect = useCallback((): DOMRect | null => fieldRef.current?.getBoundingClientRect() ?? null, []);

  const onFieldPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      fieldRef.current?.setPointerCapture(e.pointerId);
      const rect = fieldRect();
      if (!rect) return;
      const lane = touchRef.current.press(e.pointerId, laneFromClientX(e.clientX, rect));
      if (lane !== null) handlePress(lane);
      syncPressedFromTouch();
    },
    [fieldRect, handlePress, syncPressedFromTouch],
  );

  const onFieldPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const bound = touchRef.current.boundLane(e.pointerId);
      if (bound === undefined) return;
      const rect = fieldRect();
      if (!rect) return;
      if (!laneContains(bound, e.clientX, rect)) {
        touchRef.current.release(e.pointerId);
        handleRelease(bound);
        syncPressedFromTouch();
      }
    },
    [fieldRect, handleRelease, syncPressedFromTouch],
  );

  const endPointer = useCallback(
    (pointerId: number) => {
      const lane = touchRef.current.release(pointerId);
      if (lane !== null) handleRelease(lane);
      syncPressedFromTouch();
    },
    [handleRelease, syncPressedFromTouch],
  );

  const onFieldPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      endPointer(e.pointerId);
      try {
        fieldRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    [endPointer],
  );

  const onFieldPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      endPointer(e.pointerId);
    },
    [endPointer],
  );

  const onFieldLostPointerCapture = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      endPointer(e.pointerId);
    },
    [endPointer],
  );

  const accPct = accuracyPercent(play.judgments, play.totalNotes);
  const showKeys = !touchUi;

  return (
    <div className="play-wrap">
      <div className="play-hud">
        <div><span className="label">Score</span><strong>{play.score.toLocaleString()}</strong></div>
        <div><span className="label">Combo</span><strong>{play.combo}x</strong></div>
        <div><span className="label">Acc</span><strong>{accPct}%</strong></div>
        {mode === "arcade" && (
          <div className="hp-bar"><div className="hp-fill" style={{ width: `${play.hp}%` }} /></div>
        )}
      </div>
      <div
        className="play-field"
        ref={fieldRef}
        onPointerDown={onFieldPointerDown}
        onPointerMove={onFieldPointerMove}
        onPointerUp={onFieldPointerUp}
        onPointerCancel={onFieldPointerCancel}
        onLostPointerCapture={onFieldLostPointerCapture}
      >
        {landscape && (
          <div className="overlay rotate-hint" aria-live="polite">
            <p>Rotate to portrait for the best play experience</p>
          </div>
        )}
        {loadError && (
          <div className="overlay load-error">
            <p>{loadError}</p>
            <button type="button" className="btn primary" onClick={() => setAudioRetry((n) => n + 1)}>
              Retry audio
            </button>
          </div>
        )}
        {!loadError && !ready && <div className="overlay">Loading audio…</div>}
        {!loadError && ready && needsUnlock && (
          <div className="overlay">
            <button type="button" className="btn primary unlock-btn" onClick={() => void beginRun()}>
              Tap to Start
            </button>
            <p className="unlock-hint">
              {touchUi ? "Tap the four lanes when notes hit the line" : "D · F · J · K when notes hit the line"}
            </p>
          </div>
        )}
        {!loadError && ready && !needsUnlock && countdown >= 0 && (
          <div className="overlay countdown">{countdown === 0 ? "GO!" : countdown}</div>
        )}
        <div className="receptor" style={{ top: receptorY }} />
        {[0, 1, 2, 3].map((lane) => (
          <div
            key={lane}
            className={`lane ${pressed.has(lane) ? "pressed" : ""}`}
            style={{ "--lane": LANE_COLORS[lane] } as React.CSSProperties}
          >
            {play.notes.map((ns, idx) => {
              const n = ns.note;
              const lanes = noteLanes(n);
              if (!lanes.includes(lane as 0 | 1 | 2 | 3)) return null;
              const t = noteTime(n);
              const y = noteY(t, songMs, receptorY, lead, visualAr, scrollBias);
              if (y < -40 || y > fieldH + 40) return null;
              const judged =
                n.type === "chord"
                  ? ns.chordLanes?.[lane as 0 | 1 | 2 | 3]
                  : ns.headJudged;
              if (n.type === "hold" && ns.headJudged && !ns.tailJudged) {
                const yEnd = noteY(n.end, songMs, receptorY, lead, visualAr, scrollBias);
                return (
                  <div key={`${idx}-body`}>
                    <div
                      className="note hold-body"
                      style={{ top: Math.min(y, yEnd), height: Math.abs(yEnd - y), left: "50%" }}
                    />
                    <div className="note diamond hold-head" style={{ top: y, opacity: judged ? 0.35 : 1 }} />
                  </div>
                );
              }
              if (n.type === "hold" && ns.tailJudged) return null;
              if (judged && n.type !== "hold") return null;
              return (
                <div key={idx} className="note diamond tap" style={{ top: y }} />
              );
            })}
            {showKeys && <span className="lane-key">{keys[lane]}</span>}
          </div>
        ))}
        {play.popups.map((p) => (
          <div
            key={p.id}
            className={`judge-popup ${p.judgment}`}
            style={{ top: receptorY - 40, left: `${12.5 + p.lane * 25}%` }}
          >
            {p.text}
          </div>
        ))}
      </div>
    </div>
  );
}
