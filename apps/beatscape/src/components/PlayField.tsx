import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { ChartJSON, PlayMode, PlayResult } from "../types/chart";
import { Conductor, unlockAudio } from "../audio/playback";
import { playHit, playKeyTick, setSfxVolume } from "../audio/hitsounds";
import { vibrate } from "../lib/haptics";
import { GameSession, type JudgeFx } from "../engine/playState";
import { approachSec } from "../engine/geometry";
import { laneFromClientX, isCoarsePointer, TouchLaneTracker, receptorYFromGeometry } from "../input/touchInput";
import { keyLabels, laneFromKeyEvent } from "../input/keyMap";
import { loadKeys, loadOffsetMs, loadSettings } from "../storage/settings";
import { SCAPE_COPY, districtColor, characterArtWebp, LANE_RGB } from "../constants/scape";
import { fancyFxOn } from "./playfield/canvasHelpers";
import { createPlayfieldRenderer } from "./playfield/renderLoop";
import type { Fx, ScorePop } from "./playfield/renderLoop";
import { ScoreStreak, SurgeMeter, type SurgeTier } from "../engine/surge";

const COUNTDOWN_MS = 3000;

type Props = {
  chart: ChartJSON;
  audioUrl: string;
  mode: PlayMode;
  casualSpeed: number;
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
};

