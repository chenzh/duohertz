/**
 * Feedback vibration (FEEL PACK, docs/BEATSCAPE-SURGE-FX.md).
 * Android/Chromium only — iOS Safari has no navigator.vibrate and silently
 * no-ops. Throttled so chord bursts don't machine-gun the motor.
 */
let lastAt = 0;

export function vibrate(pattern: number | number[], minGapMs = 80): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  const now = performance.now();
  if (minGapMs > 0 && now - lastAt < minGapMs) return;
  lastAt = now;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* unsupported / disabled */
  }
}
