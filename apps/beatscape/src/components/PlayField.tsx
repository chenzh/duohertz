import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { ChartJSON, PlayMode, PlayResult } from "../types/chart";
import { Conductor, unlockAudio } from "../audio/playback";
import { playBreak, playCountdownTick, playHit, playKeyTick, setSfxVolume } from "../audio/hitsounds";
import { GameSession, type JudgeFx } from "../engine/playState";
import { approachSec, noteProximityFactor, noteScreenY } from "../engine/geometry";
import { accuracyPercent, comboMultiplier, judgmentScore } from "../engine/judge";
import { receptorYFromGeometry, laneFromClientX, isCoarsePointer, TouchLaneTracker } from "../input/touchInput";
import { keyLabels, laneFromKeyEvent } from "../input/keyMap";
import { loadKeys, loadOffsetMs, loadSettings } from "../storage/settings";

import { JUDGE_COLORS, LANE_COLORS, LANE_RGB, SCAPE_COPY } from "../constants/scape";
const COUNTDOWN_MS = 3000;
const LANE_FLASH_MS = 180;
const JUDGE_LABEL: Record<string, string> = {
  perfect: "PERFECT",
  great: "GREAT",
  good: "GOOD",
  miss: "MISS",
};
const JUDGE_COLOR: Record<string, string> = { ...JUDGE_COLORS };
const COMBO_MILESTONES = [10, 25, 50, 100, 150, 200, 300];

type Props = {
  chart: ChartJSON;
  audioUrl: string;
  mode: PlayMode;
  casualSpeed: number;
  onStart?: () => void;
  onFinish: (result: PlayResult) => void;
};

type Fx = { lane: number; judgment: JudgeFx["judgment"]; born: number; deltaMs: number };
type ScorePop = { x: number; y: number; text: string; born: number; color: string };

function fancyFxOn(settings: { fancyFx: boolean }): boolean {
  if (!settings.fancyFx) return false;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}

