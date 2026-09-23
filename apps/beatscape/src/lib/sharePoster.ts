import type { LastRun } from "../types/chart";
import { COMBO_COPY, SCAPE_COPY } from "../constants/scape";

export type SharePosterFormat = "landscape" | "portrait";

const POSTER_SIZE: Record<SharePosterFormat, { width: number; height: number }> = {
  landscape: { width: 1200, height: 630 },
  portrait: { width: 1080, height: 1350 },
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Poster export failed"))), "image/png");
  });
}

function setFittedFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  weight = "400",
  family = "Anton, system-ui, sans-serif",
) {
  let size = maxSize;
  do {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return;
    size -= 2;
  } while (size >= minSize);
}

function drawOnAirTag(ctx: CanvasRenderingContext2D, width: number, y: number) {
  const label = "ON AIR";
  ctx.font = "400 30px Anton, system-ui, sans-serif";
  const bw = ctx.measureText(label).width + 44;
  const bx = width - 72 - bw;
  ctx.beginPath();
  ctx.moveTo(bx + 12, y);
  ctx.lineTo(bx + bw, y);
  ctx.lineTo(bx + bw - 12, y + 44);
  ctx.lineTo(bx, y + 44);
  ctx.closePath();
  ctx.fillStyle = "#FFB020";
  ctx.fill();
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#12100F";
  ctx.fillText(label, bx + 22, y + 33);
}

