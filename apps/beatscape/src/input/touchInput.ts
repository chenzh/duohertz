/** PRD §4.14 — same-lane debounce; §4.12 — edge guard for §8.2 anti-mistouch */
export const LANE_DEBOUNCE_MS = 20;
export const EDGE_GUARD_PX = 12;

export type LaneIndex = 0 | 1 | 2 | 3;

/** Map client X to lane 0–3; null when in edge guard band (§8.2). */
export function laneFromClientX(
  clientX: number,
  rect: DOMRect,
  edgeGuard = EDGE_GUARD_PX,
): LaneIndex | null {
  const x = clientX - rect.left;
  const w = rect.width;
  if (w <= edgeGuard * 2) return null;
  if (x < edgeGuard || x > w - edgeGuard) return null;
  const innerW = w - edgeGuard * 2;
  const innerX = x - edgeGuard;
  return Math.min(3, Math.floor((innerX / innerW) * 4)) as LaneIndex;
}

export function laneContains(
  lane: LaneIndex,
  clientX: number,
  rect: DOMRect,
  edgeGuard = EDGE_GUARD_PX,
): boolean {
  return laneFromClientX(clientX, rect, edgeGuard) === lane;
}

/** PRD §4.12 — receptor distance from bottom = short side × 15% (+ safe-area). */
export function receptorYFromGeometry(
  fieldHeight: number,
  fieldWidth: number,
  safeBottom = 0,
): number {
  const shortSide = Math.min(fieldWidth, fieldHeight);
  const fromBottom = shortSide * 0.15 + safeBottom;
  return Math.max(0, fieldHeight - fromBottom);
}

export function readSafeAreaBottomPx(): number {
  if (typeof document === "undefined") return 0;
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;bottom:0;padding-bottom:env(safe-area-inset-bottom,0px);visibility:hidden;";
  document.documentElement.appendChild(probe);
  const px = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return px;
}

/** Multi-pointer lane binding — PRD §4.14 multi-finger + debounce. */
export class TouchLaneTracker {
  private pointerLanes = new Map<number, LaneIndex>();
  private lastPressAt = new Map<LaneIndex, number>();

  activeLanes(): Set<LaneIndex> {
    return new Set(this.pointerLanes.values());
  }

  boundLane(pointerId: number): LaneIndex | undefined {
    return this.pointerLanes.get(pointerId);
  }

  /** Returns lane when press is accepted; null when debounced or edge. */
  press(pointerId: number, lane: LaneIndex | null, now = performance.now()): LaneIndex | null {
    if (lane === null) return null;
    const last = this.lastPressAt.get(lane) ?? 0;
    if (now - last < LANE_DEBOUNCE_MS) return null;
    this.lastPressAt.set(lane, now);
    this.pointerLanes.set(pointerId, lane);
    return lane;
  }

  release(pointerId: number): LaneIndex | null {
    const lane = this.pointerLanes.get(pointerId) ?? null;
    if (lane !== null) this.pointerLanes.delete(pointerId);
    return lane;
  }

  releaseAll(): LaneIndex[] {
    const lanes = [...this.pointerLanes.values()];
    this.pointerLanes.clear();
    return lanes;
  }
}

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function isLandscapePhone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(orientation: landscape) and (max-height: 500px)").matches;
}
