import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { ChartJSON, PlayMode, PlayResult } from "../types/chart";
import { Conductor, unlockAudio } from "../audio/playback";
import { playBreak, playCountdownTick, playHit, playKeyTick } from "../audio/hitsounds";
import { GameSession, type JudgeFx } from "../engine/playState";
import { approachSec, noteScreenY } from "../engine/geometry";
import { receptorYFromGeometry, laneFromX } from "../input/touchInput";
import { loadKeys, loadOffsetMs, loadSettings } from "../storage/settings";

const LANE_COLORS = ["#3DDCFF", "#7CFFB2", "#F5C542", "#FF5C7A"];
const LANE_RGB: Array<[number, number, number]> = [
  [61, 220, 255],
  [124, 255, 178],
  [245, 197, 66],
  [255, 92, 122],
];
const COUNTDOWN_MS = 3000;

type Props = {
  chart: ChartJSON;
  audioUrl: string;
  mode: PlayMode;
  casualSpeed: number;
  onFinish: (result: PlayResult) => void;
};

type Fx = { lane: number; judgment: JudgeFx["judgment"]; born: number };

export function PlayField({ chart, audioUrl, mode, casualSpeed, onFinish }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const conductorRef = useRef<Conductor | null>(null);
  const sessionRef = useRef<GameSession | null>(null);
  const pressedRef = useRef<Set<number>>(new Set());
  const pointerLane = useRef<Map<number, number>>(new Map());
  const fxRef = useRef<Fx[]>([]);
  const finishedRef = useRef(false);
  const lastComboRef = useRef(0);
  const lastCountInt = useRef<number>(-1);
  const offsetMsRef = useRef(0);
  const approachRef = useRef(1);
  const lastNoteMsRef = useRef(0);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const settings = loadSettings();
  const keys = loadKeys();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsStart, setNeedsStart] = useState(true);
  const [paused, setPaused] = useState(false);

  const needsStartRef = useRef(needsStart);
  const pausedRef = useRef(paused);
  needsStartRef.current = needsStart;
  pausedRef.current = paused;

  // Immersive: hide site chrome while playing.
  useEffect(() => {
    document.body.classList.add("play-immersive");
    return () => document.body.classList.remove("play-immersive");
  }, []);

  // Load audio + build the session once per chart.
  useEffect(() => {
    let cancelled = false;
    finishedRef.current = false;
    lastComboRef.current = 0;
    lastCountInt.current = -1;
    fxRef.current = [];
    pressedRef.current.clear();

    const conductor = new Conductor();
    conductorRef.current = conductor;
    const session = new GameSession(chart, mode);
    sessionRef.current = session;

    const scrollBiasMult = (1 + settings.scrollBias) * (mode === "casual" ? casualSpeed : 1);
    approachRef.current = approachSec(chart.ar, chart.bpm, scrollBiasMult);
    offsetMsRef.current = loadOffsetMs() + (chart.audio_offset_ms || 0);
    lastNoteMsRef.current = Math.max(...session.notes.map((n) => n.endMs), 0) + 500;

    conductor.onEnded = () => {
      // handled in the rAF loop; kept as a safety net
    };

    void (async () => {
      try {
        await conductor.load(audioUrl);
        if (cancelled) return;
        setLoading(false);
        setNeedsStart(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Audio load failed");
      }
    })();

    return () => {
      cancelled = true;
      conductor.stop();
      conductorRef.current = null;
      sessionRef.current = null;
    };
  }, [chart, mode, audioUrl, casualSpeed, settings.scrollBias]);

  // Reset state when the chart changes.
  useEffect(() => {
    setLoading(true);
    setError("");
    setNeedsStart(true);
    setPaused(false);
  }, [chart, mode, audioUrl]);

  const startRun = async () => {
    const conductor = conductorRef.current;
    if (!conductor) return;
    await unlockAudio();
    conductor.begin(COUNTDOWN_MS);
    setNeedsStart(false);
    setPaused(false);
  };

  const togglePause = () => {
    const conductor = conductorRef.current;
    if (!conductor) return;
    if (paused) {
      conductor.resume();
      setPaused(false);
    } else {
      conductor.pause();
      setPaused(true);
    }
  };

  // Auto-pause when the tab is hidden; user resumes on return (PRD §4.11).
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && conductorRef.current?.playing) {
        conductorRef.current.pause();
        setPaused(true);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // The game loop. Reads the audio clock, draws to canvas, never re-renders React.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx2d = canvas.getContext("2d")!;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const draw = (effMs: number, st: number, w: number, h: number) => {
      const receptorY = receptorYFromGeometry(h, Math.min(w, h));
      const laneW = w / 4;
      const noteW = Math.min(laneW * 0.66, 42);
      const session = sessionRef.current!;
      const approach = approachRef.current;
      const songSec = effMs / 1000;

      ctx2d.clearRect(0, 0, w, h);

      // lanes + pressed highlight
      for (let i = 0; i < 4; i++) {
        const x = i * laneW;
        if (pressedRef.current.has(i)) {
          ctx2d.fillStyle = `rgba(${LANE_RGB[i][0]},${LANE_RGB[i][1]},${LANE_RGB[i][2]},0.10)`;
          ctx2d.fillRect(x, 0, laneW, h);
        }
        ctx2d.strokeStyle = "rgba(255,255,255,0.06)";
        ctx2d.beginPath();
        ctx2d.moveTo(x, 0);
        ctx2d.lineTo(x, h);
        ctx2d.stroke();
      }

      // receptor line
      ctx2d.strokeStyle = "rgba(232,238,247,0.85)";
      ctx2d.lineWidth = 2;
      ctx2d.beginPath();
      ctx2d.moveTo(0, receptorY);
      ctx2d.lineTo(w, receptorY);
      ctx2d.stroke();
      ctx2d.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const cx = (i + 0.5) * laneW;
        ctx2d.fillStyle = LANE_COLORS[i];
        ctx2d.fillRect(cx - laneW * 0.18, receptorY - 2, laneW * 0.36, 4);
      }

      // notes
      for (const n of session.notes) {
        const d = n.def;
        const yHead = noteScreenY(n.tMs / 1000, songSec, receptorY, approach);
        if (yHead < -60 || yHead > h + 60) {
          if (d.type !== "hold" && d.type !== "slide") continue;
        }
        if (d.type === "tap") {
          if (n.done) continue;
          drawDiamond(ctx2d, (d.lane + 0.5) * laneW, yHead, noteW, LANE_COLORS[d.lane], 1);
        } else if (d.type === "hold") {
          if (n.done) continue;
          const yTail = noteScreenY(n.endMs / 1000, songSec, receptorY, approach);
          const top = Math.min(yHead, yTail);
          const bodyH = Math.abs(yTail - yHead);
          ctx2d.fillStyle = `rgba(${LANE_RGB[d.lane][0]},${LANE_RGB[d.lane][1]},${LANE_RGB[d.lane][2]},0.45)`;
          ctx2d.fillRect((d.lane + 0.5) * laneW - noteW * 0.22, top, noteW * 0.44, bodyH);
          const headAlpha = n.head ? 0.35 : 1;
          drawDiamond(ctx2d, (d.lane + 0.5) * laneW, yHead, noteW, LANE_COLORS[d.lane], headAlpha);
        } else if (d.type === "chord") {
          if (n.done) continue;
          for (const l of d.lanes) {
            const a = n.chord[l] != null ? 0.35 : 1;
            drawDiamond(ctx2d, (l + 0.5) * laneW, yHead, noteW, LANE_COLORS[l], a);
          }
        } else if (d.type === "slide") {
          if (n.done) continue;
          drawDiamond(ctx2d, (d.lane + 0.5) * laneW, yHead, noteW, LANE_COLORS[d.lane], 1);
          const yTail = noteScreenY(n.endMs / 1000, songSec, receptorY, approach);
          ctx2d.strokeStyle = LANE_COLORS[d.to];
          ctx2d.setLineDash([6, 6]);
          ctx2d.beginPath();
          ctx2d.moveTo((d.lane + 0.5) * laneW, yHead);
          ctx2d.lineTo((d.to + 0.5) * laneW, yTail);
          ctx2d.stroke();
          ctx2d.setLineDash([]);
        }
      }

      // FX flashes
      const nowPerf = performance.now();
      fxRef.current = fxRef.current.filter((f) => nowPerf - f.born < 360);
      for (const f of fxRef.current) {
        const age = (nowPerf - f.born) / 360;
        const cx = (f.lane + 0.5) * laneW;
        const [r, g, b] = f.judgment === "miss" ? [255, 92, 122] : LANE_RGB[f.lane];
        ctx2d.strokeStyle = `rgba(${r},${g},${b},${1 - age})`;
        ctx2d.lineWidth = 3;
        ctx2d.beginPath();
        ctx2d.arc(cx, receptorY, 10 + age * 34, 0, Math.PI * 2);
        ctx2d.stroke();
        ctx2d.lineWidth = 1;
      }

      // HUD
      ctx2d.fillStyle = "#E8EEF7";
      ctx2d.font = "600 20px 'IBM Plex Sans', sans-serif";
      ctx2d.textAlign = "left";
      ctx2d.fillText(session.score.toLocaleString(), 14, 28);
      ctx2d.textAlign = "right";
      ctx2d.fillStyle = "#8B9BB0";
      ctx2d.font = "600 16px 'IBM Plex Sans', sans-serif";
      ctx2d.fillText(`${session.getResult().accuracy.toFixed(2)}%`, w - 14, 28);

      if (mode === "arcade") {
        const bw = w - 28;
        ctx2d.fillStyle = "rgba(255,255,255,0.10)";
        ctx2d.fillRect(14, 38, bw, 6);
        ctx2d.fillStyle = session.hp <= 30 ? "#FF5C7A" : "#3DDCFF";
        ctx2d.fillRect(14, 38, (bw * session.hp) / 100, 6);
      }

      if (session.combo >= 2) {
        ctx2d.textAlign = "center";
        ctx2d.fillStyle = "#E8EEF7";
        ctx2d.font = "700 34px 'Sora', sans-serif";
        ctx2d.fillText(`${session.combo}`, w / 2, receptorY * 0.42);
        ctx2d.fillStyle = "#8B9BB0";
        ctx2d.font = "600 12px 'IBM Plex Sans', sans-serif";
        ctx2d.fillText("COMBO", w / 2, receptorY * 0.42 + 18);
      }

      // key hints
      ctx2d.textAlign = "center";
      ctx2d.fillStyle = "#8B9BB0";
      ctx2d.font = "600 12px 'IBM Plex Sans', sans-serif";
      for (let i = 0; i < 4; i++) {
        ctx2d.fillText(keys[i] ?? "", (i + 0.5) * laneW, h - 10);
      }

      // countdown
      if (st < 0) {
        const cd = -st;
        const text = cd > 250 ? String(Math.ceil(cd / 1000)) : "GO";
        ctx2d.textAlign = "center";
        ctx2d.fillStyle = "#3DDCFF";
        ctx2d.font = "800 72px 'Sora', sans-serif";
        ctx2d.fillText(text, w / 2, h / 2);
      }
    };

    const loop = () => {
      const conductor = conductorRef.current;
      const session = sessionRef.current;
      if (!conductor || !session) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const st = conductor.songTimeMs();

      if (!needsStartRef.current && !pausedRef.current) {
        const eff = st - offsetMsRef.current;
        const misses = session.tick(eff);
        for (const m of misses) {
          addFx(m.lane, m.judgment);
          if (settings.hitsound) playHit(m.judgment);
        }
        if (session.consumeSlowTrigger()) conductor.setRate(0.5, 5000);

        // combo-break sound
        if (session.combo === 0 && lastComboRef.current > 0 && settings.hitsound) playBreak();
        lastComboRef.current = session.combo;

        // countdown ticks
        if (st < 0) {
          const ci = Math.ceil(-st / 1000);
          if (ci !== lastCountInt.current) {
            lastCountInt.current = ci;
            if (settings.hitsound) playCountdownTick();
          }
        }

        // finish
        if (!finishedRef.current) {
          if (session.failed) {
            finishedRef.current = true;
            conductor.stop();
            onFinishRef.current(session.getResult());
          } else if (session.isComplete && st >= lastNoteMsRef.current) {
            finishedRef.current = true;
            conductor.stop();
            onFinishRef.current(session.getResult());
          } else if (conductor.finished) {
            finishedRef.current = true;
            conductor.stop();
            onFinishRef.current(session.getResult());
          }
        }
      }

      draw(st < 0 ? st : st - offsetMsRef.current, st, w, h);
      raf = requestAnimationFrame(loop);
    };

    const addFx = (lane: number, judgment: JudgeFx["judgment"]) => {
      fxRef.current.push({ lane, judgment, born: performance.now() });
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [mode, settings.hitsound, keys]);

  const handlePress = (lane: number) => {
    const conductor = conductorRef.current;
    const session = sessionRef.current;
    if (!conductor || !session || needsStartRef.current || pausedRef.current) return;
    if (pressedRef.current.has(lane)) return;
    pressedRef.current.add(lane);
    const eff = conductor.songTimeMs() - offsetMsRef.current;
    const fx = session.press(lane, eff);
    if (fx) {
      fxRef.current.push({ lane: fx.lane, judgment: fx.judgment, born: performance.now() });
      if (settings.hitsound) playHit(fx.judgment);
    } else if (settings.hitsound) {
      playKeyTick();
    }
  };

  const handleRelease = (lane: number) => {
    pressedRef.current.delete(lane);
    const conductor = conductorRef.current;
    const session = sessionRef.current;
    if (!conductor || !session || needsStartRef.current || pausedRef.current) return;
    const eff = conductor.songTimeMs() - offsetMsRef.current;
    const fx = session.release(lane, eff);
    if (fx) {
      fxRef.current.push({ lane: fx.lane, judgment: fx.judgment, born: performance.now() });
      if (settings.hitsound) playHit(fx.judgment);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const lane = keys.findIndex((k) => k.toLowerCase() === e.key.toLowerCase());
      if (lane < 0) return;
      e.preventDefault();
      handlePress(lane);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);

  const onPointerDown = (e: ReactPointerEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const lane = laneFromX(e.clientX - rect.left, rect.width);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointerLane.current.set(e.pointerId, lane);
    handlePress(lane);
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    const lane = pointerLane.current.get(e.pointerId);
    if (lane != null) {
      handleRelease(lane);
      pointerLane.current.delete(e.pointerId);
    }
  };

  return (
    <div className="play-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="play-canvas"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {loading && !error && <div className="overlay">Loading audio…</div>}
      {error && (
        <div className="overlay load-error">
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && needsStart && (
        <div className="overlay">
          <button type="button" className="btn primary unlock-btn" onClick={() => void startRun()}>
            Tap to Start
          </button>
          <p className="unlock-hint">{keys.join(" · ")} when notes hit the line</p>
        </div>
      )}
      {!loading && !error && !needsStart && !paused && (
        <button type="button" className="pause-btn" onClick={togglePause} aria-label="Pause">
          ‖
        </button>
      )}
      {paused && (
        <div className="overlay">
          <p>Scape paused</p>
          <button type="button" className="btn primary" onClick={togglePause}>
            Resume
          </button>
        </div>
      )}
    </div>
  );
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
  alpha: number,
) {
  const h = size / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h);
  ctx.lineTo(cx + h, cy);
  ctx.lineTo(cx, cy + h);
  ctx.lineTo(cx - h, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
