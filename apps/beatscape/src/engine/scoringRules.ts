/**
 * Local score schema revision.
 *
 * v1 incorrectly registered both endpoints of a Slide even though the chart
 * denominator counts the gesture once. v2 settles one judgment at completion.
 */
export const CURRENT_SCORING_VERSION = 2;

/** Existing chart+tier rows that could have been persisted under the v1 bug. */
const LEGACY_DOUBLE_SCORED_SLIDE_CHARTS = new Set([
  "bs-p3-09|standard",
  "bs-p3-09|hard",
  "bs-s2-01|standard",
  "bs-s2-01|hard",
  "bs-s4-10|standard",
  "bs-s4-10|hard",
  "bs-s5-05|standard",
  "bs-s5-05|hard",
  "bs-s6-34|standard",
  "bs-s6-34|hard",
]);

/** Preserve all unaffected history; only affected v1 rows need a v2 marker. */
export function isCompatibleScoringVersion(
  trackId: string,
  tier: string,
  scoringVersion: unknown,
): boolean {
  if (scoringVersion !== undefined &&
      (!Number.isInteger(scoringVersion) || (scoringVersion as number) < 1)) return false;
  return !LEGACY_DOUBLE_SCORED_SLIDE_CHARTS.has(`${trackId}|${tier}`) ||
    (scoringVersion as number | undefined) === CURRENT_SCORING_VERSION;
}
