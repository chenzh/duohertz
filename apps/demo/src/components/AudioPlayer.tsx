import { useEffect, useRef } from "react";
import type { Messages } from "../i18n";
import { Badge } from "./ui";

type Props = {
  src: string;
  engine: string;
  durationSec?: number;
  latencyMs?: number | null;
  jobId?: string;
  demoMode: boolean;
  t: Messages;
};

function drawBars(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#4b5563";
  const bars = 48;
  const gap = 2;
  const barW = (width - gap * (bars - 1)) / bars;
  for (let i = 0; i < bars; i++) {
    const h = ((Math.sin(i * 0.7) + 1) / 2) * (height * 0.7) + height * 0.15;
    ctx.fillRect(i * (barW + gap), (height - h) / 2, barW, h);
  }
}

export function AudioPlayer({ src, engine, durationSec, latencyMs, jobId, demoMode, t }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = 72;
      drawBars(canvas);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [src]);

  return (
    <div className="audio-player">
      <div className="player-meta">
        <Badge tone={engine.includes("ACE") ? "vocal" : "game"}>{engine}</Badge>
        <Badge>{t.mlx}</Badge>
        {durationSec != null && <span>{durationSec}s</span>}
        {latencyMs != null && (
          <span>
            {t.latency}: {(latencyMs / 1000).toFixed(1)}s
          </span>
        )}
      </div>
      <canvas ref={canvasRef} className="wave-canvas" aria-hidden />
      <div className="player-actions">
        <audio controls src={src} className="native-audio" />
        <a className="btn-secondary" href={src} download>
          {t.download}
        </a>
        {!demoMode && jobId && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => void navigator.clipboard.writeText(jobId)}
          >
            {t.copyJobId}
          </button>
        )}
      </div>
    </div>
  );
}
