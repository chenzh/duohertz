// Note geometry. The scroll time a note is visible is beat-based (PRD §4.10):
//   approach_sec = (APPROACH_VISIBLE_BEATS / AR) * (60 / BPM) * (1 + scrollBias)
// This makes the fall speed scale with tempo, so a 160 BPM chart scrolls
// noticeably faster than an 88 BPM one — which the old code completely ignored.

/** Beats of visibility before the receptor; higher = slower scroll (visual only). */
export const APPROACH_VISIBLE_BEATS = 64;

/** Seconds a note is visible before it reaches the receptor line. */
export function approachSec(ar: number, bpm: number, scrollBiasMult = 1): number {
  const beats = APPROACH_VISIBLE_BEATS / (ar || 24);
  return beats * (60 / (bpm || 120)) * scrollBiasMult;
}

/**
 * Vertical screen position of a note whose hit time is `noteTimeSec`.
 * At `songTimeSec === noteTimeSec` the note sits exactly on the receptor (y = receptorY).
 * Returns y in field pixels (0 = top, receptorY = line, >receptorY = below the line).
 */
export function noteScreenY(
  noteTimeSec: number,
  songTimeSec: number,
  receptorY: number,
  approach: number,
): number {
  const spawnTime = noteTimeSec - approach;
  let progress = (songTimeSec - spawnTime) / approach;
  progress = Math.max(0, Math.min(1, progress));
  // Visual ease-in near receptor — timing unchanged, only scroll feel.
  if (progress > 0.88) {
    const t = (progress - 0.88) / 0.12;
    progress = 0.88 + (1 - (1 - t) ** 3) * 0.12;
  }
  return progress * receptorY;
}

/** 0 at spawn, 1 when note sits on the receptor — drives size/brightness. */
export function noteProximityFactor(noteY: number, receptorY: number, bandPx = 64): number {
  const dist = Math.abs(noteY - receptorY);
  return Math.max(0, 1 - dist / bandPx);
}
