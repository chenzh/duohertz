/**
 * Schedule a short, self-owned calibration pulse on the shared Web Audio clock.
 *
 * `setInterval` is not precise enough for latency measurement. These nodes are
 * created up front and started at an absolute AudioContext time, so UI frame or
 * timer jitter cannot move the audible reference beat.
 */
export function scheduleCalibrationPulse(
  ctx: AudioContext,
  whenSeconds: number,
  accent: boolean,
): () => void {
  const output = ctx.createGain();
  const high = ctx.createOscillator();
  const body = ctx.createOscillator();
  const duration = accent ? 0.075 : 0.055;
  const peak = accent ? 0.15 : 0.11;

  high.type = "triangle";
  high.frequency.setValueAtTime(accent ? 1_320 : 990, whenSeconds);
  body.type = "sine";
  body.frequency.setValueAtTime(accent ? 220 : 180, whenSeconds);

  output.gain.setValueAtTime(0.0001, whenSeconds);
  output.gain.linearRampToValueAtTime(peak, whenSeconds + 0.003);
  output.gain.exponentialRampToValueAtTime(0.0001, whenSeconds + duration);

  high.connect(output);
  body.connect(output);
  output.connect(ctx.destination);
  high.start(whenSeconds);
  body.start(whenSeconds);
  high.stop(whenSeconds + duration + 0.01);
  body.stop(whenSeconds + duration + 0.01);

  let cancelled = false;
  const disconnect = () => {
    try { high.disconnect(); } catch { /* already disconnected */ }
    try { body.disconnect(); } catch { /* already disconnected */ }
    try { output.disconnect(); } catch { /* already disconnected */ }
  };
  high.addEventListener("ended", disconnect, { once: true });

  return () => {
    if (cancelled) return;
    cancelled = true;
    try { high.stop(); } catch { /* already ended */ }
    try { body.stop(); } catch { /* already ended */ }
    disconnect();
  };
}
