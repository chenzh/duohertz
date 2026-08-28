import type { LastRun } from "../types/chart";
import { SCAPE_COPY } from "../constants/scape";

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

  ctx.fillStyle = "#0B0F14";
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.72, H * 0.28, 0, W * 0.72, H * 0.28, W * 0.55);
  glow.addColorStop(0, "rgba(61,220,255,0.22)");
  glow.addColorStop(1, "rgba(11,15,20,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  for (let x = 0; x < W; x += 48) {
    ctx.strokeStyle = "rgba(30,42,58,0.35)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 48) {
    ctx.strokeStyle = "rgba(30,42,58,0.35)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#3DDCFF";
  ctx.lineWidth = 6;
  const cx = W * 0.72;
  const cy = H * 0.48;
  const r = 180;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.75, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.75, cy);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = "#E8EEF7";
  ctx.font = "bold 64px system-ui, sans-serif";
  ctx.fillText(run.title, 72, 160);
  ctx.fillStyle = "#8B9BB0";
  ctx.font = "32px system-ui, sans-serif";
  ctx.fillText(run.artist, 72, 220);
  if (district) {
    ctx.fillStyle = "#3DDCFF";
    ctx.font = "600 24px system-ui, sans-serif";
    ctx.fillText(`${district} · BeatScape`, 72, 268);
  }

  ctx.fillStyle = run.grade === "S" ? "#F5C542" : "#3DDCFF";
  ctx.font = "bold 120px system-ui, sans-serif";
  ctx.fillText(run.grade, 72, 400);
  ctx.fillStyle = "#E8EEF7";
  ctx.font = "36px system-ui, sans-serif";
  ctx.fillText(`${run.accuracy}% Acc · ${run.score.toLocaleString()} pts`, 72, 460);
  ctx.fillStyle = "#8B9BB0";
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillText(`Max Combo ${run.maxCombo}x`, 72, 510);

  roundRect(ctx, 72, H - 88, W - 144, 48, 12);
  ctx.fillStyle = "#121A24";
  ctx.fill();
  ctx.fillStyle = "#8B9BB0";
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
