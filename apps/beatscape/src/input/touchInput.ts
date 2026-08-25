// Touch / pointer input helpers (PRD §4.12 / §4.14).

/** Same-lane keydown debounce — presses closer than this are treated as one. */
export const LANE_DEBOUNCE_MS = 20;

/**
 * Y position of the judgment receptor line, measured from the top of the field.
 * PRD §4.12: the line sits `shortSide * 15%` above the bottom.
 * Signature kept stable for the PRD acceptance test: (height, shortSide, safeArea).
 */
export function receptorYFromGeometry(height: number, shortSide: number, _safeArea = 0): number {
  return height - shortSide * RECEPTOR_BOTTOM_RATIO;
}

/** Map an X coordinate inside the play field to a lane index. */
export function laneFromX(x: number, width: number, laneCount = 4): number {
  const lane = Math.floor((x / width) * laneCount);
  return Math.max(0, Math.min(laneCount - 1, lane));
}

/** True when enough time has passed since the last event in this lane. */
export function debounceOk(lastAtMs: number, nowMs: number): boolean {
  return nowMs - lastAtMs >= LANE_DEBOUNCE_MS;
}
