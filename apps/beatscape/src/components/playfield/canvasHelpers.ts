// Pure canvas / sprite / color / media helpers for the BeatScape playfield.
//
// Extracted from PlayField.tsx (P2-2) so the main component stays focused on
// hooks + orchestration. Everything here is side-effect-free except the cached
// prefers-reduced-motion MediaQueryList, which is a module-level singleton with
// the exact same semantics it had as a file-local in PlayField.

// ---- media ----

/**
 * 缓存的 prefers-reduced-motion 查询。
 *
 * `window.matchMedia()` 每次调用都会新建一个 `MediaQueryList` 并跑一次样式查询。
 * 以前它在 `drawNote()` 里被调用（每个可见音符每帧 2 次），40 个同屏音符算下来
 * 约 5000 次/秒，在中端机上是实打实的每帧预算占用。这里只建一次 MediaQueryList，
 * 用 change 事件维护一个布尔值 —— 调用点退化成一次普通属性读取。
 */
let reducedMotionMq: MediaQueryList | null = null;
let reducedMotion = false;
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  if (!reducedMotionMq) {
    reducedMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion = reducedMotionMq.matches;
    // Safari < 14 只有 addListener；两个分支都挂一遍，成本低。
    reducedMotionMq.addEventListener?.("change", (e) => {
      reducedMotion = e.matches;
    });
  }
  return reducedMotion;
}

export function fancyFxOn(settings: { fancyFx: boolean }): boolean {
  return settings.fancyFx && !prefersReducedMotion();
}

// ---- canvas path / text ----

export function skewPath(
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
export function inkedText(
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

// ---- color ----

/** Parse "#rrggbb" (or "#rgb") into [r,g,b] for canvas tinting. */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ---- sprite factories ----

/** Halftone tile (半调网点, PRD §7.6-4) — district dots on transparent, repeated. */
export function makeHalftonePattern(
  ctx: CanvasRenderingContext2D,
  rgb: [number, number, number],
): CanvasPattern | null {
  const tile = document.createElement("canvas");
  tile.width = 14;
  tile.height = 14;
  const tctx = tile.getContext("2d");
  if (!tctx) return null;
  tctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.9)`;
  tctx.beginPath();
  tctx.arc(7, 7, 2.1, 0, Math.PI * 2);
  tctx.fill();
  return ctx.createPattern(tile, "repeat");
}

/** Concentration rays (集中线) sprite: hard bone lines from the border inward. */
export function makeRaysSprite(w: number, h: number): HTMLCanvasElement | null {
  const c = document.createElement("canvas");
  c.width = Math.max(2, Math.round(w));
  c.height = Math.max(2, Math.round(h));
  const g = c.getContext("2d");
  if (!g) return null;
  const cx = c.width / 2;
  const cy = c.height / 2;
  const edgeR = Math.hypot(c.width, c.height) / 2;
  const rays = 26;
  g.strokeStyle = "rgba(245,239,230,0.85)";
  g.lineCap = "butt";
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + 0.13;
    const outer = edgeR * (0.98 + Math.random() * 0.06);
    const inner = edgeR * (0.42 + Math.random() * 0.1);
    g.lineWidth = 1 + Math.random() * 2.5;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    g.lineTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    g.stroke();
  }
  return c;
}

/** Resonance-diamond ring sprite (PRD §7.6-5): 4 concentric outlines + solid core. */
export function makeDiamondRingSprite(): HTMLCanvasElement | null {
  const S = 220;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d");
  if (!g) return null;
  const cx = S / 2;
  const cy = S / 2;
  g.lineJoin = "miter";
  for (const [r, lw, alpha] of [
    [96, 4, 0.95],
    [72, 3, 0.8],
    [48, 3, 0.65],
    [26, 2, 0.5],
  ] as const) {
    g.beginPath();
    g.moveTo(cx, cy - r);
    g.lineTo(cx + r, cy);
    g.lineTo(cx, cy + r);
    g.lineTo(cx - r, cy);
    g.closePath();
    g.lineWidth = lw;
    g.strokeStyle = `rgba(245,239,230,${alpha})`;
    g.stroke();
  }
  g.beginPath();
  g.moveTo(cx, cy - 9);
  g.lineTo(cx + 9, cy);
  g.lineTo(cx, cy + 9);
  g.lineTo(cx - 9, cy);
  g.closePath();
  g.fillStyle = "#F5EFE6";
  g.fill();
  return c;
}
