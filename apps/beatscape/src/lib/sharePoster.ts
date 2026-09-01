import type { LastRun } from "../types/chart";
import { COMBO_COPY, SCAPE_COPY } from "../constants/scape";

const W = 1200;
const H = 630;

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

export async function renderSharePoster(run: LastRun, district = ""): Promise<Blob> {
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
  const cx = W * 0.72;
  const cy = H * 0.48;
  const rings = [
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
  if (run.surgeMaxTier === 3) {
    const label = "ON AIR";
    ctx.font = "400 30px Anton, system-ui, sans-serif";
    const bw = ctx.measureText(label).width + 44;
    const bx = W - 72 - bw;
    const by = 56;
    ctx.beginPath();
    ctx.moveTo(bx + 12, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw - 12, by + 44);
    ctx.lineTo(bx, by + 44);
    ctx.closePath();
    ctx.fillStyle = "#FFB020";
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#12100F";
    ctx.fillText(label, bx + 22, by + 33);
  }

  roundRect(ctx, 72, H - 88, W - 144, 48, 10);
  ctx.fillStyle = "#1C1717";
  ctx.fill();
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#A8928B";
  ctx.font = "22px system-ui, sans-serif";
  ctx.fillText(SCAPE_COPY.rightsShort + " · Feel the Beat, Own the Scape.", 96, H - 54);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Poster export failed"))), "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