export function PlayField({
  chart,
  audioUrl,
  mode,
  casualSpeed,
  onStart,
  onFinish,
  variant = "full",
  muted = false,
  autoStart = false,
  district,
}: Props) {
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
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const settings = useMemo(loadSettings, []);
  // Stable reference: the keyboard effect below keys off this array.
  const keys = useMemo(loadKeys, []);
    const keyHint = useMemo(() => keyLabels(keys), [keys]);
  const keyHintJoined = useMemo(() => keyHint.join(" · "), [keyHint]);
  // Dev-only visual QA hooks: ?surge=N locks the SIGNAL meter at a tier;
  // ?autostart skips the tap-to-enter gate. Both exist so tier stills can be
  // captured headlessly and are compiled out of production builds.
  const demoSurge = useMemo(() => {
    if (!import.meta.env.DEV) return 0;
    const v = Number(new URLSearchParams(window.location.search).get("surge") ?? "0");
    return v >= 1 && v <= 3 ? (Math.floor(v) as SurgeTier) : 0;
  }, []);
  const devAutoStart = useMemo(() => {
    if (!import.meta.env.DEV) return false;
    return new URLSearchParams(window.location.search).has("autostart");
  }, []);
  // Dev-only: ?streak=N (alias ?combo=N) floors the ScoreStreak driver so
  // stills can show the rig/neon at a given level without playing.
  const demoStreak = useMemo(() => {
    if (!import.meta.env.DEV) return 0;
    const p = new URLSearchParams(window.location.search);
    const v = Number(p.get("streak") ?? p.get("combo") ?? "0");
    return Number.isFinite(v) && v > 0 ? Math.min(200, Math.floor(v)) : 0;
  }, []);

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
  // 这三个开关由 rAF 循环读取，所以走 ref 而不是闭包：
  //   · 写进 rAF effect 的依赖 → 中途改音量/音色会销毁重建整个循环，连带重跑
  //     sprite 预渲染和 halftone 图案，玩家看到一次明显卡帧；
  //   · 不写进依赖、直接读 settings.xxx → 读到的是 effect 上次运行时的过期值
  //     （settings 是 useMemo([]) 的稳定对象，属性变了引用不变）。
  const mutedRef = useRef(muted);
  const hitsoundRef = useRef(settings.hitsound);
  const fancyFxRef = useRef(settings.fancyFx);
  mutedRef.current = muted;
  hitsoundRef.current = settings.hitsound;
  fancyFxRef.current = settings.fancyFx;

  // Immersive: hide site chrome while playing (full page only). Also owns the
  // viewport NEON level attribute — cleaned up on unmount.
  useEffect(() => {
    if (variant !== "full") return;
    document.body.classList.add("play-immersive");
    return () => {
      document.body.classList.remove("play-immersive");
      delete document.body.dataset.neon;
    };
  }, [variant]);

  // Load audio + build the session once per chart.
  useEffect(() => {
    let cancelled = false;
    finishedRef.current = false;
    lastComboRef.current = 0;
    lastCountInt.current = -1;
    fxRef.current = [];
    pressedRef.current.clear();
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
    conductor.setMusicVolume(mutedRef.current ? 0 : settings.musicVolume);
    setSfxVolume(mutedRef.current || !settings.hitsound ? 0 : settings.sfxVolume);
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
      // dispose() 而不是 stop()：stop() 只停音源、保留整条 gain/filter/analyser
      // 播放链（那是为了能恢复播放）。离开对局时整条链都要断开，否则每次挂载
      // 都泄漏一套节点，而且音量设置一变就会再泄漏一套。
      conductor.dispose();
      conductorRef.current = null;
      sessionRef.current = null;
    };
    // 依赖里刻意不含 settings.musicVolume / sfxVolume / hitsound / muted：
    // 它们属于"实时生效"的音量，由下面那个 effect 直接作用在当前 conductor 上。
    // 放进依赖的话，改一次音量就会重跑这里 —— 重新 new Conductor + 重新 fetch
    // 并解码整段音频，玩家在对局中途调音量会直接被丢回加载态。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, mode, audioUrl, casualSpeed, chordAssist, settings.scrollBias]);

  // Live mute toggle (home sound button) without remounting the chart.
  useEffect(() => {
    const conductor = conductorRef.current;
    if (!conductor) return;
    conductor.setMusicVolume(muted ? 0 : settings.musicVolume);
    setSfxVolume(muted || !settings.hitsound ? 0 : settings.sfxVolume);
  }, [muted, settings.musicVolume, settings.sfxVolume, settings.hitsound]);

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
    if (variant === "full") {
      try {
        await document.documentElement.requestFullscreen?.();
      } catch {
        /* optional */
      }
    }
  };

  // Home combined Play+Sound already unlocked AudioContext — start when ready.
  // Dev-only: the ?surge=N visual-QA lock implies auto-start so stills can be
  // captured headlessly without a click gesture.
  const autoStartedRef = useRef(false);
  const effectiveAutoStart = autoStart || devAutoStart || (import.meta.env.DEV && demoSurge > 0);
  useEffect(() => {
    autoStartedRef.current = false;
  }, [chart, mode, audioUrl]);
  useEffect(() => {
    if (!effectiveAutoStart || loading || error || !needsStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void startRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot after load
  }, [effectiveAutoStart, loading, error, needsStart]);

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

  const togglePause = () => {
    const conductor = conductorRef.current;
    if (!conductor) return;
    // 用函数式更新读最新 paused，确保从按键监听（依赖只有 [keys]，closure 可能是旧的）调用也正确。
    setPaused((prev) => {
      if (prev) conductor.resume();
      else conductor.pause();
      return !prev;
    });
  };

  // FEEL PACK: instant retry — same chart, fresh session, straight to countdown.
  const restartRun = () => {
    const conductor = conductorRef.current;
    if (!conductor || loading) return;
    conductor.stop();
    sessionRef.current = new GameSession(chart, mode, { chordAssist });
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
    lastComboRef.current = 0;
    prevComboRef.current = 0;
    finishedRef.current = false;
    lastCountInt.current = -1;
    particlesRef.current = [];
    fxRef.current = [];
    scorePopsRef.current = [];
    milestoneRef.current = null;
    pressedRef.current.clear();
    laneFlashRef.current = [0, 0, 0, 0];
    if (wrapRef.current) wrapRef.current.dataset.surge = "0";
    setPaused(false);
    onStart?.();
    void unlockAudio().then(() => conductor.begin(COUNTDOWN_MS));
  };

  // Juice: burst particles + screen shake on every judged hit/miss.
  const spawnHitFx = (lane: number, judgment: JudgeFx["judgment"]) => {
    // FEEL PACK haptics (Android/Chromium): light tick per scoring hit, firm
    // pulse on miss. Gated by the hitsound setting as the feedback master.
    if (settings.hitsound) {
      if (judgment === "miss") vibrate(35, 60);
      else vibrate(8);
    }
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
  // Moved verbatim to playfield/renderLoop.ts (P2-2) — PlayField just wires the
  // refs/values/closures it needs through a context object.
  useEffect(() => {
    if (!canvasRef.current || !wrapRef.current) return;
    return createPlayfieldRenderer({
      canvasRef,
      wrapRef,
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
      lastComboRef,
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
      hitsoundRef,
      fancyFxRef,
      offsetMsRef,
      approachRef,
      lastNoteMsRef,
      lastCountInt,
      finishedRef,
      chart,
      mode,
      variant,
      touchUi,
      district,
      demoSurge,
      demoStreak,
      keyHint,
      spawnHitFx,
      onFinish,
    });
  }, [mode, keyHint, chart.bpm, touchUi, district, demoSurge, demoStreak]);

  const handlePress = (lane: number) => {
    const conductor = conductorRef.current;
    const session = sessionRef.current;
    if (!conductor || !session || needsStartRef.current || pausedRef.current) return;
    if (pressedRef.current.has(lane)) return;
    pressedRef.current.add(lane);
    laneFlashRef.current[lane] = performance.now();
    lastLaneRef.current = lane;
    const eff = conductor.songTimeMs() - offsetMsRef.current;
    const fx = session.press(lane, eff);
    if (fx) {
      fxRef.current.push({ lane: fx.lane, judgment: fx.judgment, born: performance.now(), deltaMs: fx.deltaMs });
      surgeRef.current.apply(fx.judgment);
      streakRef.current.apply(fx.judgment);
      spawnHitFx(fx.lane, fx.judgment);
      if (settings.hitsound) playHit(fx.judgment, surgeTierRef.current);
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
      surgeRef.current.apply(fx.judgment);
      streakRef.current.apply(fx.judgment);
      spawnHitFx(fx.lane, fx.judgment);
      if (settings.hitsound) playHit(fx.judgment, surgeTierRef.current);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const lane = laneFromKeyEvent(e, keys);
      if (lane >= 0) {
        e.preventDefault();
        handlePress(lane);
        return;
      }
      // FEEL PACK: instant retry — R restarts the chart unless R is lane-bound.
      if (e.code === "KeyR" && !needsStartRef.current) {
        e.preventDefault();
        restartRun();
        return;
      }
      // Escape / P 暂停或继续——对局里玩家没有别的退出键，必须有键盘暂停。
      if ((e.key === "Escape" || e.key === "p" || e.key === "P") && !needsStartRef.current) {
        e.preventDefault();
        togglePause();
      }
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

  // getBoundingClientRect() 会强制浏览器同步算一次布局。pointermove 在移动端能到
  // 120Hz+，每移动一次都读就是在反复强制回流。DOMRect 是快照而非活对象，所以缓存
  // 是安全的 —— 只在窗口 resize、页面滚动后失效即可。
  const rectRef = useRef<DOMRect | null>(null);
  useEffect(() => {
    const invalidate = () => {
      rectRef.current = null;
    };
    window.addEventListener("resize", invalidate);
    // capture=true 才能收到内部滚动容器的滚动事件。
    window.addEventListener("scroll", invalidate, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("scroll", invalidate, true);
    };
  }, []);
  const fieldRect = (): DOMRect | null => {
    if (!rectRef.current) {
      const w = wrapRef.current;
      if (!w) return null;
      rectRef.current = w.getBoundingClientRect();
    }
    return rectRef.current;
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    const rect = fieldRect();
    if (!rect) return;
    const localX = e.clientX - rect.left;
    const lane = laneFromClientX(localX, rect);
    if (lane == null) return;
    if (touchTracker.current.press(e.pointerId, lane, performance.now()) === null) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointerLane.current.set(e.pointerId, lane);
    handlePress(lane);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pointerLane.current.has(e.pointerId)) return;
    const rect = fieldRect();
    if (!rect) return;
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
    <div
      className={`play-wrap${variant === "hero" ? " play-wrap-hero" : ""}`}
      ref={wrapRef}
      style={district ? ({ "--district-color": districtColor(district) } as React.CSSProperties) : undefined}
    >
      <canvas
        ref={canvasRef}
        className="play-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {district && (
        <img
          className="play-char-watermark"
          src={`${import.meta.env.BASE_URL}${characterArtWebp(district, 512)}`}
          alt=""
          aria-hidden
        />
      )}
      {loading && !error && (
        <div className="overlay">
          <p className="overlay-kicker">Loading</p>
          <p className="overlay-title">Cueing audio</p>
        </div>
      )}
      {error && (
        <div className="overlay load-error">
          <p className="overlay-kicker">Signal lost</p>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && needsStart && !autoStart && (
        // 外层 div 只负责"点任意处开始"的指针便捷（onClick），不做 button 语义；
        // 真正可被键盘聚焦/激活的是里面的 <button>，避免 button 套 button 的非法结构。
        <div
          className="overlay overlay-tap"
          onClick={() => void startRun()}
        >
          <p className="overlay-kicker">
            {variant === "hero" ? SCAPE_COPY.heroPlayKicker : SCAPE_COPY.rightsShort}
          </p>
          <button
            type="button"
            className="btn primary unlock-btn"
            onClick={(e) => {
              e.stopPropagation();
              void startRun();
            }}
          >
            {variant === "hero" ? SCAPE_COPY.play : SCAPE_COPY.tapToEnter}
          </button>
          {!touchUi && (
            <div className="unlock-keys" aria-hidden>
              {keyHint.map((k, i) => (
                <span key={i} className="key-chip">
                  {k}
                </span>
              ))}
            </div>
          )}
          <p className="unlock-hint">
            {touchUi
              ? SCAPE_COPY.heroPlayHintTouch
              : `${SCAPE_COPY.heroPlayHintKeys} · ${keyHintJoined}`}
          </p>
        </div>
      )}
      {!loading && !error && needsStart && autoStart && (
        <div className="overlay">
          <p className="overlay-kicker">{SCAPE_COPY.heroPlayKicker}</p>
          <p className="overlay-title">Cueing…</p>
        </div>
      )}
      {!loading && !error && !needsStart && !paused && (
        <button type="button" className="pause-btn" onClick={togglePause} aria-label="Pause">
          ‖
        </button>
      )}
      {paused && (
        <div className="overlay">
          <p className="overlay-title">{SCAPE_COPY.pauseTitle}</p>
          <button type="button" className="btn primary unlock-btn" onClick={togglePause}>
            {SCAPE_COPY.resume}
          </button>
        </div>
      )}
    </div>
  );
}

/** Skewed parallelogram used for every HUD panel (PRD §7.6 comic framing). */
