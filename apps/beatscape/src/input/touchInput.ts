// Touch / pointer input helpers (PRD §4.12 / §4.14).

/** Same-lane keydown debounce — presses closer than this are treated as one. */
export const LANE_DEBOUNCE_MS = 20;

/** True on phones/tablets with coarse touch pointers (mobile play chrome). */
export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * True when any real touch input is available, including hybrid laptops whose
 * primary pointer is a fine trackpad or mouse. This is intentionally broader
 * than `isCoarsePointer`: capability controls belong in Settings without
 * forcing those devices into the compact phone layout.
 */
export function hasTouchInput(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return navigator.maxTouchPoints > 0
    || window.matchMedia("(any-pointer: coarse)").matches
    || isCoarsePointer();
}

/**
 * Which thumb owns a lane under the standard two-thumb grip:
 * lanes 0–1 to the left thumb, 2–3 to the right.
 *
 * This is what separates a chord a phone can actually play from one it can't.
 * A chord split across hands (1+2, or 0+3) is fine — each thumb takes one.
 * A chord stacked on one hand (0+1, or 2+3) asks a single thumb to hold two
 * lanes at once, which is the single biggest source of unfair misses on
 * touch. See `chordAssist` in the play session.
 */
export function laneHand(lane: number): "left" | "right" {
  return lane <= 1 ? "left" : "right";
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

/** Map a viewport `clientX` into the visible canvas lanes, excluding its 5% rim. */
export function laneFromClientX(clientX: number, rect: DOMRect, laneCount = 4): number | null {
  const w = rect.width;
  const edge = w * 0.05;
  const localX = clientX - rect.left;
  if (localX <= edge || localX >= w - edge) return null;
  return laneFromX(localX, w, laneCount);
}

/** A thumb must travel this far beyond a lane boundary before a drag changes lanes. */
export const TOUCH_DRAG_HYSTERESIS_PX = 8;

/**
 * Prevent tiny boundary wobbles from ending a touch-owned Hold. A deliberate
 * swipe still switches lanes once the thumb is visibly inside the next lane.
 * Initial taps, mouse drags, and the outer edge guard remain precise.
 */
export function laneFromTouchDrag(
  clientX: number,
  rect: DOMRect,
  currentLane: number | null,
  laneCount = 4,
): number | null {
  const nextLane = laneFromClientX(clientX, rect, laneCount);
  if (nextLane === null || currentLane === null || nextLane === currentLane) return nextLane;
  const laneWidth = rect.width / laneCount;
  const margin = Math.min(TOUCH_DRAG_HYSTERESIS_PX, laneWidth * 0.15);
  const localX = clientX - rect.left;
  if (nextLane > currentLane && localX < (currentLane + 1) * laneWidth + margin) return currentLane;
  if (nextLane < currentLane && localX > currentLane * laneWidth - margin) return currentLane;
  return nextLane;
}

export type LaneInputSource = number | string;

export type LaneInputTransition = {
  press: number | null;
  release: number | null;
};

const NO_LANE_TRANSITION = (): LaneInputTransition => ({ press: null, release: null });

/**
 * Owns physical input sources across touch and keyboard.
 *
 * A lane is pressed when its first source arrives and released only after its
 * final source leaves. This matters on touch: lifting one of two fingers from
 * the same lane must not cut a Hold that the other finger still owns. A valid
 * outer-lane touch also stays owned while a captured thumb briefly drifts into
 * the bezel guard; pointerup/cancel/lost-capture still ends it, and entering a
 * different lane performs the normal release + press transition.
 */
export class LaneInputTracker {
  private lastPressMs = new Map<number, number>();
  private sourceLanes = new Map<LaneInputSource, number | null>();
  private laneOwners = new Map<number, Set<LaneInputSource>>();

  begin(source: LaneInputSource, lane: number, timeMs: number): LaneInputTransition {
    if (this.sourceLanes.has(source)) return NO_LANE_TRANSITION();
    this.sourceLanes.set(source, null);
    return this.move(source, lane, timeMs);
  }

  move(source: LaneInputSource, lane: number | null, timeMs: number): LaneInputTransition {
    if (!this.sourceLanes.has(source)) return NO_LANE_TRANSITION();
    const previous = this.sourceLanes.get(source) ?? null;
    if (previous === lane) return NO_LANE_TRANSITION();

    // The edge guard rejects a new touch before begin(), but once a thumb owns
    // an outer lane, a few pixels of bezel drift must not cut a Hold. Pointer
    // end/cancel/lost-capture still calls end(), so this cannot leave a stuck
    // lane; re-entering a real lane below transitions from `previous` as usual.
    if (lane === null) return NO_LANE_TRANSITION();

    const release = previous === null ? null : this.removeOwner(source, previous);
    this.sourceLanes.set(source, lane);
    const press = lane === null ? null : this.addOwner(source, lane, timeMs);
    return { press, release };
  }

  end(source: LaneInputSource): LaneInputTransition {
    if (!this.sourceLanes.has(source)) return NO_LANE_TRANSITION();
    const lane = this.sourceLanes.get(source) ?? null;
    this.sourceLanes.delete(source);
    return {
      press: null,
      release: lane === null ? null : this.removeOwner(source, lane),
    };
  }

  clear(): void {
    this.lastPressMs.clear();
    this.sourceLanes.clear();
    this.laneOwners.clear();
  }

  activeLanes(): Set<number> {
    return new Set(this.laneOwners.keys());
  }

  activeSourceCount(): number {
    return this.sourceLanes.size;
  }

  hasSource(source: LaneInputSource): boolean {
    return this.sourceLanes.has(source);
  }

  laneForSource(source: LaneInputSource): number | null {
    return this.sourceLanes.get(source) ?? null;
  }

  private addOwner(
    source: LaneInputSource,
    lane: number,
    timeMs: number,
  ): number | null {
    let owners = this.laneOwners.get(lane);
    if (!owners) {
      owners = new Set();
      this.laneOwners.set(lane, owners);
    }
    const firstOwner = owners.size === 0;
    owners.add(source);
    if (!firstOwner) return null;

    const last = this.lastPressMs.get(lane);
    if (last !== undefined && timeMs - last < LANE_DEBOUNCE_MS) return null;
    this.lastPressMs.set(lane, timeMs);
    return lane;
  }

  private removeOwner(source: LaneInputSource, lane: number): number | null {
    const owners = this.laneOwners.get(lane);
    if (!owners) return null;
    owners.delete(source);
    if (owners.size > 0) return null;
    this.laneOwners.delete(lane);
    return lane;
  }
}