export async function renderSharePoster(
  run: LastRun,
  district = "",
  format: SharePosterFormat = "landscape",
): Promise<Blob> {
  const { width: W, height: H } = POSTER_SIZE[format];
  if ("fonts" in document) {
    await Promise.allSettled([
      document.fonts.load("400 84px Anton", run.title),
      document.fonts.load("600 32px Sora", run.artist),
    ]);
  }
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  // PRD §7.5 v2.0 · RESONANCE: flat ink ground, halftone dots, hard strokes.
  ctx.fillStyle = "#12100F";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(226,61,61,0.14)";
  for (let x = 8; x < W; x += 8) {
    for (let y = 8; y < H; y += 8) {
      ctx.fillRect(x, y, 1.6, 1.6);
    }
  }

  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Resonance motif: concentric diamonds, outlined outer + solid core.
  const cx = format === "portrait" ? W * 0.72 : W * 0.72;
  const cy = format === "portrait" ? 650 : H * 0.48;
  const rings = format === "portrait"
    ? [
        { r: 290, fill: null, stroke: "rgba(226,61,61,0.62)", w: 8 },
        { r: 198, fill: null, stroke: "rgba(242,228,201,0.34)", w: 5 },
        { r: 112, fill: "rgba(226,61,61,0.52)", stroke: null, w: 0 },
      ]
    : [
        { r: 190, fill: null, stroke: "#E23D3D", w: 6 },
        { r: 130, fill: null, stroke: "#F2E4C9", w: 4 },
        { r: 78, fill: "#E23D3D", stroke: null, w: 0 },
      ];
  for (const ring of rings) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - ring.r);
    ctx.lineTo(cx + ring.r * 0.75, cy);
    ctx.lineTo(cx, cy + ring.r);
    ctx.lineTo(cx - ring.r * 0.75, cy);
    ctx.closePath();
    if (ring.fill) {
      ctx.fillStyle = ring.fill;
      ctx.fill();
    }
    if (ring.stroke) {
      ctx.strokeStyle = ring.stroke;
      ctx.lineWidth = ring.w;
      ctx.stroke();
    }
  }

  if (format === "portrait") {
    ctx.fillStyle = "#F5EFE6";
    ctx.font = "400 52px Anton, system-ui, sans-serif";
    ctx.fillText("BEATSCAPE", 72, 94);
    ctx.fillStyle = "#E23D3D";
    ctx.font = "700 22px Sora, system-ui, sans-serif";
    ctx.fillText("SCORE CARD · PLAY THE RUN", 72, 132);
    if (run.surgeMaxTier === 3) drawOnAirTag(ctx, W, 56);

    ctx.fillStyle = "#F5EFE6";
    setFittedFont(ctx, run.title, W - 144, 86, 52);
    ctx.fillText(run.title, 72, 246);
    ctx.fillStyle = "#A8928B";
    ctx.font = "32px Sora, system-ui, sans-serif";
    ctx.fillText(run.artist, 72, 298);
    ctx.fillStyle = "#E23D3D";
    ctx.font = "700 23px Sora, system-ui, sans-serif";
    ctx.fillText(`${district ? `${district} · ` : ""}${run.tier.toUpperCase()} · ${run.mode.toUpperCase()}`, 72, 344);

    if (run.seekedFrom !== undefined) {
      const whole = Math.max(0, Math.floor(run.seekedFrom));
      const clock = `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
      const range = run.seekedUntil === undefined
        ? `FROM ${clock}`
        : `${clock}–${Math.floor(run.seekedUntil / 60)}:${String(Math.floor(run.seekedUntil) % 60).padStart(2, "0")}`;
      ctx.fillStyle = "#FFB020";
      ctx.font = "700 22px Sora, system-ui, sans-serif";
      ctx.fillText(`PRACTICE · ${range} · NOT RANKED`, 72, 386);
    }

    ctx.fillStyle = "#E23D3D";
    ctx.font = "700 22px Sora, system-ui, sans-serif";
    ctx.fillText("GRADE", 72, 458);
    ctx.fillStyle = run.grade === "S" ? "#FFB020" : "#F5EFE6";
    ctx.font = "400 350px Anton, system-ui, sans-serif";
    ctx.fillText(run.grade, 72, 778);

    roundRect(ctx, 520, 414, 488, 468, 14);
    ctx.fillStyle = "rgba(28,23,23,0.92)";
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 5;
    ctx.stroke();

    const statRows = [
      ["SCORE", run.score.toLocaleString("en-US")],
      ["ACCURACY", `${run.accuracy}%`],
      ["MAX COMBO", `${run.maxCombo}×`],
    ] as const;
    statRows.forEach(([label, value], index) => {
      const y = 474 + index * 142;
      ctx.fillStyle = "#A8928B";
      ctx.font = "700 20px Sora, system-ui, sans-serif";
      ctx.fillText(label, 566, y);
      ctx.fillStyle = index === 1 ? "#FFB020" : "#F5EFE6";
      setFittedFont(ctx, value, 392, 58, 42, "400");
      ctx.fillText(value, 566, y + 66);
      if (index < statRows.length - 1) {
        ctx.strokeStyle = "rgba(168,146,139,0.28)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(566, y + 96);
        ctx.lineTo(962, y + 96);
        ctx.stroke();
      }
    });

    roundRect(ctx, 72, 974, W - 144, 190, 14);
    ctx.fillStyle = "#E23D3D";
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = "#12100F";
    ctx.font = "700 22px Sora, system-ui, sans-serif";
    ctx.fillText("CAN YOU BEAT THIS RUN?", 112, 1034);
    ctx.font = "400 48px Anton, system-ui, sans-serif";
    ctx.fillText("BEATSCAPE.PAGES.DEV", 112, 1092);
    ctx.font = "600 23px Sora, system-ui, sans-serif";
    ctx.fillText("NO ACCOUNT · NO ADS · BROWSER-LOCAL", 112, 1134);

    ctx.fillStyle = "#F5EFE6";
    ctx.font = "400 32px Anton, system-ui, sans-serif";
    ctx.fillText("FEEL THE BEAT, OWN THE SCAPE.", 72, 1242);
    ctx.fillStyle = "#A8928B";
    ctx.font = "21px Sora, system-ui, sans-serif";
    ctx.fillText(SCAPE_COPY.rightsShort, 72, 1286);
    ctx.fillStyle = "#E23D3D";
    ctx.fillRect(72, 1314, W - 144, 8);

    return canvasToPng(canvas);
  }

  ctx.fillStyle = "#F5EFE6";
  ctx.font = "400 68px Anton, system-ui, sans-serif";
  ctx.fillText(run.title, 72, 160);
  ctx.fillStyle = "#A8928B";
  ctx.font = "32px system-ui, sans-serif";
  ctx.fillText(run.artist, 72, 220);
  if (district) {
    ctx.fillStyle = "#E23D3D";
    ctx.font = "600 24px system-ui, sans-serif";
    ctx.fillText(`${district} · BeatScape`, 72, 268);
  }
  if (run.seekedFrom !== undefined) {
    const whole = Math.max(0, Math.floor(run.seekedFrom));
    const clock = `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
    const range = run.seekedUntil === undefined
      ? `FROM ${clock}`
      : `${clock}–${Math.floor(run.seekedUntil / 60)}:${String(Math.floor(run.seekedUntil) % 60).padStart(2, "0")}`;
    ctx.fillStyle = "#FFB020";
    ctx.font = "700 22px system-ui, sans-serif";
    ctx.fillText(`PRACTICE · ${range} · NOT RANKED`, 72, district ? 304 : 268);
  }

  ctx.fillStyle = run.grade === "S" ? "#FFB020" : "#E23D3D";
  ctx.font = "400 132px Anton, system-ui, sans-serif";
  ctx.fillText(run.grade, 72, 408);
  ctx.fillStyle = "#F5EFE6";
  ctx.font = "36px system-ui, sans-serif";
  ctx.fillText(`${run.accuracy}% Acc · ${run.score.toLocaleString()} pts`, 72, 468);
  ctx.fillStyle = "#A8928B";
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillText(`${COMBO_COPY.maxCombo} ${run.maxCombo}x`, 72, 518);

  // ON AIR tag (docs/BEATSCAPE-SURGE-FX.md): only the top SIGNAL tier earns
  // poster space — skewed chip, flat gold, hard ink outline (PRD §7.6).
  if (run.surgeMaxTier === 3) drawOnAirTag(ctx, W, 56);

  roundRect(ctx, 72, H - 88, W - 144, 48, 10);
  ctx.fillStyle = "#1C1717";
  ctx.fill();
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#A8928B";
  ctx.font = "22px system-ui, sans-serif";
  ctx.fillText(SCAPE_COPY.rightsShort + " · Feel the Beat, Own the Scape.", 96, H - 54);

  return canvasToPng(canvas);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