export function PlayField({ chart, audioUrl, mode, casualSpeed, onStart, onFinish }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const conductorRef = useRef<Conductor | null>(null);
  const sessionRef = useRef<GameSession | null>(null);
  const pressedRef = useRef<Set<number>>(new Set());
  const pointerLane = useRef<Map<number, number>>(new Map());
  const touchTracker = useRef(new TouchLaneTracker());
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
  const scorePopsRef = useRef<ScorePop[]>([]);
  const comboBreakRef = useRef(0);
  const prevComboRef = useRef(0);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const settings = useMemo(loadSettings, []);
  // Stable reference: the keyboard effect below keys off this array.
  const keys = useMemo(loadKeys, []);
  const keyHint = useMemo(() => keyLabels(keys).join(" · "), [keys]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsStart, setNeedsStart] = useState(true);
  const [paused, setPaused] = useState(false);
  // Two-thumb grip needs forgiveness for chords stacked on one hand (touch only).
  const [touchUi] = useState(isCoarsePointer);
  const chordAssist = touchUi && settings.chordAssist;

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
    conductor.setMusicVolume(settings.musicVolume);
    setSfxVolume(settings.sfxVolume);
    conductorRef.current = conductor;
    const session = new GameSession(chart, mode, { chordAssist });
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
  }, [chart, mode, audioUrl, casualSpeed, chordAssist, settings.scrollBias, settings.musicVolume, settings.sfxVolume]);

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
    onStart?.();
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      /* optional */
    }
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
    const isPerfect = judgment === "perfect";
    const [r, g, b] =
      judgment === "miss"
        ? [254, 44, 85]
        : isPerfect
          ? [255, 214, 10]
          : LANE_RGB[lane];
    if (fancyFxOn(settings)) {
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
      const mag =
        judgment === "perfect" ? 6 : judgment === "great" ? 3.5 : judgment === "good" ? 2 : 7;
      shakeRef.current = { mag, until: performance.now() + 150 };
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

    // Pre-render glowing note sprites once. Per frame we only blit these
    // (drawImage) instead of recomputing shadowBlur on every note — shadowBlur
    // is the single most expensive canvas op and was the main frame-cost on
    // dense charts. The Douyin neon look is baked into the sprite.
    spritesRef.current = LANE_COLORS.map((c) => makeNoteSprite(c, 120));

    const drawNote = (lane: number, x: number, y: number, size: number, alpha: number, receptorY: number) => {
      const sp = spritesRef.current[lane];
      if (!sp) return;
      const prox = noteProximityFactor(y, receptorY);
      const drawSize = size * (1 + prox * 0.14);
      const drawAlpha = Math.min(1, alpha * (0.78 + prox * 0.22));
      ctx2d.globalAlpha = drawAlpha;
      ctx2d.drawImage(sp, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
      if (prox > 0.55 && fancyFxOn(settings)) {
        ctx2d.globalAlpha = prox * 0.35;
        ctx2d.drawImage(sp, x - drawSize * 0.62, y - drawSize * 0.62, drawSize * 1.24, drawSize * 1.24);
      }
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
      const keyHints = keyLabels(keys);
      const session = sessionRef.current!;
      const approach = approachRef.current;
      const songSec = effMs / 1000;
      const nowPerf = performance.now();

      ctx2d.clearRect(0, 0, w, h);

      const beatPhase = ((songSec * chart.bpm) / 60) % 1;
      const beatPulse = 0.12 + 0.18 * Math.max(0, Math.cos(beatPhase * Math.PI * 2));

      // Flat ink ground with one faint crimson beat wash. No coloured gradient,
      // no glow — the whole point of the v2.0 language.
      ctx2d.fillStyle = "#12100F";
      ctx2d.fillRect(0, 0, w, h);
      ctx2d.fillStyle = `rgba(226,61,61,${0.05 + beatPulse * 0.06})`;
      ctx2d.fillRect(0, 0, w, h);

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
          // Hard-edged band instead of a fading gradient.
          const bandH = Math.min(receptorY, h * 0.3);
          ctx2d.fillStyle = `rgba(${LANE_RGB[i][0]},${LANE_RGB[i][1]},${LANE_RGB[i][2]},${0.34 * flash})`;
          ctx2d.fillRect(x, receptorY - bandH, laneW, bandH);
        }
        // Lane dividers are ink rules, not faint white lines.
        ctx2d.strokeStyle = "rgba(0,0,0,0.85)";
        ctx2d.lineWidth = 2;
        ctx2d.beginPath();
        ctx2d.moveTo(x, 0);
        ctx2d.lineTo(x, h);
        ctx2d.stroke();
      }

      // Receptor: a thick black rail with a bone-white edge on top. No glow.
      ctx2d.save();
      ctx2d.lineWidth = 6 + beatPulse * 2;
      ctx2d.strokeStyle = "#000000";
      ctx2d.beginPath();
      ctx2d.moveTo(0, receptorY);
      ctx2d.lineTo(w, receptorY);
      ctx2d.stroke();
      ctx2d.lineWidth = 2;
      ctx2d.strokeStyle = `rgba(245,239,230,${0.85 + beatPulse * 0.15})`;
      ctx2d.beginPath();
      ctx2d.moveTo(0, receptorY);
      ctx2d.lineTo(w, receptorY);
      ctx2d.stroke();
      ctx2d.restore();
      for (let i = 0; i < 4; i++) {
        const cx = (i + 0.5) * laneW;
        const laneBeat = pressedRef.current.has(i) ? 1 : beatPulse * 0.55;
        ctx2d.fillStyle = LANE_COLORS[i];
        ctx2d.globalAlpha = 0.65 + laneBeat * 0.35;
        ctx2d.fillRect(cx - laneW * 0.18, receptorY - 2, laneW * 0.36, 4 + laneBeat * 3);
        ctx2d.globalAlpha = 1;
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
          drawNote(d.lane, (d.lane + 0.5) * laneW, yHead, noteW, 1, receptorY);
        } else if (d.type === "hold") {
          if (n.done) continue;
          const yTail = noteScreenY(n.endMs / 1000, songSec, receptorY, approach);
          const top = Math.min(yHead, yTail);
          const bodyH = Math.abs(yTail - yHead);
          const holding = pressedRef.current.has(d.lane) && n.head !== null && n.tail === null;
          ctx2d.fillStyle = `rgba(${LANE_RGB[d.lane][0]},${LANE_RGB[d.lane][1]},${LANE_RGB[d.lane][2]},${holding ? 0.62 : 0.45})`;
          ctx2d.fillRect((d.lane + 0.5) * laneW - noteW * 0.22, top, noteW * 0.44, bodyH);
          if (holding) {
            ctx2d.strokeStyle = `rgba(${LANE_RGB[d.lane][0]},${LANE_RGB[d.lane][1]},${LANE_RGB[d.lane][2]},0.85)`;
            ctx2d.lineWidth = 2;
            ctx2d.strokeRect((d.lane + 0.5) * laneW - noteW * 0.28, top, noteW * 0.56, bodyH);
          }
          const headAlpha = n.head ? 0.35 : 1;
          drawNote(d.lane, (d.lane + 0.5) * laneW, yHead, noteW, headAlpha, receptorY);
        } else if (d.type === "chord") {
          if (n.done) continue;
          for (const l of d.lanes) {
            const a = n.chord[l] != null ? 0.35 : 1;
            drawNote(l, (l + 0.5) * laneW, yHead, noteW, a, receptorY);
          }
        } else if (d.type === "slide") {
          if (n.done) continue;
          const headDone = n.head !== null;
          drawNote(d.lane, (d.lane + 0.5) * laneW, yHead, noteW, headDone ? 0.35 : 1, receptorY);
          const yTail = noteScreenY(n.endMs / 1000, songSec, receptorY, approach);
          const slideAlpha = headDone ? 0.95 : 0.55;
          ctx2d.strokeStyle = LANE_COLORS[d.to];
          ctx2d.globalAlpha = slideAlpha;
          ctx2d.lineWidth = headDone ? 3 : 2;
          ctx2d.setLineDash([6, 6]);
          ctx2d.beginPath();
          ctx2d.moveTo((d.lane + 0.5) * laneW, yHead);
          ctx2d.lineTo((d.to + 0.5) * laneW, yTail);
          ctx2d.stroke();
          ctx2d.setLineDash([]);
          ctx2d.globalAlpha = 1;
          if (headDone && n.tail === null) {
            drawNote(d.to, (d.to + 0.5) * laneW, yTail, noteW * 0.92, 1, receptorY);
          }
        }
      }

      // hit particles (physics: gravity + fade)
      if (fancyFxOn(settings)) {
        particlesRef.current = particlesRef.current.filter((p) => nowPerf - p.born < p.life);
        for (const p of particlesRef.current) {
          const age = (nowPerf - p.born) / p.life;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.14;
          p.vx *= 0.985;
          ctx2d.globalAlpha = Math.max(0, 1 - age);
          // Square debris shards read as comic impact; circles read as sparks.
          const s2 = p.size * (1 - age * 0.5) * 1.8;
          ctx2d.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
          ctx2d.fillRect(p.x - s2 / 2, p.y - s2 / 2, s2, s2);
        }
        ctx2d.globalAlpha = 1;
      } else {
        particlesRef.current = [];
      }

      // FX flashes
      fxRef.current = fxRef.current.filter((f) => nowPerf - f.born < 360);
      for (const f of fxRef.current) {
        const age = (nowPerf - f.born) / 360;
        const cx = (f.lane + 0.5) * laneW;
        const [r, g, b] = f.judgment === "miss" ? LANE_RGB[0] : LANE_RGB[f.lane];

        // Comic starburst instead of an expanding ring.
        const spikes = f.judgment === "miss" ? 7 : f.judgment === "perfect" ? 12 : 9;
        const rad = (10 + age * 34) * (f.judgment === "perfect" ? 1.3 : 1);
        const inner = rad * 0.58;
        ctx2d.beginPath();
        for (let s = 0; s < spikes * 2; s++) {
          const rr = s % 2 === 0 ? rad : inner;
          const a = (s / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
          const sx = cx + Math.cos(a) * rr;
          const sy = receptorY + Math.sin(a) * rr;
          if (s === 0) ctx2d.moveTo(sx, sy);
          else ctx2d.lineTo(sx, sy);
        }
        ctx2d.closePath();
        ctx2d.lineJoin = "miter";
        ctx2d.strokeStyle = `rgba(${r},${g},${b},${1 - age})`;
        ctx2d.lineWidth = 3;
        ctx2d.stroke();
        ctx2d.lineWidth = 1;

        // Judgment label — Anton slab wrapped in a hard ink outline.
        const label = JUDGE_LABEL[f.judgment];
        if (label) {
          const pop = age < 0.18 ? 0.5 + (age / 0.18) * 0.7 : 1.2 - (age - 0.18) * 0.24;
          const isP = f.judgment === "perfect";
          const skewX = Math.max(-18, Math.min(18, f.deltaMs * 0.35));
          ctx2d.save();
          ctx2d.globalAlpha = Math.max(0, 1 - age * age);
          ctx2d.translate(cx + skewX, receptorY - 46 - age * 22);
          ctx2d.scale(pop, pop);
          ctx2d.textAlign = "center";
          const fs = isP ? 23 : 17;
          ctx2d.font = `400 ${fs}px Anton, 'Sora', sans-serif`;
          ctx2d.lineWidth = Math.max(3, fs * 0.2);
          inkedText(ctx2d, label, 0, 0, JUDGE_COLOR[f.judgment] || "#F5EFE6");
          if (f.judgment !== "miss" && Math.abs(f.deltaMs) >= 8) {
            ctx2d.font = "600 10px 'IBM Plex Sans', sans-serif";
            ctx2d.lineWidth = 3;
            inkedText(ctx2d, f.deltaMs < 0 ? "EARLY" : "LATE", 0, 15, "#F5EFE6");
          }
          ctx2d.restore();
        }
      }

      ctx2d.restore(); // end gameplay (shaken) layer — HUD stays stable

      // combo-break vignette (HUD layer, stable)
      if (nowPerf < comboBreakRef.current) {
        const t = (comboBreakRef.current - nowPerf) / 320;
        ctx2d.fillStyle = `rgba(226,61,61,${0.3 * t})`;
        ctx2d.fillRect(0, 0, w, h);
      }

      // floating score pops
      scorePopsRef.current = scorePopsRef.current.filter((p) => nowPerf - p.born < 520);
      for (const p of scorePopsRef.current) {
        const age = (nowPerf - p.born) / 520;
        ctx2d.save();
        ctx2d.globalAlpha = Math.max(0, 1 - age);
        ctx2d.fillStyle = p.color;
        ctx2d.font = "700 14px 'IBM Plex Sans', sans-serif";
        ctx2d.textAlign = "center";
        ctx2d.fillText(p.text, p.x, p.y - age * 36);
        ctx2d.restore();
      }

      // HUD — skewed ink panels rather than bare floating text.
      const panel = (x: number, y: number, pw: number, ph: number, fill: string, skew = 8) => {
        skewPath(ctx2d, x, y, pw, ph, skew);
        ctx2d.fillStyle = fill;
        ctx2d.fill();
        ctx2d.lineWidth = 2;
        ctx2d.strokeStyle = "#000000";
        ctx2d.stroke();
      };

      const scoreText = session.score.toLocaleString();
      ctx2d.font = "600 18px 'IBM Plex Sans', sans-serif";
      const scoreW = Math.min(w * 0.5, ctx2d.measureText(scoreText).width + 34);
      panel(10, 10, scoreW, 30, "#1C1717");
      ctx2d.fillStyle = "#F5EFE6";
      ctx2d.textAlign = "left";
      ctx2d.textBaseline = "middle";
      ctx2d.fillText(scoreText, 26, 26);

      // accuracyPercent() direct — getResult() allocates a fresh object per frame.
      const accText = `${accuracyPercent(session.judgments, session.totalNotes).toFixed(2)}%`;
      ctx2d.font = "600 15px 'IBM Plex Sans', sans-serif";
      const accW = ctx2d.measureText(accText).width + 30;
      panel(w - 10 - accW, 10, accW, 30, "#1C1717");
      ctx2d.fillStyle = "#A8928B";
      ctx2d.textAlign = "right";
      ctx2d.fillText(accText, w - 24, 26);
      ctx2d.textBaseline = "alphabetic";

      if (mode === "arcade") {
        const bx = 14;
        const by = 46;
        const bw = w - 28;
        const bh = 12;
        panel(bx, by, bw, bh, "#12100F", 6);
        const innerW = ((bw - 6) * Math.max(0, session.hp)) / 100;
        if (innerW > 0) {
          ctx2d.save();
          ctx2d.beginPath();
          ctx2d.rect(bx + 3, by + 3, innerW, bh - 6);
          ctx2d.clip();
          ctx2d.fillStyle = session.hp <= 30 ? "#E23D3D" : "#FFB020";
          ctx2d.fillRect(bx + 3, by + 3, bw, bh - 6);
          ctx2d.restore();
        }
      }

      if (session.combo >= 2) {
        // Combo escalates in size and heat as it climbs, always ink-outlined.
        const tier = session.combo >= 100 ? 3 : session.combo >= 50 ? 2 : session.combo >= 10 ? 1 : 0;
        const sizes = [34, 44, 56, 68];
        const cols = ["#F5EFE6", "#F2E4C9", "#FFB020", "#E23D3D"];
        const pulse = 1 + Math.min(0.18, (nowPerf % 600) / 600 / 6);
        ctx2d.save();
        ctx2d.textAlign = "center";
        ctx2d.translate(w / 2, receptorY * 0.42);
        ctx2d.scale(pulse, pulse);
        ctx2d.font = `400 ${sizes[tier]}px Anton, 'Sora', sans-serif`;
        ctx2d.lineWidth = Math.max(4, sizes[tier] * 0.13);
        inkedText(ctx2d, `${session.combo}`, 0, 0, cols[tier]);
        ctx2d.restore();
        ctx2d.textAlign = "center";
        ctx2d.font = "600 12px 'IBM Plex Sans', sans-serif";
        ctx2d.lineWidth = 3;
        inkedText(ctx2d, "COMBO", w / 2, receptorY * 0.42 + 24, "#A8928B");
      }

      // combo milestone flash (center, big, quick)
      if (fancyFxOn(settings) && milestoneRef.current) {
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
          ctx2d.font = "400 48px Anton, 'Sora', sans-serif";
          ctx2d.lineWidth = 10;
          inkedText(ctx2d, milestoneRef.current.text, 0, 0, "#FFB020");
          ctx2d.restore();
        }
      }

      // Key hints sit under the receptor, tinted per lane. Drawn from the bound
      // key's *label*, so arrow keys read as ← ↓ ↑ → instead of "ArrowLeft".
      // Skipped on touch: there is no keyboard there, and the overlay already
      // tells the player to use their thumbs.
      if (!touchUi) {
        ctx2d.save();
        ctx2d.textAlign = "center";
        ctx2d.textBaseline = "middle";
        const hintY = Math.min(receptorY + 26, h - 14);
        for (let i = 0; i < 4; i++) {
          const label = keyHints[i] ?? "";
          const flash = Math.max(
            0,
            1 - (performance.now() - (laneFlashRef.current[i] ?? 0)) / LANE_FLASH_MS,
          );
          const held = pressedRef.current.has(i);
          const [r, g, b] = LANE_RGB[i] ?? LANE_RGB[0]!;
          const cxm = (i + 0.5) * laneW;
          const capW = Math.min(laneW * 0.7, 46);
          const capH = 24;
          skewPath(ctx2d, cxm - capW / 2, hintY - capH / 2, capW, capH, 6);
          ctx2d.fillStyle = held ? LANE_COLORS[i]! : "rgba(18,16,15,0.94)";
          ctx2d.fill();
          ctx2d.lineWidth = 2;
          ctx2d.strokeStyle = "#000000";
          ctx2d.stroke();
          ctx2d.font = `700 ${held ? 16 : 14}px 'IBM Plex Sans', sans-serif`;
          ctx2d.fillStyle = held
            ? "#12100F"
            : `rgba(${r},${g},${b},${Math.min(1, 0.6 + flash * 0.4)})`;
          ctx2d.fillText(label, cxm, hintY + 1);
        }
        ctx2d.restore();
      }

      // Countdown as comic emphasis type: heavy red slab behind a hard black
      // outline. PRD §7.4 still bans Japanese-style onomatopoeia — this is the
      // Western pop-art treatment instead.
      if (st < 0) {
        const cd = -st;
        const text = cd > 250 ? String(Math.ceil(cd / 1000)) : "GO";
        ctx2d.save();
        ctx2d.textAlign = "center";
        ctx2d.textBaseline = "middle";
        ctx2d.font = "400 96px Anton, 'Sora', sans-serif";
        ctx2d.lineJoin = "round";
        ctx2d.lineWidth = 9;
        ctx2d.strokeStyle = "#000000";
        ctx2d.strokeText(text, w / 2, h / 2);
        ctx2d.fillStyle = "#E23D3D";
        ctx2d.fillText(text, w / 2, h / 2);
        ctx2d.restore();
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
          addFx(m.lane, m.judgment, m.deltaMs);
          if (settings.hitsound) playHit(m.judgment);
        }
        if (session.consumeSlowTrigger()) conductor.setRate(0.5, 5000);

        // combo-break sound + combo milestone celebration
        if (session.combo === 0 && lastComboRef.current > 0) {
          if (settings.hitsound) playBreak();
          comboBreakRef.current = performance.now() + 320;
        }
        if (session.combo > prevComboRef.current && COMBO_MILESTONES.includes(session.combo)) {
          if (fancyFxOn(settings)) {
            milestoneRef.current = { text: `${session.combo} COMBO!`, born: performance.now() };
            shakeRef.current = { mag: 9, until: performance.now() + 240 };
          }
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

    const addFx = (lane: number, judgment: JudgeFx["judgment"], deltaMs = 0) => {
      fxRef.current.push({ lane, judgment, born: performance.now(), deltaMs });
      spawnHitFx(lane, judgment);
      const session = sessionRef.current;
      const { w } = dimRef.current;
      if (session && w && judgment !== "miss" && judgment !== "good") {
        const gain = judgmentScore(judgment) * comboMultiplier(session.combo);
        if (gain > 0) {
          const receptorY = receptorYFromGeometry(dimRef.current.h, Math.min(w, dimRef.current.h));
          scorePopsRef.current.push({
            x: (lane + 0.5) * (w / 4),
            y: receptorY - 78,
            text: `+${gain}`,
            born: performance.now(),
            color: JUDGE_COLOR[judgment] ?? "#FFFFFF",
          });
        }
      }
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [mode, settings.hitsound, settings.fancyFx, keys, chart.bpm, touchUi]);

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
      fxRef.current.push({ lane: fx.lane, judgment: fx.judgment, born: performance.now(), deltaMs: fx.deltaMs });
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
      fxRef.current.push({ lane: fx.lane, judgment: fx.judgment, born: performance.now(), deltaMs: fx.deltaMs });
      spawnHitFx(fx.lane, fx.judgment);
      if (settings.hitsound) playHit(fx.judgment);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const lane = laneFromKeyEvent(e, keys);
      if (lane < 0) return;
      e.preventDefault();
      handlePress(lane);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const lane = laneFromKeyEvent(e, keys);
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
    const localX = e.clientX - rect.left;
    const lane = laneFromClientX(localX, rect);
    if (lane == null) return;
    if (touchTracker.current.press(e.pointerId, lane, performance.now()) === null) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointerLane.current.set(e.pointerId, lane);
    handlePress(lane);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const wrap = wrapRef.current;
    if (!wrap || !pointerLane.current.has(e.pointerId)) return;
    const rect = wrap.getBoundingClientRect();
    const lane = laneFromClientX(e.clientX - rect.left, rect);
    if (lane == null) return;
    const prev = pointerLane.current.get(e.pointerId);
    if (prev === lane) return;
    if (prev != null) handleRelease(prev);
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
        onPointerMove={onPointerMove}
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
        <div className="overlay overlay-tap" role="button" tabIndex={0} onClick={() => void startRun()} onKeyDown={(e) => e.key === "Enter" && void startRun()}>
          <button type="button" className="btn primary unlock-btn" onClick={(e) => { e.stopPropagation(); void startRun(); }}>
            {SCAPE_COPY.tapToEnter}
          </button>
          <p className="unlock-hint">
            {touchUi
              ? "Thumbs on the bottom lanes — tap as the notes land"
              : `${keyHint} when notes hit the line`}
          </p>
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

/**
 * RESONANCE note: a flat diamond under a hard ink outline, with a single
 * highlight wedge for cel-shaded volume. The old version baked a neon glow in —
 * that is exactly what the v2.0 language removes.
 */
function makeNoteSprite(color: string, px: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = px;
  c.height = px;
  const g = c.getContext("2d")!;
  const cx = px / 2;
  const cy = px / 2;
  const r = px * 0.34;

  const diamond = (radius: number) => {
    g.beginPath();
    g.moveTo(cx, cy - radius);
    g.lineTo(cx + radius, cy);
    g.lineTo(cx, cy + radius);
    g.lineTo(cx - radius, cy);
    g.closePath();
  };

  diamond(r);
  g.fillStyle = color;
  g.fill();
  g.lineJoin = "miter";
  g.lineWidth = Math.max(2, px * 0.06);
  g.strokeStyle = "#000000";
  g.stroke();

  // Single hard-edged highlight wedge, clipped to the inner diamond.
  g.save();
  diamond(r * 0.72);
  g.clip();
  g.fillStyle = "rgba(255,255,255,0.4)";
  g.beginPath();
  g.moveTo(cx - r, cy - r * 0.2);
  g.lineTo(cx + r * 0.15, cy - r);
  g.lineTo(cx - r, cy - r);
  g.closePath();
  g.fill();
  g.restore();

  return c;
}

/** Skewed parallelogram used for every HUD panel (PRD §7.6 comic framing). */
function skewPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  skew: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + skew, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - skew, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

/** Draw text with a hard ink outline — the pop-art emphasis treatment. */
function inkedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
  outline = "#000000",
) {
  ctx.lineJoin = "round";
  ctx.strokeStyle = outline;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}
