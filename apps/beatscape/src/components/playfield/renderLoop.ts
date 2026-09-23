// BeatScape playfield render loop — extracted from PlayField.tsx (P2-2).
//
// This module owns the entire requestAnimationFrame game loop: canvas setup,
// sprite pre-render, the per-frame `draw()` routine, and the per-frame `loop()`
// that advances the session + drives the SIGNAL/LIGHTING atmosphere. It was a
// ~880-line `useEffect` closing over ~39 refs; moving it here keeps PlayField.tsx
// focused on React (hooks, state, pointer/keyboard input, JSX).
//
// Refs/values arrive through PlayfieldRenderContext; the component owns their
// lifecycle while this module owns drawing and frame updates.

import type { RefObject } from "react";
import type { ChartJSON, PlayResult } from "../../types/chart";
import type { Conductor } from "../../audio/playback";
import type { GameSession, JudgeFx } from "../../engine/playState";
import type { ScoreStreak, SurgeMeter, SurgeTier } from "../../engine/surge";
import {
  playBreak,
  playCountdownTick,
  playHit,
  playSurgeTier,
} from "../../audio/hitsounds";
import type { HapticCue } from "../../lib/haptics";
import { accuracyPercent } from "../../engine/judge";
import {
  HOLD_BODY_RATIO,
  HOLD_STROKE_RATIO,
  HOLD_TAIL_SCALE,
  NOTE_PROXIMITY_GROWTH,
  SLIDE_TAIL_SCALE,
  makeNoteSprite,
  noteWidthForLane,
} from "../../engine/noteSprite";
import {
  judgmentLabelCenterX,
  judgmentTimingCenterX,
  judgmentTimingLabel,
} from "./judgmentFeedback";
import {
  noteProximityFactor,
  noteScreenY,
} from "../../engine/geometry";
import { receptorYFromGeometry } from "../../input/touchInput";
import {
  SURGE_TIERS,
  decayAtmosphere,
  tierForHeat,
} from "../../engine/surge";
import {
  JUDGE_COLORS,
  LANE_COLORS,
  LANE_RGB,
  COMBO_COPY,
  SURGE_COPY,
  characterArtWebp,
  districtColor,
} from "../../constants/scape";
import {
  hexToRgb,
  inkedText,
  makeDiamondRingSprite,
  makeHalftonePattern,
  makeRaysSprite,
  prefersReducedMotion,
  skewPath,
} from "./canvasHelpers";
import { visibleNoteEnd } from "./visibleNoteEnd";
import { MILESTONE_MAX_SCALE, MilestoneTextSprites } from "./milestoneTextSprites";
import { KeyHintSprites } from "./keyHintSprites";
import { COMBO_MILESTONES, crossedComboMilestone } from "./comboFeedback";

type Fx = {
  lane: number;
  judgment: JudgeFx["judgment"];
  born: number;
  deltaMs: number;
  accent?: JudgeFx["accent"];
  chordFeedback?: JudgeFx["chordFeedback"];
};
type ScorePop = { x: number; y: number; text: string; born: number; color: string };

export type { Fx, ScorePop };

export type PlayfieldDrawSample = {
  startedAtMs: number;
  durationMs: number;
  songTimeMs: number;
  noteObjects: number;
  canvas: HTMLCanvasElement;
};

declare global {
  interface Window {
    /** Optional diagnostics for draw-command CPU time, not GPU completion. */
    __bsMeasureDraw?: (sample: PlayfieldDrawSample) => void;
  }
}

const LANE_FLASH_MS = 180;
const KEY_HINT_FADE_MS = 650;
const LATE_KEYBOARD_HINT_MS = 2500;
const COMBO_BREAK_MS = 520;
const JUDGE_LABEL: Record<string, string> = {
  perfect: "PERFECT",
  great: "GREAT",
  good: "GOOD",
  miss: "MISS",
};
const JUDGE_COLOR: Record<string, string> = { ...JUDGE_COLORS };
const MILESTONE_MESSAGES = [...COMBO_MILESTONES.map(combo => `${combo} COMBO!`), SURGE_COPY.t3];

export interface PlayfieldRenderContext {
  // refs (read + mutated by the loop)
  canvasRef: RefObject<HTMLCanvasElement | null>;
  wrapRef: RefObject<HTMLDivElement | null>;
  failureRef: RefObject<HTMLDivElement | null>;
  conductorRef: RefObject<Conductor | null>;
  sessionRef: RefObject<GameSession | null>;
  pressedRef: RefObject<Set<number>>;
  laneFlashRef: RefObject<number[]>;
  spritesRef: RefObject<HTMLCanvasElement[]>;
  halftonePatRef: RefObject<CanvasPattern | null>;
  ringSpriteRef: RefObject<HTMLCanvasElement | null>;
  raysRef: RefObject<HTMLCanvasElement | null>;
  dimRef: RefObject<{ w: number; h: number }>;
  shakeRef: RefObject<{ mag: number; until: number }>;
  fxRef: RefObject<Fx[]>;
  particlesRef: RefObject<
    Array<{ x: number; y: number; vx: number; vy: number; born: number; life: number; r: number; g: number; b: number; size: number }>
  >;
  milestoneRef: RefObject<{ text: string; born: number } | null>;
  scorePopsRef: RefObject<ScorePop[]>;
  comboBreakRef: RefObject<number>;
  prevComboRef: RefObject<number>;
  seenComboBreaksRef: RefObject<number>;
  surgeRef: RefObject<SurgeMeter>;
  streakRef: RefObject<ScoreStreak>;
  prevNeonRef: RefObject<number>;
  surgeTierRef: RefObject<SurgeTier>;
  lastEffMsRef: RefObject<number>;
  ringsRef: RefObject<number[]>;
  colsRef: RefObject<Array<{ born: number; lane: number }>>;
  sweepsRef: RefObject<Array<{ born: number; corner: number }>>;
  lastLaneRef: RefObject<number>;
  lightComboPrevRef: RefObject<number>;
  lastShowBarRef: RefObject<number>;
  surgeDropRef: RefObject<number>;
  needsStartRef: RefObject<boolean>;
  pausedRef: RefObject<boolean>;
  mutedRef: RefObject<boolean>;
  muteMusicRef: RefObject<boolean>;
  hitsoundRef: RefObject<boolean>;
  backgroundDimRef: RefObject<number>;
  fancyFxRef: RefObject<boolean>;
  reduceMotionRef: RefObject<boolean>;
  offsetMsRef: RefObject<number>;
  approachRef: RefObject<number>;
  lastNoteMsRef: RefObject<number>;
  lastCountInt: RefObject<number>;
  finishedRef: RefObject<boolean>;
  /** Live input modality; flipping it must not recreate the audio/game loop. */
  showKeyHintsRef: RefObject<boolean>;
  // non-ref values captured at effect creation
  chart: ChartJSON;
  sectionPractice: boolean;
  variant: "full" | "hero";
  district: string | undefined;
  demoSurge: number;
  demoStreak: number;
  keyHint: string[];
  /** Keep lane keycaps visible beyond GO for onboarding, Practice, Hero, and Duo. */
  persistentKeyHints: boolean;
  /** Sample frame-polled input before automatic misses advance the session. */
  beforeSessionAdvance: (frameTimeMs: number) => void;
  // component-bound closures the loop cannot own
  spawnHitFx: (lane: number, judgment: JudgeFx["judgment"]) => void;
  emitHaptic: (cue: HapticCue) => void;
  onFinish: (result: PlayResult) => void;
  /**
   * B-1 · When true, the comic-panel DOM HUD (PlayHud) is overlaid on top of
   * the canvas. The renderer's built-in score / accuracy / SIGNAL-gauge panels
   * are skipped to avoid drawing the same element twice (the old built-ins
   * used to overlap the DOM HUD). Combo center, key hints, and in-frame
   * feedback still draw as before; Arcade HP lives in the same DOM card.
   */
  useComicHud: boolean;
}

