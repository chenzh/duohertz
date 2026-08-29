import { useEffect, useRef } from "react";
import { LANE_COLORS, LANE_RGB } from "../constants/scape";
import { makeNoteSprite, noteWidthForLane, NOTE_PROXIMITY_GROWTH } from "../engine/noteSprite";
import { receptorYFromGeometry } from "../input/touchInput";
import { APPROACH_VISIBLE_BEATS } from "../engine/geometry";

const LANE_FLASH_MS = 180;
/** Hero loop timing — scaled from default AR 24 @ 120 BPM with APPROACH_VISIBLE_BEATS. */
const APPROACH_MS = Math.round((APPROACH_VISIBLE_BEATS / 24) * (60 / 120) * 1000);
const SPAWN_MS = Math.round(APPROACH_MS * 0.38);
const LANE_PATTERN = [0, 1, 2, 3, 2, 1, 0, 3] as const;

type FallingNote = { lane: number; born: number };

type Props = {
  /** Lane key labels — same as Settings / PlayField (e.g. D F J K). */
  keyHints: string[];
};

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

/** Mini playfield loop — mirrors real lane flash + key-cap feedback. */
export function HeroGameplayPreview({ keyHints }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sprites = LANE_COLORS.map((c) => makeNoteSprite(c, 120));
    const notes: FallingNote[] = [];
    const laneFlash = [0, 0, 0, 0];
    const laneHeld = [false, false, false, false];
    let patternIdx = 0;
    let lastSpawn = 0;
    let judgeFx: { lane: number; born: number } | null = null;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const spawnNote = (now: number) => {
      const lane = LANE_PATTERN[patternIdx % LANE_PATTERN.length]!;
      patternIdx += 1;
      notes.push({ lane, born: now });
    };

    const hitNote = (lane: number, now: number) => {
      laneFlash[lane] = now;
      laneHeld[lane] = true;
      window.setTimeout(() => {
        laneHeld[lane] = false;
      }, LANE_FLASH_MS);
      judgeFx = { lane, born: now };
    };

    const draw = (now: number) => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;

      if (!lastSpawn) lastSpawn = now;
      if (now - lastSpawn >= SPAWN_MS) {
        spawnNote(now);
        lastSpawn = now;
      }

      const receptorY = receptorYFromGeometry(h, Math.min(w, h));
      const laneW = w / 4;
      const noteW = noteWidthForLane(laneW);

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#12100F";
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 4; i++) {
        const x = i * laneW;
        if (laneHeld[i]) {
          ctx.fillStyle = `rgba(${LANE_RGB[i]![0]},${LANE_RGB[i]![1]},${LANE_RGB[i]![2]},0.16)`;
          ctx.fillRect(x, 0, laneW, h);
        }
        const flash = Math.max(0, 1 - (now - laneFlash[i]!) / LANE_FLASH_MS);
        if (flash > 0) {
          const bandH = Math.min(receptorY, h * 0.3);
          ctx.fillStyle = `rgba(${LANE_RGB[i]![0]},${LANE_RGB[i]![1]},${LANE_RGB[i]![2]},${0.34 * flash})`;
          ctx.fillRect(x, receptorY - bandH, laneW, bandH);
        }
        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      ctx.lineWidth = 5;
      ctx.strokeStyle = "#000000";
      ctx.beginPath();
      ctx.moveTo(0, receptorY);
      ctx.lineTo(w, receptorY);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(245,239,230,0.9)";
      ctx.beginPath();
      ctx.moveTo(0, receptorY);
      ctx.lineTo(w, receptorY);
      ctx.stroke();

      for (let ni = notes.length - 1; ni >= 0; ni--) {
        const n = notes[ni]!;
        const progress = (now - n.born) / APPROACH_MS;
        if (progress >= 1) {
          hitNote(n.lane, now);
          notes.splice(ni, 1);
          continue;
        }
        const y = progress * receptorY;
        const sp = sprites[n.lane];
        if (!sp) continue;
        const prox = Math.max(0, 1 - Math.abs(y - receptorY) / 64);
        const drawSize = noteW * (1 + prox * NOTE_PROXIMITY_GROWTH);
        ctx.globalAlpha = 0.78 + prox * 0.22;
        const cx = (n.lane + 0.5) * laneW;
        ctx.drawImage(sp, cx - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
        ctx.globalAlpha = 1;
      }

      const hintY = Math.min(receptorY + 24, h - 12);
      for (let i = 0; i < 4; i++) {
        const label = keyHints[i] ?? "";
        const flash = Math.max(0, 1 - (now - laneFlash[i]!) / LANE_FLASH_MS);
        const held = laneHeld[i];
        const [r, g, b] = LANE_RGB[i] ?? LANE_RGB[0]!;
        const cx = (i + 0.5) * laneW;
        const capW = Math.min(laneW * 0.7, 46);
        const capH = 22;
        skewPath(ctx, cx - capW / 2, hintY - capH / 2, capW, capH, 5);
        ctx.fillStyle = held ? LANE_COLORS[i]! : "rgba(18,16,15,0.94)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000000";
        ctx.stroke();
        ctx.font = `700 ${held ? 15 : 13}px 'IBM Plex Sans', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = held
          ? "#12100F"
          : `rgba(${r},${g},${b},${Math.min(1, 0.6 + flash * 0.4)})`;
        ctx.fillText(label, cx, hintY + 1);
      }

      if (judgeFx && now - judgeFx.born < 360) {
        const age = (now - judgeFx.born) / 360;
        const cx = (judgeFx.lane + 0.5) * laneW;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - age * age);
        ctx.textAlign = "center";
        ctx.font = "400 18px Anton, 'Sora', sans-serif";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#000000";
        ctx.strokeText("PERFECT", cx, receptorY - 28 - age * 14);
        ctx.fillStyle = "#F2E4C9";
        ctx.fillText("PERFECT", cx, receptorY - 28 - age * 14);
        ctx.restore();
      } else if (judgeFx && now - judgeFx.born >= 360) {
        judgeFx = null;
      }
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [keyHints]);

  return (
    <div ref={wrapRef} className="hero-gameplay-preview" aria-hidden>
      <canvas ref={canvasRef} className="hero-gameplay-canvas" />
    </div>
  );
}
