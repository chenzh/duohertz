import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { ChartJSON, PlayMode, PlayResult } from "../types/chart";
import { Conductor, unlockAudio } from "../audio/playback";
import { playBreak, playCountdownTick, playHit, playKeyTick } from "../audio/hitsounds";
import { GameSession, type JudgeFx } from "../engine/playState";
import { approachSec, noteScreenY } from "../engine/geometry";
import { receptorYFromGeometry, laneFromX } from "../input/touchInput";
import { loadKeys, loadOffsetMs, loadSettings } from "../storage/settings";

const LANE_COLORS = ["#25F4EE", "#FE2C55", "#B388FF", "#FFD60A"];
const LANE_RGB: Array<[number, number, number]> = [
  [37, 244, 238],
  [254, 44, 85],
  [179, 136, 255],
  [255, 214, 10],
];
const COUNTDOWN_MS = 3000;
const LANE_FLASH_MS = 180;
const JUDGE_LABEL: Record<string, string> = {
  perfect: "PERFECT",
  great: "GREAT",
  good: "GOOD",
  miss: "MISS",
};
const JUDGE_COLOR: Record<string, string> = {
  perfect: "#25F4EE",
  great: "#FFFFFF",
  good: "#9AA0A6",
  miss: "#FE2C55",
};
const COMBO_MILESTONES = [10, 25, 50, 100, 150, 200, 300];

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
  const laneFlashRef = useRef<number[]>([0, 0, 0, 0]);
  const spritesRef = useRef<HTMLCanvasElement[]>([]);
  const dimRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  // --- juice: particles / screen shake / combo milestone ---
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; born: number; life: number; r: number; g: number; b: number; size: number }>>([]);
  const shakeRef = useRef<{ mag: number; until: number }>({ mag: 0, until: 0 });
  const milestoneRef = useRef<{ text: string; born: number } | null>(null);
  const prevComboRef = useRef(0);
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

  // Juice: burst particles + screen shake on every judged hit/miss.
  const spawnHitFx = (lane: number, judgment: JudgeFx["judgment"]) => {
    const { w, h } = dimRef.current;
    if (!w || !h) return;
    const receptorY = receptorYFromGeometry(h, Math.min(w, h));
    const laneW = w / 4;
    const cx = (lane + 0.5) * laneW;
    const [r, g, b] = judgment === "miss" ? [254, 44, 85] : LANE_RGB[lane];
    const count =
      judgment === "perfect" ? 18 : judgment === "great" ? 12 : judgment === "good" ? 6 : 6;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 5;
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
        size: 1.6 + Math.random() * 2.4,
      });
    }
    const mag = judgment === "perfect" ? 5 : judgment === "great" ? 3.5 : judgment === "good" ? 2 : 7;
    shakeRef.current = { mag, until: performance.now() + 150 };
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

    // Pre-render glowing note sprites once. Per frame we only blit these
    // (drawImage) instead of recomputing shadowBlur on every note — shadowBlur
    // is the single most expensive canvas op and was the main frame-cost on
    // dense charts. The Douyin neon look is baked into the sprite.
    spritesRef.current = LANE_COLORS.map((c) => makeNoteSprite(c, 120));

    const drawNote = (lane: number, x: number, y: number, size: number, alpha: number) => {
      const sp = spritesRef.current[lane];
      if (!sp) return;
      ctx2d.globalAlpha = alpha;
      ctx2d.drawImage(sp, x - size / 2, y - size / 2, size, size);
      ctx2d.globalAlpha = 1;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      dimRef.current = { w, h };
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const draw = (effMs: number, st: number) => {
      const { w, h } = dimRef.current;
      const receptorY = receptorYFromGeometry(h, Math.min(w, h));
      const laneW = w / 4;
      const noteW = Math.min(laneW * 0.66, 42);
      const session = sessionRef.current!;
      const approach = approachRef.current;
      const songSec = effMs / 1000;
      const nowPerf = performance.now();

      ctx2d.clearRect(0, 0, w, h);

      // screen shake: decaying random offset applied to the gameplay layer
      let shx = 0;
      let shy = 0;
      if (nowPerf < shakeRef.current.until) {
        const k = (shakeRef.current.until - nowPerf) / 150;
        const m = shakeRef.current.mag * k;
        shx = (Math.random() * 2 - 1) * m;
        shy = (Math.random() * 2 - 1) * m;
      }
      ctx2d.save();
      ctx2d.translate(shx, shy);

      // lanes + pressed highlight + decaying hit flash
      for (let i = 0; i < 4; i++) {
        const x = i * laneW;
        if (pressedRef.current.has(i)) {
          ctx2d.fillStyle = `rgba(${LANE_RGB[i][0]},${LANE_RGB[i][1]},${LANE_RGB[i][2]},0.16)`;
          ctx2d.fillRect(x, 0, laneW, h);
        }
        const flash = Math.max(0, 1 - (nowPerf - laneFlashRef.current[i]) / LANE_FLASH_MS);
        if (flash > 0) {
          const grad = ctx2d.createLinearGradient(0, receptorY, 0, 0);
          grad.addColorStop(
            0,
            `rgba(${LANE_RGB[i][0]},${LANE_RGB[i][1]},${LANE_RGB[i][2]},${0.55 * flash})`,
          );
          grad.addColorStop(1, `rgba(${LANE_RGB[i][0]},${LANE_RGB[i][1]},${LANE_RGB[i][2]},0)`);
          ctx2d.fillStyle = grad;
          ctx2d.fillRect(x, 0, laneW, receptorY);
        }
        ctx2d.strokeStyle = "rgba(255,255,255,0.06)";
        ctx2d.beginPath();
        ctx2d.moveTo(x, 0);
        ctx2d.lineTo(x, h);
        ctx2d.stroke();
      }

      // receptor line (neon)
      ctx2d.save();
      ctx2d.shadowColor = "#25F4EE";
      ctx2d.shadowBlur = 10;
      ctx2d.strokeStyle = "rgba(255,255,255,0.92)";
      ctx2d.lineWidth = 2;
      ctx2d.beginPath();
      ctx2d.moveTo(0, receptorY);
      ctx2d.lineTo(w, receptorY);
      ctx2d.stroke();
      ctx2d.restore();
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
          drawNote(d.lane, (d.lane + 0.5) * laneW, yHead, noteW, 1);
        } else if (d.type === "hold") {
          if (n.done) continue;
          const yTail = noteScreenY(n.endMs / 1000, songSec, receptorY, approach);
          const top = Math.min(yHead, yTail);
          const bodyH = Math.abs(yTail - yHead);
          ctx2d.fillStyle = `rgba(${LANE_RGB[d.lane][0]},${LANE_RGB[d.lane][1]},${LANE_RGB[d.lane][2]},0.45)`;
          ctx2d.fillRect((d.lane + 0.5) * laneW - noteW * 0.22, top, noteW * 0.44, bodyH);
          const headAlpha = n.head ? 0.35 : 1;
          drawNote(d.lane, (d.lane + 0.5) * laneW, yHead, noteW, headAlpha);
        } else if (d.type === "chord") {
          if (n.done) continue;
          for (const l of d.lanes) {
            const a = n.chord[l] != null ? 0.35 : 1;
            drawNote(l, (l + 0.5) * laneW, yHead, noteW, a);
          }
        } else if (d.type === "slide") {
          if (n.done) continue;
          drawNote(d.lane, (d.lane + 0.5) * laneW, yHead, noteW, 1);
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

      // hit particles (physics: gravity + fade)
      particlesRef.current = particlesRef.current.filter((p) => nowPerf - p.born < p.life);
      for (const p of particlesRef.current) {
        const age = (nowPerf - p.born) / p.life;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.14;
        p.vx *= 0.985;
        ctx2d.globalAlpha = Math.max(0, 1 - age);
        ctx2d.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
        ctx2d.beginPath();
        ctx2d.arc(p.x, p.y, p.size * (1 - age * 0.5), 0, Math.PI * 2);
        ctx2d.fill();
      }
      ctx2d.globalAlpha = 1;

      // FX flashes
      fxRef.current = fxRef.current.filter((f) => nowPerf - f.born < 360);
      for (const f of fxRef.current) {
        const age = (nowPerf - f.born) / 360;
        const cx = (f.lane + 0.5) * laneW;
        const [r, g, b] = f.judgment === "miss" ? [254, 44, 85] : LANE_RGB[f.lane];
        ctx2d.strokeStyle = `rgba(${r},${g},${b},${1 - age})`;
        ctx2d.lineWidth = 3;
        ctx2d.beginPath();
        ctx2d.arc(cx, receptorY, 10 + age * 34, 0, Math.PI * 2);
        ctx2d.stroke();
        ctx2d.lineWidth = 1;

        // floating judgment label — pops in with an overshoot, then settles
        const label = JUDGE_LABEL[f.judgment];
        if (label) {
          const pop = age < 0.18 ? 0.5 + (age / 0.18) * 0.7 : 1.2 - (age - 0.18) * 0.24;
          const isP = f.judgment === "perfect";
          ctx2d.save();
          ctx2d.globalAlpha = Math.max(0, 1 - age * age);
          ctx2d.translate(cx, receptorY - 46 - age * 22);
          ctx2d.scale(pop, pop);
          ctx2d.font = `800 ${isP ? 19 : 15}px 'Sora', sans-serif`;
          ctx2d.textAlign = "center";
          ctx2d.fillStyle = JUDGE_COLOR[f.judgment] || "#FFFFFF";
          if (isP) {
            ctx2d.shadowColor = "#25F4EE";
            ctx2d.shadowBlur = 14;
          }
          ctx2d.fillText(label, 0, 0);
          ctx2d.restore();
        }
      }

      ctx2d.restore(); // end gameplay (shaken) layer — HUD stays stable

      // HUD
      ctx2d.fillStyle = "#FFFFFF";
      ctx2d.font = "600 20px 'IBM Plex Sans', sans-serif";
      ctx2d.textAlign = "left";
      ctx2d.fillText(session.score.toLocaleString(), 14, 28);
      ctx2d.textAlign = "right";
      ctx2d.fillStyle = "#9AA0A6";
      ctx2d.font = "600 16px 'IBM Plex Sans', sans-serif";
      ctx2d.fillText(`${session.getResult().accuracy.toFixed(2)}%`, w - 14, 28);

      if (mode === "arcade") {
        const bw = w - 28;
        ctx2d.fillStyle = "rgba(255,255,255,0.10)";
        ctx2d.fillRect(14, 38, bw, 6);
        ctx2d.fillStyle = session.hp <= 30 ? "#FE2C55" : "#25F4EE";
        ctx2d.fillRect(14, 38, (bw * session.hp) / 100, 6);
      }

      if (session.combo >= 2) {
        // combo escalates in size + color as it climbs
        const tier = session.combo >= 100 ? 3 : session.combo >= 50 ? 2 : session.combo >= 10 ? 1 : 0;
        const sizes = [30, 38, 48, 58];
        const cols = ["#FFFFFF", "#25F4EE", "#B388FF", "#FFD60A"];
        const pulse = 1 + Math.min(0.18, (nowPerf % 600) / 600 / 6);
        ctx2d.save();
        ctx2d.textAlign = "center";
        ctx2d.translate(w / 2, receptorY * 0.42);
        ctx2d.scale(pulse, pulse);
        ctx2d.fillStyle = cols[tier];
        ctx2d.shadowColor = cols[tier];
        ctx2d.shadowBlur = tier > 0 ? 18 : 0;
        ctx2d.font = `800 ${sizes[tier]}px 'Sora', sans-serif`;
        ctx2d.fillText(`${session.combo}`, 0, 0);
        ctx2d.restore();
        ctx2d.textAlign = "center";
        ctx2d.fillStyle = "#9AA0A6";
        ctx2d.font = "600 12px 'IBM Plex Sans', sans-serif";
        ctx2d.fillText("COMBO", w / 2, receptorY * 0.42 + 20);
      }

      // combo milestone flash (center, big, quick)
      if (milestoneRef.current) {
        const age = (nowPerf - milestoneRef.current.born) / 700;
        if (age >= 1) {
          milestoneRef.current = null;
        } else {
          ctx2d.save();
          ctx2d.globalAlpha = 1 - age;
          ctx2d.translate(w / 2, receptorY * 0.6);
          const sc = 0.7 + age * 0.7;
          ctx2d.scale(sc, sc);
          ctx2d.textAlign = "center";
          ctx2d.fillStyle = "#FFD60A";
          ctx2d.shadowColor = "#FFD60A";
          ctx2d.shadowBlur = 26;
          ctx2d.font = "800 42px 'Sora', sans-serif";
          ctx2d.fillText(milestoneRef.current.text, 0, 0);
          ctx2d.restore();
        }
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
      const st = conductor.songTimeMs();

      if (!needsStartRef.current && !pausedRef.current) {
        const eff = st - offsetMsRef.current;
        const misses = session.tick(eff);
        for (const m of misses) {
          addFx(m.lane, m.judgment);
          if (settings.hitsound) playHit(m.judgment);
        }
        if (session.consumeSlowTrigger()) conductor.setRate(0.5, 5000);

        // combo-break sound + combo milestone celebration
        if (session.combo === 0 && lastComboRef.current > 0 && settings.hitsound) playBreak();
        if (session.combo > prevComboRef.current && COMBO_MILESTONES.includes(session.combo)) {
          milestoneRef.current = { text: `${session.combo} COMBO!`, born: performance.now() };
          shakeRef.current = { mag: 9, until: performance.now() + 240 };
        }
        prevComboRef.current = session.combo;
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

      draw(st < 0 ? st : st - offsetMsRef.current, st);
      raf = requestAnimationFrame(loop);
    };

    const addFx = (lane: number, judgment: JudgeFx["judgment"]) => {
      fxRef.current.push({ lane, judgment, born: performance.now() });
      spawnHitFx(lane, judgment);
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
    laneFlashRef.current[lane] = performance.now();
    const eff = conductor.songTimeMs() - offsetMsRef.current;
    const fx = session.press(lane, eff);
    if (fx) {
      fxRef.current.push({ lane: fx.lane, judgment: fx.judgment, born: performance.now() });
      spawnHitFx(fx.lane, fx.judgment);
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
      spawnHitFx(fx.lane, fx.judgment);
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

function makeNoteSprite(color: string, px: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = px;
  c.height = px;
  const g = c.getContext("2d")!;
  const cx = px / 2;
  const cy = px / 2;
  const h = px * 0.3;
  // baked neon glow
  g.shadowColor = color;
  g.shadowBlur = px * 0.26;
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(cx, cy - h);
  g.lineTo(cx + h, cy);
  g.lineTo(cx, cy + h);
  g.lineTo(cx - h, cy);
  g.closePath();
  g.fill();
  // bright inner core for pop
  g.shadowBlur = 0;
  g.fillStyle = "rgba(255,255,255,0.9)";
  const h2 = px * 0.13;
  g.beginPath();
  g.moveTo(cx, cy - h2);
  g.lineTo(cx + h2, cy);
  g.lineTo(cx, cy + h2);
  g.lineTo(cx - h2, cy);
  g.closePath();
  g.fill();
  return c;
}
