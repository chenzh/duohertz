export const NOTE_SPEED_MIN = 0.5;
export const NOTE_SPEED_MAX = 2;
export const NOTE_SPEED_STEP = 0.05;
export const NOTE_SPEED_QUICK_STEP = 0.25;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Player-facing scroll speed derived from the engine's legacy approach-time bias. */
export function noteSpeedFromScrollBias(scrollBias: number): number {
  if (!Number.isFinite(scrollBias) || scrollBias <= -1) return 1;
  return rounded(clamp(1 / (1 + scrollBias), NOTE_SPEED_MIN, NOTE_SPEED_MAX));
}

/** Persist a player-facing speed without leaking the inverted engine representation into UI code. */
export function scrollBiasFromNoteSpeed(noteSpeed: number): number {
  const safeSpeed = Number.isFinite(noteSpeed)
    ? clamp(noteSpeed, NOTE_SPEED_MIN, NOTE_SPEED_MAX)
    : 1;
  return 1 / safeSpeed - 1;
}

/** `approachSec` consumes visible duration: faster notes need a smaller multiplier. */
export function approachMultiplierFromScrollBias(scrollBias: number): number {
  return 1 / noteSpeedFromScrollBias(scrollBias);
}

export function nudgeNoteSpeed(current: number, direction: -1 | 1): number {
  return rounded(clamp(
    current + direction * NOTE_SPEED_QUICK_STEP,
    NOTE_SPEED_MIN,
    NOTE_SPEED_MAX,
  ));
}

export function formatNoteSpeed(noteSpeed: number): string {
  return `${noteSpeed.toFixed(2)}×`;
}
