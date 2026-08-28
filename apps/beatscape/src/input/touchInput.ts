// Touch / pointer input helpers (PRD §4.12 / §4.14).

/** Same-lane keydown debounce — presses closer than this are treated as one. */
export const LANE_DEBOUNCE_MS = 20;

/** True on phones/tablets with coarse touch pointers (mobile play chrome). */
export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/** Receptor sits this fraction of the field's short side above the bottom (PRD §4.12). */
const RECEPTOR_RATIO = 0.15;

/**
 * Y position of the judgment receptor line, measured from the top of the field.
 * PRD §4.12: the line sits `shortSide * 15%` above the bottom, with the OS
 * safe-area inset subtracted on top.
 * Signature kept stable for the PRD acceptance test: (height, shortSide, safeArea).
 */
export function receptorYFromGeometry(height: number, shortSide: number, safeArea = 0): number {
  const short = Math.min(height, shortSide);
  return height - short * RECEPTOR_RATIO - safeArea;
}

/** Map an X coordinate (already in field-local space) to a lane index. */
export function laneFromX(x: number, width: number, laneCount = 4): number {
  const lane = Math.floor((x / width) * laneCount);
  return Math.max(0, Math.min(laneCount - 1, lane));
}

/**
 * Map a pointer `clientX` to a lane. A 5% edge guard on each side is rejected
 * (returns null) so accidental thumb-rim touches don't trigger notes.
 */
export function laneFromClientX(clientX: number, rect: DOMRect, laneCount = 4): number | null {
  const w = rect.width;
  const edge = w * 0.05;
  if (clientX <= edge || clientX >= w - edge) return null;
  return laneFromX(clientX, w, laneCount);
}

/** True when enough time has passed since the last event in this lane. */
export function debounceOk(lastAtMs: number, nowMs: number): boolean {
  return nowMs - lastAtMs >= LANE_DEBOUNCE_MS;
}

/**
 * Tracks active touch pointers and debounces same-lane repeats.
 * - `press` returns `0` when the press is accepted, `null` when it is ignored
 *   (either a same-lane debounce within LANE_DEBOUNCE_MS, or an out-of-bounds tap).
 * - `release` returns the lane the pointer was holding.
 * - `activeLanes` reports the set of lanes currently held.
 */
export class TouchLaneTracker {
  private lastPressMs = new Map<number, number>();
  private active = new Map<number, number>();

  press(pointerId: number, lane: number, timeMs: number): 0 | null {
    const last = this.lastPressMs.get(lane);
    if (last !== undefined && timeMs - last < LANE_DEBOUNCE_MS) return null;
    this.lastPressMs.set(lane, timeMs);
    this.active.set(pointerId, lane);
    return 0;
  }

  release(pointerId: number): number | null {
    const lane = this.active.get(pointerId);
    if (lane === undefined) return null;
    this.active.delete(pointerId);
    return lane;
  }

  activeLanes(): Set<number> {
    return new Set(this.active.values());
  }
}