/**
 * Start the playfield render loop. Returns a dispose function that cancels the
 * rAF and disconnects the ResizeObserver — call it from a `useEffect` cleanup.
 */
export function createPlayfieldRenderer(ctx: PlayfieldRenderContext): () => void {
  const {
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
    showKeyHintsRef,
    chart,
    sectionPractice,
    variant,
    district,
    demoSurge,
    demoStreak,
    keyHint,
    persistentKeyHints,
    beforeSessionAdvance,
    spawnHitFx,
    emitHaptic,
    onFinish,
    useComicHud,
  } = ctx;

  const canvas = canvasRef.current;
  const wrap = wrapRef.current;
  if (!canvas || !wrap) return () => {};
  // draw() 每帧都用不透明色整屏覆盖（见其开头的 fillRect），所以 canvas 的
  // alpha 通道完全没有用处，却会让合成器多做一次 blend。关掉它是零风险的白捡。
  const ctx2d = canvas.getContext("2d", { alpha: false }) ?? canvas.getContext("2d")!;
  let raf = 0;
  let disposed = false;
  let failureFinishAt = 0;
  let failureResultSent = false;
  let spriteDpr = 0;
  const milestoneSprites = new MilestoneTextSprites();
  const judgmentLabelWidths = new Map<string, number>();
  const keyHintSprites = new KeyHintSprites(keyHint);
  let keyHintSpritesReady = false;
  const prepareKeyHintSprites = () => {
    // A touch device may acquire an external keyboard on the first note.
    // Prepare these eight small images before gameplay so that first input
    // never pays their raster cost inside a timed canvas frame.
    keyHintSprites.prepare(spriteDpr);
    if (!keyHintSpritesReady) {
      keyHintSpritesReady = true;
      if (document.fonts) keyHintSprites.observeFonts(document.fonts);
    }
  };
  const prepareMilestones = () => {
    // Full/compact fields retain the base alphabetic baseline: the legacy HUD
    // resets it after accuracy, and its rotated gauge uses save/restore.
    for (const text of MILESTONE_MESSAGES) milestoneSprites.get(text, spriteDpr, ctx2d.textBaseline);
  };

  // Pre-render glowing note sprites once. Per frame we only blit these
  // (drawImage) instead of recomputing shadowBlur on every note — shadowBlur
  // is the single most expensive canvas op and was the main frame-cost on
  // dense charts. The Douyin neon look is baked into the sprite.
  spritesRef.current = LANE_COLORS.map((c: string) => makeNoteSprite(c, 120));

  // SIGNAL pre-rendered layers (size-independent): halftone tile + diamond ring.
  // District 色只跟 district 有关，每帧重算（replace/split/map/join/parseInt）
  // 纯属浪费 —— 提到 effect 作用域，draw() 里直接读 dr/dg/db。
  const [dr, dg, db] = hexToRgb(districtColor(district ?? "Pulse Core"));
  halftonePatRef.current = makeHalftonePattern(ctx2d, [dr, dg, db]);
  ringSpriteRef.current = makeDiamondRingSprite();

  // Character art belongs to the environmental layer, not the DOM overlay.
  // Keeping it inside this canvas means lane rails, notes, judgments and HUD
  // are always painted later and can never be obscured by the portrait.
  const characterImagePath = district ? characterArtWebp(district, 512) : null;
  const characterImage = characterImagePath ? new Image() : null;
  let characterImageReady = false;
  if (characterImage) {
    characterImage.decoding = "async";
    characterImage.onload = () => {
      if (!disposed) characterImageReady = true;
    };
    characterImage.src = `${import.meta.env.BASE_URL}${characterImagePath}`;
    characterImageReady = characterImage.complete && characterImage.naturalWidth > 0;
  }
  const duoField = wrap.classList.contains("play-wrap-duo");
  const portraitOpacityByTier = duoField
    ? [0.06, 0.09, 0.12, 0.16]
    : [0.16, 0.22, 0.32, 0.46];
  let portraitOpacity = portraitOpacityByTier[0]!;
  let portraitOpacityAt = performance.now();
  let keyHintsWereInLeadIn = false;
  let keyHintFadeStartedAt = 0;
  let keyHintsVisibleLastFrame = showKeyHintsRef.current;
  let lateKeyboardHintUntil = 0;

  const drawNote = (lane: number, x: number, y: number, size: number, alpha: number, receptorY: number) => {
    const sp = spritesRef.current[lane];
    if (!sp) return;
    if (surgeRef.current.tier() >= 2 && fancyOn()) {
      // LIVE+: hard-edged motion streak behind the note (flat, no gradient).
      ctx2d.globalAlpha = alpha * 0.22;
      ctx2d.fillStyle = LANE_COLORS[lane] ?? "#F5EFE6";
      ctx2d.beginPath();
      ctx2d.moveTo(x - size * 0.1, y - size * 0.5);
      ctx2d.lineTo(x + size * 0.1, y - size * 0.5);
      ctx2d.lineTo(x + size * 0.16, y - size * 1.9);
      ctx2d.lineTo(x - size * 0.16, y - size * 1.9);
      ctx2d.closePath();
      ctx2d.fill();
      ctx2d.globalAlpha = 1;
    }
    const prox = noteProximityFactor(y, receptorY);
    const drawSize = size * (1 + prox * NOTE_PROXIMITY_GROWTH);
    const drawAlpha = Math.min(1, alpha * (0.78 + prox * 0.22));
    ctx2d.globalAlpha = drawAlpha;
    ctx2d.drawImage(sp, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
    if (prox > 0.55 && fancyOn()) {
      ctx2d.globalAlpha = prox * 0.35;
      ctx2d.drawImage(sp, x - drawSize * 0.62, y - drawSize * 0.62, drawSize * 1.24, drawSize * 1.24);
    }
    ctx2d.globalAlpha = 1;
  };

  // 跑马灯四边的几何只跟 w/h 有关 —— 每帧重建 1–4 个 tuple 加一个数组太浪费，
  // 在 resize 时算好复用。
  let edgesOne: Array<[number, number, number, number]> = [];
  let edgesFour: Array<[number, number, number, number]> = [];

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const changedDpr = spriteDpr !== dpr;
    if (changedDpr) {
      spriteDpr = dpr;
      milestoneSprites.clear();
    }
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    dimRef.current = { w, h };
    if (changedDpr) prepareMilestones();
    prepareKeyHintSprites();
    // Concentration rays are size-dependent — rebuild with the field.
    raysRef.current = makeRaysSprite(w, h);
    edgesOne = [[0, 5, w, 0]];
    edgesFour = [
      [0, 5, w, 0],
      [0, h - 13, w, 0],
      [0, 5, 0, h],
      [w - 13, 5, 0, h],
    ];
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(wrap);
  let milestoneFontVersion = 0;
  const refreshMilestoneFonts = () => {
    if (disposed) return;
    milestoneFontVersion++;
    milestoneSprites.clear();
    judgmentLabelWidths.clear();
    prepareMilestones();
  };
  const isMilestoneFont = (font: FontFace) => ["anton", "sora"].includes(font.family.replace(/["']/g, "").trim().toLowerCase());
  const onMilestoneFontsLoaded = (event: FontFaceSetLoadEvent) => {
    if (event.fontfaces.some(isMilestoneFont)) refreshMilestoneFonts();
  };
  document.fonts?.addEventListener("loadingdone", onMilestoneFontsLoaded);
  // Only await an actual pending milestone font. A completed loadingdone event
  // already refreshed it, and unrelated UI fonts must not rebuild eight images.
  if (document.fonts && [...document.fonts].some(font => isMilestoneFont(font) && font.status === "loading")) {
    const pendingVersion = milestoneFontVersion;
    void document.fonts.ready.then(() => {
      if (milestoneFontVersion === pendingVersion) refreshMilestoneFonts();
    });
  }

  // 循环里的特效开关一律读 ref（见组件顶部 mutedRef 的注释）。
  // The component ref owns the in-app switch; the cached media query stays
  // live when the OS preference changes while a run is already open.
  const reduceMotionOn = (): boolean => reduceMotionRef.current || prefersReducedMotion();
  const fancyOn = (): boolean => fancyFxRef.current && !reduceMotionOn();

  // HUD — skewed ink panels rather than bare floating text. 定义在 draw() 外面，
  // 免得每帧重建一个闭包。
  const panel = (x: number, y: number, pw: number, ph: number, fill: string, skew = 8) => {
    skewPath(ctx2d, x, y, pw, ph, skew);
    ctx2d.fillStyle = fill;
    ctx2d.fill();
    ctx2d.lineWidth = 2;
    ctx2d.strokeStyle = "#000000";
    ctx2d.stroke();
  };

  // score 文本缓存：`toLocaleString()` 每次调用都要跑一遍完整的 Intl 数字格式化，
  // 是浏览器里最贵的 API 之一。而分数只在判定时才变（每秒最多几次），每帧重算纯属浪费。
  let cachedScore = -1;
  let cachedScoreText = "";
  const scoreTextFor = (score: number): string => {
    if (score !== cachedScore) {
      cachedScore = score;
      cachedScoreText = score.toLocaleString();
    }
    return cachedScoreText;
  };

  const draw = (effMs: number, st: number, countdownRemainingMs: number) => {
    const measureDraw = window.__bsMeasureDraw;
    const drawStartedAtMs = measureDraw ? performance.now() : 0;
    let noteObjects = 0;
    const { w, h } = dimRef.current;
    const receptorY = receptorYFromGeometry(h, Math.min(w, h));
    const laneW = w / 4;
    const noteW = noteWidthForLane(laneW);
    const session = sessionRef.current!;
    const approach = approachRef.current;
    const songSec = effMs / 1000;
    const nowPerf = performance.now();

    const beatPhase = ((songSec * chart.bpm) / 60) % 1;
    // FEEL PACK: blend real FFT bass into the pulse — the field breathes with
    // the actual music, not just BPM math. Zero while paused/countdown.
    const bass = conductorRef.current?.getBassEnergy() ?? 0;
    const beatPulse = Math.min(0.5, 0.12 + 0.18 * Math.max(0, Math.cos(beatPhase * Math.PI * 2)) + bass * 0.4);

    // Flat ink ground; a faint district-coloured beat wash ties the field to
    // the playing track's character (v2.0 language: flat, no gradient/glow).
    // dr/dg/db 已在 effect 作用域算好（见上）。
    // The previous frame restores the base DPR transform and alpha=1;
    // source-over stays unchanged. This opaque fill also clears the frame.
    const surgeTier = surgeRef.current.tier();
    ctx2d.fillStyle = "#12100F";
    ctx2d.fillRect(0, 0, w, h);
    ctx2d.fillStyle = `rgba(${dr},${dg},${db},0.05)`;
    ctx2d.fillRect(0, 0, w, h);
    // TUNING+ deepens the wash so a hot run visibly "lights the district".
    ctx2d.fillStyle = `rgba(${dr},${dg},${db},${0.05 + beatPulse * 0.06 + surgeTier * 0.025})`;
    ctx2d.fillRect(0, 0, w, h);

    // LIVE+ atmosphere: halftone corners + concentration rays, beat-locked.
    if (surgeTier >= 2 && fancyOn()) {
      if (halftonePatRef.current) {
        ctx2d.save();
        ctx2d.globalAlpha = 0.05 + beatPulse * 0.06;
        ctx2d.fillStyle = halftonePatRef.current;
        const cornerW = w * 0.24;
        const cornerH = Math.min(h * 0.2, 130);
        ctx2d.fillRect(0, 0, cornerW, cornerH);
        ctx2d.fillRect(w - cornerW, 0, cornerW, cornerH);
        ctx2d.restore();
      }
      if (raysRef.current) {
        ctx2d.save();
        ctx2d.globalAlpha = 0.06 + beatPulse * 0.08;
        ctx2d.drawImage(raysRef.current, 0, 0, w, h);
        ctx2d.restore();
      }
    }

    if (characterImageReady && characterImage) {
      const compact = window.innerWidth <= 600;
      const portraitW = compact
        ? Math.min(140, Math.max(84, w * 0.3))
        : Math.min(220, Math.max(108, w * 0.26));
      const portraitH = portraitW * (characterImage.naturalHeight / characterImage.naturalWidth);
      const inset = compact ? 10 : 18;
      const portraitX = w - inset - portraitW;
      const portraitY = h - inset - portraitH;
      const targetOpacity = portraitOpacityByTier[surgeTier] ?? portraitOpacityByTier[0]!;
      const opacityDelta = Math.abs(targetOpacity - portraitOpacity);
      if (reduceMotionOn() || opacityDelta < 0.001) {
        portraitOpacity = targetOpacity;
      } else {
        const elapsed = Math.min(100, Math.max(0, nowPerf - portraitOpacityAt));
        portraitOpacity += (targetOpacity - portraitOpacity) * (1 - Math.exp(-elapsed / 180));
      }
      portraitOpacityAt = nowPerf;

      const radius = Math.min(12, portraitW / 2, portraitH / 2);
      ctx2d.save();
      ctx2d.globalAlpha = portraitOpacity;
      ctx2d.globalCompositeOperation = "screen";
      ctx2d.beginPath();
      ctx2d.moveTo(portraitX + radius, portraitY);
      ctx2d.lineTo(portraitX + portraitW - radius, portraitY);
      ctx2d.quadraticCurveTo(portraitX + portraitW, portraitY, portraitX + portraitW, portraitY + radius);
      ctx2d.lineTo(portraitX + portraitW, portraitY + portraitH - radius);
      ctx2d.quadraticCurveTo(
        portraitX + portraitW,
        portraitY + portraitH,
        portraitX + portraitW - radius,
        portraitY + portraitH,
      );
      ctx2d.lineTo(portraitX + radius, portraitY + portraitH);
      ctx2d.quadraticCurveTo(portraitX, portraitY + portraitH, portraitX, portraitY + portraitH - radius);
      ctx2d.lineTo(portraitX, portraitY + radius);
      ctx2d.quadraticCurveTo(portraitX, portraitY, portraitX + radius, portraitY);
      ctx2d.closePath();
      ctx2d.clip();
      ctx2d.drawImage(characterImage, portraitX, portraitY, portraitW, portraitH);
      ctx2d.restore();
    }

    // Player-controlled focus layer. It sits after all environmental art and
    // before every gameplay primitive, so 100% removes visual noise without
    // weakening lanes, notes, judgments, or the score HUD.
    const backgroundDim = Math.max(0, Math.min(1, backgroundDimRef.current));
    if (backgroundDim > 0) {
      ctx2d.fillStyle = `rgba(0,0,0,${backgroundDim})`;
      ctx2d.fillRect(0, 0, w, h);
    }

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
      ctx2d.fillRect(cx - noteW * 0.45, receptorY - 2, noteW * 0.9, 4 + laneBeat * 3);
      ctx2d.globalAlpha = 1;
    }
    if (surgeTier >= 1) {
      // TUNING+: district hard rule under the rail — the field locks on.
      ctx2d.fillStyle = `rgba(${dr},${dg},${db},${0.55 + beatPulse * 0.25})`;
      ctx2d.fillRect(0, receptorY + 5, w, 3);
    }

    // Combo is persistent context, while notes are the action the player must
    // read next. Paint the number first so a centered two/three-digit streak
    // can never cover incoming middle-lane diamonds on a narrow field.
    if (session.combo >= 2) {
      const tiers = session.combo >= 100 ? 3 : session.combo >= 50 ? 2 : session.combo >= 10 ? 1 : 0;
      const sizes = [34, 44, 56, 68];
      const cols = ["#F5EFE6", "#F2E4C9", "#FFB020", "#E23D3D"];
      const pulse = 1 + Math.min(0.18, (nowPerf % 600) / 600 / 6);
      ctx2d.save();
      ctx2d.textAlign = "center";
      ctx2d.translate(w / 2, receptorY * 0.42);
      ctx2d.scale(pulse, pulse);
      ctx2d.font = `400 ${sizes[tiers]}px Anton, 'Sora', sans-serif`;
      ctx2d.lineWidth = Math.max(4, sizes[tiers] * 0.13);
      inkedText(ctx2d, `${session.combo}`, 0, 0, cols[tiers]);
      ctx2d.restore();
      ctx2d.textAlign = "center";
      ctx2d.font = "600 12px 'IBM Plex Sans', sans-serif";
      ctx2d.lineWidth = 3;
      inkedText(ctx2d, COMBO_COPY.combo.toUpperCase(), w / 2, receptorY * 0.42 + 24, "#A8928B");
    }

    // Countdown keeps the Western pop-art emphasis, but remains contextual
    // guidance. Paint it before pre-rolled notes so chart targets retain the
    // top visual layer whenever their bounds overlap the center count-in.
    if (countdownRemainingMs > 0) {
      const cd = countdownRemainingMs;
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

    // noteScreenY clamps future heads to y=0, so pixel clipping alone would
    // draw the rest of the chart on the top edge. Cull by the same approach
    // window first, retaining unfinished hold/slide tails via session.cursor.
    const noteEnd = visibleNoteEnd(session, effMs, approach);
    for (let i = session.cursor; i < noteEnd; i++) {
      const n = session.order[i]!;
      if (n.done) continue;
      if (measureDraw) noteObjects++;
      const d = n.def;
      const yHead = noteScreenY(n.tMs / 1000, songSec, receptorY, approach);
      if (yHead < -60 || yHead > h + 60) {
        if (d.type !== "hold" && d.type !== "slide") continue;
      }
      if (d.type === "tap") {
        drawNote(d.lane, (d.lane + 0.5) * laneW, yHead, noteW, 1, receptorY);
      } else if (d.type === "hold") {
        const yTail = noteScreenY(n.endMs / 1000, songSec, receptorY, approach);
        const top = Math.min(yHead, yTail);
        const bodyH = Math.abs(yTail - yHead);
        const holding = pressedRef.current.has(d.lane) && n.head !== null && n.tail === null;
        ctx2d.fillStyle = `rgba(${LANE_RGB[d.lane][0]},${LANE_RGB[d.lane][1]},${LANE_RGB[d.lane][2]},${holding ? 0.62 : 0.45})`;
        ctx2d.fillRect((d.lane + 0.5) * laneW - (noteW * HOLD_BODY_RATIO) / 2, top, noteW * HOLD_BODY_RATIO, bodyH);
        if (holding) {
          ctx2d.strokeStyle = `rgba(${LANE_RGB[d.lane][0]},${LANE_RGB[d.lane][1]},${LANE_RGB[d.lane][2]},0.85)`;
          ctx2d.lineWidth = 2;
          ctx2d.strokeRect(
            (d.lane + 0.5) * laneW - (noteW * HOLD_STROKE_RATIO) / 2,
            top,
            noteW * HOLD_STROKE_RATIO,
            bodyH,
          );
        }
        const headAlpha = n.head ? 0.35 : 1;
        drawNote(d.lane, (d.lane + 0.5) * laneW, yHead, noteW, headAlpha, receptorY);
        // The body used to stop without a visual release target. Keep the end
        // quieter before the head lands, then promote it while actively held.
        const tailAlpha = n.head !== null && n.tail === null ? 1 : 0.82;
        drawNote(
          d.lane,
          (d.lane + 0.5) * laneW,
          yTail,
          noteW * HOLD_TAIL_SCALE,
          tailAlpha,
          receptorY,
        );
      } else if (d.type === "chord") {
        // A Chord must read as one simultaneous object, not as unrelated Taps
        // that happen to share a timestamp. The neutral two-stroke bridge sits
        // behind every lane diamond and remains visible while a partial Chord
        // is still waiting for its other inputs.
        let chordMinLane = 3;
        let chordMaxLane = 0;
        let chordPending = 0;
        for (const lane of d.lanes) {
          chordMinLane = Math.min(chordMinLane, lane);
          chordMaxLane = Math.max(chordMaxLane, lane);
          if (n.chord[lane] == null) chordPending++;
        }
        const chordFromX = (chordMinLane + 0.5) * laneW;
        const chordToX = (chordMaxLane + 0.5) * laneW;
        const pendingRatio = chordPending / d.lanes.length;
        ctx2d.save();
        ctx2d.globalAlpha = 0.42 + pendingRatio * 0.38;
        ctx2d.lineCap = "square";
        ctx2d.beginPath();
        ctx2d.moveTo(chordFromX, yHead);
        ctx2d.lineTo(chordToX, yHead);
        ctx2d.strokeStyle = "#000000";
        ctx2d.lineWidth = Math.max(7, noteW * 0.16);
        ctx2d.stroke();
        ctx2d.strokeStyle = "#F5EFE6";
        ctx2d.lineWidth = Math.max(2.5, noteW * 0.055);
        ctx2d.stroke();
        ctx2d.restore();
        for (const l of d.lanes) {
          const a = n.chord[l] != null ? 0.35 : 1;
          drawNote(l, (l + 0.5) * laneW, yHead, noteW, a, receptorY);
        }
      } else if (d.type === "slide") {
        const headDone = n.head !== null;
        const targetHeld = n.tailHeld;
        drawNote(d.lane, (d.lane + 0.5) * laneW, yHead, noteW, headDone ? 0.35 : 1, receptorY);
        const yTail = noteScreenY(n.endMs / 1000, songSec, receptorY, approach);
        // A player who arrives before the endpoint needs an unambiguous
        // confirmation that the continuous gesture is safely owned. Promote
        // the armed dotted trail to a heavier solid rail while the target lane
        // is physically held; this is state feedback only and never changes
        // timing or scoring.
        const slideAlpha = targetHeld ? 1 : headDone ? 0.95 : 0.55;
        ctx2d.strokeStyle = LANE_COLORS[d.to];
        ctx2d.globalAlpha = slideAlpha;
        ctx2d.lineWidth = targetHeld ? 5 : headDone ? 3 : 2;
        ctx2d.setLineDash(targetHeld ? [] : [6, 6]);
        ctx2d.beginPath();
        ctx2d.moveTo((d.lane + 0.5) * laneW, yHead);
        ctx2d.lineTo((d.to + 0.5) * laneW, yTail);
        ctx2d.stroke();
        ctx2d.setLineDash([]);
        ctx2d.globalAlpha = 1;
        if (headDone && n.tail === null) {
          if (targetHeld) {
            drawNote(
              d.to,
              (d.to + 0.5) * laneW,
              yTail,
              noteW * SLIDE_TAIL_SCALE * 1.2,
              0.34,
              receptorY,
            );
          }
          drawNote(
            d.to,
            (d.to + 0.5) * laneW,
            yTail,
            noteW * SLIDE_TAIL_SCALE * (targetHeld ? 1.06 : 1),
            1,
            receptorY,
          );
        }
      }
    }

    // hit particles (physics: gravity + fade)
    if (fancyOn()) {
      // 原地压缩（保序）：filter() 每帧会新建一个数组 + 一个闭包，六个池子加起来
      // 就是每秒 360 次新生代分配，是 GC 抖动的来源之一。
      {
        const arr = particlesRef.current;
        let n = 0;
        for (let i = 0; i < arr.length; i++) {
          const p = arr[i];
          if (nowPerf - p.born < p.life) arr[n++] = p;
        }
        arr.length = n;
      }
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

    // LIGHTING one-shot fixtures — hard-edged, beat-scale, no strobe spam.
    if (fancyOn()) {
      {
        const arr = colsRef.current;
        let n = 0;
        for (let i = 0; i < arr.length; i++) {
          const c = arr[i];
          if (nowPerf - c.born < 380) arr[n++] = c;
        }
        arr.length = n;
      }
      for (const c of colsRef.current) {
        const age = (nowPerf - c.born) / 380;
        const x = c.lane * laneW;
        ctx2d.fillStyle = `rgba(${dr},${dg},${db},${0.26 * (1 - age)})`;
        ctx2d.fillRect(x + 2, 0, laneW - 4, h);
        ctx2d.fillStyle = `rgba(245,239,230,${0.5 * (1 - age)})`;
        ctx2d.fillRect(x + laneW / 2 - 2, 0, 4, h);
      }
      {
        const arr = sweepsRef.current;
        let n = 0;
        for (let i = 0; i < arr.length; i++) {
          const s = arr[i];
          if (nowPerf - s.born < 900) arr[n++] = s;
        }
        arr.length = n;
      }
      for (const s of sweepsRef.current) {
        const age = (nowPerf - s.born) / 900;
        const fromLeft = s.corner === 0;
        const L = Math.hypot(w, h) * 1.15;
        ctx2d.save();
        ctx2d.translate(fromLeft ? -40 : w + 40, -30);
        ctx2d.rotate((fromLeft ? 1 : -1) * (Math.PI / 2.6) + (fromLeft ? -1 : 1) * age * 0.55);
        ctx2d.globalAlpha = 0.2 * (1 - age * 0.7);
        ctx2d.fillStyle = `rgba(${dr},${dg},${db},1)`;
        ctx2d.beginPath();
        ctx2d.moveTo(0, -16);
        ctx2d.lineTo(L, 0);
        ctx2d.lineTo(0, 16);
        ctx2d.closePath();
        ctx2d.fill();
        ctx2d.globalAlpha = 0.5 * (1 - age);
        ctx2d.fillStyle = "rgba(245,239,230,1)";
        ctx2d.fillRect(0, -1.5, L, 3);
        ctx2d.restore();
      }
      // Idle show: a hot streak keeps the rig moving — one column per bar on
      // a rotating lane, a sweep every other bar once the streak is big.
      const rigStreak = Math.max(streakRef.current.count, demoStreak);
      const barSec = 240 / chart.bpm;
      const barIdx = Math.floor(songSec / barSec);
      if (rigStreak >= 80 && barIdx > lastShowBarRef.current) {
        lastShowBarRef.current = barIdx;
        if (colsRef.current.length < 3) colsRef.current.push({ born: nowPerf, lane: barIdx % 4 });
        if (rigStreak >= 120 && barIdx % 2 === 0 && sweepsRef.current.length < 2) {
          sweepsRef.current.push({ born: nowPerf, corner: barIdx % 2 });
        }
      }
    }

    // FX flashes
    {
      const arr = fxRef.current;
      let n = 0;
      for (let i = 0; i < arr.length; i++) {
        const f = arr[i];
        if (nowPerf - f.born < 360) arr[n++] = f;
      }
      arr.length = n;
    }
    for (const f of fxRef.current) {
      const age = (nowPerf - f.born) / 360;
      const cx = (f.lane + 0.5) * laneW;
      const [r, g, b] = f.judgment === "miss" ? LANE_RGB[0] : LANE_RGB[f.lane];

      // Comic starburst instead of an expanding ring.
      const spikes = f.judgment === "miss" ? 7 : f.judgment === "perfect" ? 12 : 9;
      const rad = (reduceMotionOn() ? 22 : 10 + age * 34) * (f.judgment === "perfect" ? 1.3 : 1);
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
      const chordSummary = f.chordFeedback?.summary;
      const feedback = chordSummary ?? f;
      const label = f.chordFeedback && !chordSummary
        ? undefined
        : JUDGE_LABEL[feedback.judgment];
      if (label) {
        const pop = reduceMotionOn()
          ? 1
          : age < 0.18 ? 0.5 + (age / 0.18) * 0.7 : 1.2 - (age - 0.18) * 0.24;
        const isP = feedback.judgment === "perfect";
        // Chord assist is a banked lane with no physical input timestamp. Keep
        // its judgment centered instead of visually leaning "late" from the
        // timeout frame that committed the assist.
        const skewX = feedback.accent === "chord-assist"
          ? 0
          : Math.max(-18, Math.min(18, feedback.deltaMs * 0.35));
        const groupCenterX = chordSummary
          ? f.chordFeedback!.lanes.reduce<number>(
              (sum, lane) => sum + (lane + 0.5) * laneW,
              0,
            )
            / f.chordFeedback!.lanes.length
          : cx;
        const feedbackX = groupCenterX + (reduceMotionOn() ? 0 : skewX);
        ctx2d.save();
        const fs = isP ? 23 : 17;
        ctx2d.font = `400 ${fs}px Anton, 'Sora', sans-serif`;
        ctx2d.lineWidth = Math.max(3, fs * 0.2);
        let labelWidth = judgmentLabelWidths.get(label);
        if (labelWidth === undefined) {
          labelWidth = ctx2d.measureText(label).width;
          judgmentLabelWidths.set(label, labelWidth);
        }
        // The gameplay layer already carries the current shake transform.
        // Clamp in screen coordinates, then convert back to its local space.
        const labelScreenX = judgmentLabelCenterX(
          feedbackX + shx,
          w,
          labelWidth,
          pop,
          ctx2d.lineWidth,
        );
        ctx2d.globalAlpha = Math.max(0, 1 - age * age);
        ctx2d.translate(
          labelScreenX - shx,
          receptorY - 46 - (reduceMotionOn() ? 0 : age * 22),
        );
        ctx2d.scale(pop, pop);
        ctx2d.textAlign = "center";
        inkedText(ctx2d, label, 0, 0, JUDGE_COLOR[feedback.judgment] || "#F5EFE6");
        const timingLabel = judgmentTimingLabel(feedback);
        if (timingLabel) {
          ctx2d.font = "600 10px 'IBM Plex Sans', sans-serif";
          ctx2d.lineWidth = 3;
          // Keep ASSIST attached to the lane the game actually banked, even
          // though the main Chord verdict is centered over the whole group.
          const timingAnchorX = feedback.accent === "chord-assist"
            ? (feedback.lane + 0.5) * laneW + shx
            : labelScreenX;
          const timingCenterX = judgmentTimingCenterX(timingAnchorX, w, timingLabel);
          inkedText(ctx2d, timingLabel, (timingCenterX - labelScreenX) / pop, 15, "#F5EFE6");
        }
        ctx2d.restore();
      }
    }

    ctx2d.restore(); // end gameplay (shaken) layer — HUD stays stable

    // combo-break vignette (HUD layer, stable)
    if (nowPerf < comboBreakRef.current) {
      const t = (comboBreakRef.current - nowPerf) / COMBO_BREAK_MS;
      ctx2d.fillStyle = `rgba(226,61,61,${0.3 * t})`;
      ctx2d.fillRect(0, 0, w, h);
      ctx2d.save();
      ctx2d.globalAlpha = Math.min(1, t * 1.6);
      ctx2d.textAlign = "center";
      ctx2d.textBaseline = "middle";
      ctx2d.font = `400 ${Math.min(22, Math.max(17, w * 0.055))}px Anton, 'Sora', sans-serif`;
      ctx2d.lineWidth = 4;
      inkedText(
        ctx2d,
        COMBO_COPY.break.toUpperCase(),
        w / 2,
        receptorY * 0.42,
        "#E23D3D",
      );
      ctx2d.restore();
    }

    // ON AIR: misprint frame — black rule + district band at the screen edge.
    if (surgeRef.current.tier() === 3) {
      ctx2d.lineWidth = 5;
      ctx2d.strokeStyle = "#000000";
      ctx2d.strokeRect(2.5, 2.5, w - 5, h - 5);
      ctx2d.fillStyle = `rgba(${dr},${dg},${db},${0.5 + beatPulse * 0.3})`;
      ctx2d.fillRect(0, 0, w, 4);
      ctx2d.fillRect(0, h - 4, w, 4);
      ctx2d.fillRect(0, 0, 4, h);
      ctx2d.fillRect(w - 4, 0, 4, h);
    }

    // Resonance-diamond rings (PRD §7.6-5 motif) on LIVE/ON AIR milestones.
    if (ringsRef.current.length) {
      {
        const arr = ringsRef.current;
        let n = 0;
        for (let i = 0; i < arr.length; i++) {
          const b = arr[i];
          if (nowPerf - b < 640) arr[n++] = b;
        }
        arr.length = n;
      }
      for (const born of ringsRef.current) {
        const age = (nowPerf - born) / 640;
        const sz = 120 + age * 260;
        ctx2d.save();
        ctx2d.globalAlpha = Math.max(0, 1 - age) * 0.85;
        ctx2d.translate(w / 2, receptorY * 0.5);
        // Sprite is drawn as a diamond; only a slow drift, never a 45° flip
        // (that would read as squares and break the 共振菱形 motif).
        ctx2d.rotate(age * 0.12);
        if (ringSpriteRef.current) ctx2d.drawImage(ringSpriteRef.current, -sz / 2, -sz / 2, sz, sz);
        ctx2d.restore();
      }
    }

    // LIGHTING marquee: a chase of flat dots along the top edge (all four
    // edges once ON AIR). Speed scales with the streak; gel colour rotates
    // per bar — the lighting designer swapping colour sheets.
    if (fancyOn() && surgeRef.current.tier() >= 1) {
      const rigStreak = Math.max(streakRef.current.count, demoStreak);
      if (rigStreak >= 20) {
        const dot = 8;
        const gap = 14;
        const step = dot + gap;
        const speed = 45 + Math.min(150, rigStreak * 0.5);
        const off = ((nowPerf / 1000) * speed) % step;
        const barSecM = 240 / chart.bpm;
        const gel = LANE_COLORS[(Math.floor(songSec / barSecM) + lastLaneRef.current) % 4]!;
        const edges = surgeRef.current.tier() === 3 ? edgesFour : edgesOne;
        for (const [ex, ey, ew] of edges) {
          const horiz = ew > 0;
          const count = Math.ceil((horiz ? w : h) / step);
          for (let i = 0; i < count; i++) {
            const t = i * step + off;
            if (horiz) {
              if (t > w) continue;
              ctx2d.fillStyle = i % 5 === 0 ? "rgba(245,239,230,0.75)" : gel;
              ctx2d.globalAlpha = 0.6;
              ctx2d.fillRect(ex + t, ey, dot, dot);
            } else {
              if (t > h) continue;
              ctx2d.fillStyle = i % 5 === 0 ? "rgba(245,239,230,0.75)" : gel;
              ctx2d.globalAlpha = 0.6;
              ctx2d.fillRect(ex, ey + t, dot, dot);
            }
          }
        }
        ctx2d.globalAlpha = 1;
      }
    }

    // floating score pops
    {
      const arr = scorePopsRef.current;
      let n = 0;
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        if (nowPerf - p.born < 520) arr[n++] = p;
      }
      arr.length = n;
    }
    for (const p of scorePopsRef.current) {
      const age = (nowPerf - p.born) / 520;
      ctx2d.save();
      ctx2d.globalAlpha = Math.max(0, 1 - age);
      ctx2d.fillStyle = p.color;
      ctx2d.font = "700 14px 'IBM Plex Sans', sans-serif";
      ctx2d.textAlign = "center";
      ctx2d.fillText(p.text, p.x, p.y - (reduceMotionOn() ? 0 : age * 36));
      ctx2d.restore();
    }

    // panel() 定义在 effect 作用域（draw() 外面），免得每帧重建一个闭包。
    // score 只在判定时才变，toLocaleString() 是浏览器里最贵的 API 之一 ——
    // 缓存结果，只有分数真的变了才重新格式化。
    //
    // B-1 · When useComicHud is on, the comic-panel PlayHud (DOM overlay) draws
    // the score / accuracy / SIGNAL tier chips itself. Drawing them again here
    // would double-stack on the canvas and visually fight the DOM HUD, so skip
    // the block entirely. Combo center number, key hints, milestone flash, and
    // floating score pops stay. Combo intentionally lives only here,
    // close to the receptor; the compact DOM HUD owns score/accuracy/progress.
    if (!useComicHud) {
      const scoreText = scoreTextFor(session.score);
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

      // SIGNAL gauge — the run's atmosphere meter (TUNING / LIVE / ON AIR).
      const heat = surgeRef.current.heat;
      const tier = tierForHeat(heat);
      const gx = 14;
      const gy = 52;
      const gw = 12;
      const gh = Math.max(64, Math.min(150, h * 0.22));
      skewPath(ctx2d, gx, gy, gw, gh, 4);
      ctx2d.fillStyle = "#12100F";
      ctx2d.fill();
      ctx2d.lineWidth = 2;
      ctx2d.strokeStyle = "#000000";
      ctx2d.stroke();
      const fillH = (gh - 4) * (heat / 100);
      if (fillH > 0.5) {
        ctx2d.save();
        skewPath(ctx2d, gx, gy, gw, gh, 4);
        ctx2d.clip();
        ctx2d.fillStyle = `rgba(${dr},${dg},${db},0.92)`;
        ctx2d.fillRect(gx + 2, gy + gh - 2 - fillH, gw, fillH + 2);
        ctx2d.restore();
      }
      ctx2d.fillStyle = "rgba(0,0,0,0.9)";
      for (const th of [SURGE_TIERS.t1, SURGE_TIERS.t2, SURGE_TIERS.t3]) {
        ctx2d.fillRect(gx + 2, gy + gh - 2 - (gh - 4) * (th / 100), gw - 4, 1.5);
      }
      // Tier drop: the gauge itself flashes red for a beat — losing the signal
      // must be felt, not just watched to drain (no extra SFX; miss/break cover it).
      const dropAge = (nowPerf - surgeDropRef.current) / 450;
      if (dropAge >= 0 && dropAge < 1) {
        skewPath(ctx2d, gx, gy, gw, gh, 4);
        ctx2d.fillStyle = `rgba(226,61,61,${0.5 * (1 - dropAge)})`;
        ctx2d.fill();
      }
      ctx2d.save();
      ctx2d.translate(gx + gw + 9, gy + gh);
      ctx2d.rotate(-Math.PI / 2);
      ctx2d.font = "700 10px 'IBM Plex Sans', sans-serif";
      ctx2d.textAlign = "left";
      ctx2d.textBaseline = "middle";
      const tierLabel =
        tier === 0 ? SURGE_COPY.gauge : tier === 1 ? SURGE_COPY.t1 : tier === 2 ? SURGE_COPY.t2 : SURGE_COPY.t3;
      ctx2d.lineWidth = 3;
      inkedText(ctx2d, tierLabel, 0, 0, tier === 0 ? "#A8928B" : "#F5EFE6");
      ctx2d.restore();
    }

    // combo milestone flash (center, big, quick)
    if (fancyOn() && milestoneRef.current) {
      const age = (nowPerf - milestoneRef.current.born) / 700;
      if (age >= 1) {
        milestoneRef.current = null;
      } else {
        ctx2d.save();
        ctx2d.globalAlpha = 1 - age;
        ctx2d.translate(w / 2, receptorY * 0.6);
        const sc = 0.7 + age * (MILESTONE_MAX_SCALE - 0.7);
        ctx2d.scale(sc, sc);
        const sprite = milestoneSprites.get(milestoneRef.current.text, spriteDpr, ctx2d.textBaseline);
        ctx2d.imageSmoothingEnabled = true;
        ctx2d.imageSmoothingQuality = "high";
        // Two draws preserve the original stroke-then-fill compositing under
        // the same fading alpha; the maximum-scale raster never upscales.
        ctx2d.drawImage(sprite.stroke, sprite.x, sprite.y, sprite.width, sprite.height);
        ctx2d.drawImage(sprite.fill, sprite.x, sprite.y, sprite.width, sprite.height);
        ctx2d.restore();
      }
    }

    // Key hints sit under the receptor, tinted per lane. New players keep them
    // for their first three runs; experienced solo players get a clean field
    // after the opening count-in. Practice and Duo keep them permanently, and
    // every resume/restart count-in restores them before fading again.
    const keyHintsVisible = showKeyHintsRef.current;
    const inLeadIn = needsStartRef.current || countdownRemainingMs > 0;
    if (keyHintsVisible && !keyHintsVisibleLastFrame && !inLeadIn && !persistentKeyHints) {
      lateKeyboardHintUntil = nowPerf + LATE_KEYBOARD_HINT_MS;
    }
    keyHintsVisibleLastFrame = keyHintsVisible;
    let keyHintOpacity = persistentKeyHints ? 1 : 0;
    if (!persistentKeyHints) {
      if (inLeadIn) {
        keyHintsWereInLeadIn = true;
        keyHintFadeStartedAt = 0;
        lateKeyboardHintUntil = 0;
        keyHintOpacity = 1;
      } else if (keyHintsWereInLeadIn) {
        keyHintsWereInLeadIn = false;
        keyHintFadeStartedAt = nowPerf;
        keyHintOpacity = reduceMotionOn() ? 0 : 1;
      } else if (lateKeyboardHintUntil > 0) {
        keyHintOpacity = nowPerf < lateKeyboardHintUntil
          ? 1
          : reduceMotionOn()
            ? 0
            : Math.max(0, 1 - (nowPerf - lateKeyboardHintUntil) / KEY_HINT_FADE_MS);
      } else if (keyHintFadeStartedAt > 0 && !reduceMotionOn()) {
        keyHintOpacity = Math.max(0, 1 - (nowPerf - keyHintFadeStartedAt) / KEY_HINT_FADE_MS);
      }
    }

    // An external keyboard can arrive after a touch-first run has begun.
    if (keyHintsVisible && keyHintOpacity > 0.01) {
      if (!keyHintSpritesReady) prepareKeyHintSprites();
      ctx2d.save();
      const hintAlpha = ctx2d.globalAlpha * keyHintOpacity;
      ctx2d.globalAlpha = hintAlpha;
      const hintY = Math.min(receptorY + 26, h - 14);
      for (let i = 0; i < 4; i++) {
        const flash = Math.max(
          0,
          1 - (performance.now() - (laneFlashRef.current[i] ?? 0)) / LANE_FLASH_MS,
        );
        const held = pressedRef.current.has(i);
        const cxm = (i + 0.5) * laneW;
        const capW = Math.min(laneW * 0.7, 46);
        const capH = 24;
        skewPath(ctx2d, cxm - capW / 2, hintY - capH / 2, capW, capH, 6);
        ctx2d.fillStyle = held ? LANE_COLORS[i]! : "rgba(18,16,15,0.94)";
        ctx2d.fill();
        ctx2d.lineWidth = 2;
        ctx2d.strokeStyle = "#000000";
        ctx2d.stroke();
        const sprite = keyHintSprites.get(i, held)!;
        // Idle opacity used to live in fillStyle. Apply it to the opaque text
        // image only, then restore the original alpha before the next keycap.
        ctx2d.globalAlpha = hintAlpha * (held ? 1 : Math.min(1, 0.6 + flash * 0.4));
        ctx2d.drawImage(sprite.canvas, cxm + sprite.x, hintY + 1 + sprite.y, sprite.width, sprite.height);
        ctx2d.globalAlpha = hintAlpha;
      }
      ctx2d.restore();
    }

    if (measureDraw) {
      const durationMs = performance.now() - drawStartedAtMs;
      try {
        measureDraw({ startedAtMs: drawStartedAtMs, durationMs, songTimeMs: st, noteObjects, canvas });
      } catch {
        // An external diagnostic observer must not interrupt the game loop.
      }
    }
  };

  const loop = (frameTimeMs: number) => {
    try {
      beforeSessionAdvance(frameTimeMs);
    } catch {
      // A browser input adapter must never terminate the authoritative render
      // and audio-clock loop. Keyboard and touch remain available fallbacks.
    }
    const conductor = conductorRef.current;
    const session = sessionRef.current;
    if (!conductor || !session) {
      raf = requestAnimationFrame(loop);
      return;
    }
    const st = conductor.songTimeMs();
    const eff = st - offsetMsRef.current;
    // Initial and resume lead-ins both come from the Conductor's audio-clock
    // schedule. Resume keeps song time frozen while this value counts down,
    // so rendering, judgment and the source all cross GO on the same frame.
    const countdownRemainingMs = conductor.countdownRemainingMs;

    if (!needsStartRef.current && !pausedRef.current && !finishedRef.current) {
      const misses = session.tick(eff);
      for (const m of misses) {
        addFx(m);
        if (hitsoundRef.current) playHit(m.judgment);
      }
      if (session.consumeSlowTrigger() && conductor.basePlaybackRate > 0.5) {
        conductor.setRate(0.5, 5000);
      }

      // SIGNAL atmosphere meter: decay on the song clock (pause-safe), then
      // flip the tier + wrapper data attribute when it crosses a threshold.
      // 先算 dt 再推进 lastEffMsRef：顺序反了 streak 拿到的 delta 就是 0，
      // decay() 会直接 return（见 surge.ts decayAtmosphere 上的注释）。
      const decayMs = Math.min(250, Math.max(0, eff - lastEffMsRef.current));
      lastEffMsRef.current = eff;
      // ScoreStreak feeds the LIGHTING rig + NEON ambience (survives good).
      decayAtmosphere(surgeRef.current, streakRef.current, decayMs);
      if (demoStreak > 0) streakRef.current.count = Math.max(streakRef.current.count, demoStreak);
      if (demoSurge > 0) {
        const lockHeat = [0, SURGE_TIERS.t1, SURGE_TIERS.t2, SURGE_TIERS.t3][demoSurge];
        surgeRef.current.heat = Math.max(surgeRef.current.heat, lockHeat ?? 0);
      }
      const surgeTier = surgeRef.current.tier();
      if (surgeTier !== surgeTierRef.current) {
        const prevTier = surgeTierRef.current;
        const enteredTop = surgeTier === 3 && prevTier < 3;
        surgeTierRef.current = surgeTier;
        if (surgeTier < prevTier) surgeDropRef.current = performance.now();
        const wrapEl = wrapRef.current;
        if (wrapEl) wrapEl.dataset.surge = fancyOn() ? String(surgeTier) : "0";
        if (enteredTop && fancyOn()) {
          milestoneRef.current = { text: SURGE_COPY.t3, born: performance.now() };
          shakeRef.current = { mag: 8, until: performance.now() + 220 };
          ringsRef.current.push(performance.now());
        }
        // FEEL PACK: tier-entry haptic cue + "the drop" — the touch surface
        // keeps its double-pulse while compatible controllers use a shaped rumble.
        if (surgeTier > prevTier) emitHaptic("surge");
        if (enteredTop && !mutedRef.current) conductor.sweepOpen(380);
        // Tier-entry cue: the station goes live (gated by the hitsound setting).
        if (surgeTier > prevTier && hitsoundRef.current && (surgeTier === 2 || surgeTier === 3)) {
          playSurgeTier(surgeTier);
        }
      }

      // NEON ambience level → viewport layer (CSS-driven, zero re-renders).
      if (variant === "full") {
        const neon = streakRef.current.level();
        if (neon !== prevNeonRef.current) {
          prevNeonRef.current = neon;
          document.body.dataset.neon = fancyOn() ? String(neon) : "0";
        }
      }

      // LIGHTING rig driver (docs/BEATSCAPE-NEON-AMBIENCE.md §2): ScoreStreak
      // is the dimmer board now — surviving good hits keeps the show on.
      const lightStreak = Math.max(streakRef.current.count, demoStreak);
      if (lightStreak === 0) {
        lightComboPrevRef.current = 0;
        lastShowBarRef.current = -1;
      }
      const crossed = (step: number) =>
        Math.floor(lightStreak / step) > Math.floor(lightComboPrevRef.current / step);
      if (lightStreak >= 20 && crossed(20) && colsRef.current.length < 3) {
        colsRef.current.push({ born: performance.now(), lane: lastLaneRef.current });
      }
      if (lightStreak >= 80 && crossed(80) && sweepsRef.current.length < 2) {
        sweepsRef.current.push({ born: performance.now(), corner: sweepsRef.current.length % 2 });
      }
      lightComboPrevRef.current = lightStreak;

      // Consume the engine's monotonic break event rather than inferring from
      // the final Combo. A Good/Miss and a later hit can both land between two
      // rAF frames, leaving Combo > 0 even though the prior streak did break.
      const comboBroke = session.comboBreaks > seenComboBreaksRef.current;
      if (comboBroke) {
        if (hitsoundRef.current) playBreak();
        comboBreakRef.current = performance.now() + COMBO_BREAK_MS;
        // A still-fading combo milestone cannot remain celebratory after the
        // streak has already broken.
        milestoneRef.current = null;
      }
      // A chord can move Combo 9 -> 11 inside one frame. Detect the crossed
      // interval rather than requiring the frame's final value to equal 10.
      // A real break still wins this frame so failure and celebration cannot
      // be shown together.
      const comboMilestone = comboBroke
        ? null
        : crossedComboMilestone(prevComboRef.current, session.combo);
      if (comboMilestone !== null) {
        if (fancyOn()) {
          milestoneRef.current = { text: `${comboMilestone} COMBO!`, born: performance.now() };
          shakeRef.current = { mag: 9, until: performance.now() + 240 };
          // LIVE/ON AIR milestones broadcast a resonance-diamond ring (PRD §7.6-5).
          if (surgeTierRef.current >= 2) ringsRef.current.push(performance.now());
        }
        emitHaptic("milestone");
      }
      prevComboRef.current = session.combo;
      seenComboBreaksRef.current = session.comboBreaks;

      // countdown ticks
      if (countdownRemainingMs > 0) {
        const ci = Math.ceil(countdownRemainingMs / 1000);
        if (ci !== lastCountInt.current) {
          lastCountInt.current = ci;
          // Duo fields share one song clock. The music-owning field also owns
          // global count-in cues so 3/2/1 stays crisp instead of playing once
          // per board; player-specific judgment SFX remain independent.
          if (hitsoundRef.current && !muteMusicRef.current) playCountdownTick(ci);
        }
      }

      // finish
      if (!finishedRef.current) {
        if (session.failed) {
          finishedRef.current = true;
          pressedRef.current.clear();
          conductor.stop();
          const failure = failureRef.current;
          if (failure) {
            failure.dataset.show = "1";
            failure.setAttribute("aria-hidden", "false");
          }
          failureFinishAt = performance.now() + 300;
        } else if (session.isComplete && eff >= lastNoteMsRef.current) {
          finishedRef.current = true;
          conductor.stop();
          finishRun();
        } else if (conductor.finished) {
          finishedRef.current = true;
          conductor.stop();
          finishRun();
        }
      }
    }

    const drawTimeMs = sectionPractice ? eff : st < 0 ? st : eff;
    draw(drawTimeMs, st, countdownRemainingMs);
    if (failureFinishAt > 0 && !failureResultSent && performance.now() >= failureFinishAt) {
      failureResultSent = true;
      finishRun();
    }
    raf = requestAnimationFrame(loop);
  };

  const finishRun = () => {
    const session = sessionRef.current;
    if (!session) return;
    // Attach the latched SIGNAL peak so Results/poster can reward the run
    // without GameSession ever knowing the atmosphere layer exists.
    onFinish({ ...session.getResult(), surgeMaxTier: surgeRef.current.maxTier });
  };

  const addFx = (fx: JudgeFx) => {
    fxRef.current.push({
      lane: fx.lane,
      judgment: fx.judgment,
      born: performance.now(),
      deltaMs: fx.deltaMs,
      ...(fx.accent ? { accent: fx.accent } : {}),
      ...(fx.chordFeedback ? { chordFeedback: fx.chordFeedback } : {}),
    });
    surgeRef.current.apply(fx.judgment);
    streakRef.current.apply(fx.judgment);
    spawnHitFx(fx.lane, fx.judgment);
    const { w } = dimRef.current;
    if (w && fx.scoreGain > 0) {
      const receptorY = receptorYFromGeometry(dimRef.current.h, Math.min(w, dimRef.current.h));
      scorePopsRef.current.push({
        x: (fx.lane + 0.5) * (w / 4),
        y: receptorY - 78,
        text: `+${fx.scoreGain}`,
        born: performance.now(),
        color: JUDGE_COLOR[fx.judgment] ?? "#FFFFFF",
      });
    }
  };

  raf = requestAnimationFrame(loop);
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    const failure = failureRef.current;
    if (failure) {
      failure.dataset.show = "0";
      failure.setAttribute("aria-hidden", "true");
    }
    document.fonts?.removeEventListener("loadingdone", onMilestoneFontsLoaded);
    if (characterImage) characterImage.onload = null;
    milestoneSprites.clear();
    keyHintSprites.dispose();
  };
}
