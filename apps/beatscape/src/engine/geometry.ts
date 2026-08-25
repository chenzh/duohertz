// Note geometry. The scroll time a note is visible is beat-based (PRD §4.10):
//   approach_sec = (50 / AR) * (60 / BPM) * (1 + scrollBias)
// This makes the fall speed scale with tempo, so a 160 BPM chart scrolls
// noticeably faster than an 88 BPM one — which the old code completely ignored.

export const RECEPTOR_BOTTOM_RATIO = 0.15;

/** Seconds a note is visible before it reaches the receptor line. */
export function approachSec(ar: number, bpm: number, scrollBiasMult = 1): number {
  const beats = 50 / (ar || 24);
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
  const progress = (songTimeSec - spawnTime) / approach;
  return progress * receptorY;
}
