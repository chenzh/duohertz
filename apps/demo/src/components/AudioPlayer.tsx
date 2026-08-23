import { useEffect, useRef } from "react";
import type { Messages } from "../i18n";
import { drawPeaks, useWaveform } from "../hooks/useWaveform";
import { Badge } from "./ui";

type Props = {
  src: string;
  engine: string;
  durationSec?: number;
  latencyMs?: number | null;
  jobId?: string;
  demoMode: boolean;
  presentMode?: boolean;
  t: Messages;
};

export function AudioPlayer({
  src,
  engine,
  durationSec,
  latencyMs,
  jobId,
  demoMode,
  presentMode,
  t,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peaks = useWaveform(src);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = presentMode ? 120 : 72;
      drawPeaks(canvas, peaks);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [src, peaks, presentMode]);

  return (
    <div className={`audio-player${presentMode ? " audio-player-present" : ""}`}>
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
      <canvas ref={canvasRef} className="wave-canvas" aria-hidden data-real-waveform={peaks ? "1" : "0"} />
      <div className="player-actions">
        <audio controls src={src} className="native-audio" data-testid="demo-audio" />
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
