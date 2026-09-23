export type GamepadNavigationDirection = "up" | "down" | "left" | "right";

export type GamepadNavigationRect = Pick<DOMRect, "left" | "right" | "top" | "bottom">;

function centerX(rect: GamepadNavigationRect): number {
  return (rect.left + rect.right) / 2;
}

function centerY(rect: GamepadNavigationRect): number {
  return (rect.top + rect.bottom) / 2;
}

function intervalGap(a0: number, a1: number, b0: number, b1: number): number {
  if (a1 < b0) return b0 - a1;
  if (b1 < a0) return a0 - b1;
  return 0;
}

/**
 * Pick the most natural control in a requested half-plane. Alignment carries
 * more weight than a small diagonal distance, matching console/TV focus grids.
 */
export function spatialGamepadTarget(
  rects: readonly GamepadNavigationRect[],
  currentIndex: number,
  direction: GamepadNavigationDirection,
): number | null {
  const current = rects[currentIndex];
  if (!current) return null;

  const currentX = centerX(current);
  const currentY = centerY(current);
  let bestIndex: number | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  rects.forEach((candidate, index) => {
    if (index === currentIndex) return;
    const deltaX = centerX(candidate) - currentX;
    const deltaY = centerY(candidate) - currentY;
    const horizontal = direction === "left" || direction === "right";
    const forward = direction === "left"
      ? -deltaX
      : direction === "right"
        ? deltaX
        : direction === "up"
          ? -deltaY
          : deltaY;
    if (forward <= 1) return;

    const crossGap = horizontal
      ? intervalGap(current.top, current.bottom, candidate.top, candidate.bottom)
      : intervalGap(current.left, current.right, candidate.left, candidate.right);
    const crossCenter = horizontal ? Math.abs(deltaY) : Math.abs(deltaX);
    const score = forward + crossGap * 3 + crossCenter * 0.25;
    if (score < bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}
