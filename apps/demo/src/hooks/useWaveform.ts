import { useEffect, useState } from "react";

const PEAKS = 64;

/** Decode audio URL into normalized peak bars for canvas rendering. */
export function useWaveform(src: string | undefined) {
  const [peaks, setPeaks] = useState<number[] | null>(null);

  useEffect(() => {
    if (!src) {
      setPeaks(null);
      return;
    }
    let cancelled = false;
    const ac = new AudioContext();

    async function load() {
      try {
        const res = await fetch(src!);
        const buf = await res.arrayBuffer();
        const audio = await ac.decodeAudioData(buf.slice(0));
        const channel = audio.getChannelData(0);
        const block = Math.max(1, Math.floor(channel.length / PEAKS));
        const next: number[] = [];
        for (let i = 0; i < PEAKS; i++) {
          let max = 0;
          const start = i * block;
          const end = Math.min(channel.length, start + block);
          for (let j = start; j < end; j++) {
            const v = Math.abs(channel[j] ?? 0);
            if (v > max) max = v;
          }
          next.push(max);
        }
        const peakMax = Math.max(...next, 0.001);
        if (!cancelled) setPeaks(next.map((v) => v / peakMax));
      } catch {
        if (!cancelled) setPeaks(null);
      } finally {
        void ac.close();
      }
    }

    void load();
    return () => {
      cancelled = true;
      void ac.close();
    };
  }, [src]);

  return peaks;
}

export function drawPeaks(
  canvas: HTMLCanvasElement,
  peaks: number[] | null,
  color = "#6b7280",
  accent = "#3b82f6",
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  const bars = peaks?.length ?? PEAKS;
  const gap = 2;
  const barW = (width - gap * (bars - 1)) / bars;
  for (let i = 0; i < bars; i++) {
    const norm = peaks?.[i] ?? ((Math.sin(i * 0.7) + 1) / 2) * 0.35 + 0.1;
    const h = norm * (height * 0.85);
    ctx.fillStyle = i < bars * 0.35 ? accent : color;
    ctx.fillRect(i * (barW + gap), (height - h) / 2, barW, h);
  }
}
