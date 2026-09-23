export const COMBO_MILESTONES = [10, 25, 50, 100, 150, 200, 300] as const;

/**
 * Return the highest milestone crossed while Combo advanced between frames.
 * Chords can award multiple judgments in one input batch, so the final Combo
 * may legitimately jump over an exact threshold (for example 9 -> 11).
 */
export function crossedComboMilestone(
  previousCombo: number,
  currentCombo: number,
): number | null {
  const previous = Math.max(0, previousCombo);
  if (!Number.isFinite(currentCombo) || currentCombo <= previous) return null;

  let crossed: number | null = null;
  for (const milestone of COMBO_MILESTONES) {
    if (milestone > previous && milestone <= currentCombo) crossed = milestone;
  }
  return crossed;
}
