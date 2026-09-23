import type { JudgeFx } from "../../engine/playState";

type TimingFeedback = Pick<JudgeFx, "judgment" | "deltaMs" | "accent">;

/**
 * Keep the common EARLY/LATE coaching compact while naming gesture errors
 * precisely. A normal auto-Miss has no trustworthy player timing and remains
 * just MISS; Hold and Slide endpoint failures get an actionable correction.
 */
export function judgmentTimingLabel(feedback: TimingFeedback): string | null {
  const release = feedback.accent === "hold-release" || feedback.accent === "hold-release-miss";
  if (release) {
    if (feedback.judgment !== "miss" && Math.abs(feedback.deltaMs) < 8) return null;
    return feedback.deltaMs < 0 ? "EARLY RELEASE" : "LATE RELEASE";
  }
  if (feedback.accent === "slide-target-miss") return "REACH TARGET";
  if (feedback.accent === "slide-hold-miss") return "HOLD TO END";
  // A banked Chord lane has no physical timing of its own. Calling the
  // timeout delta LATE would coach the player to correct an input they never
  // made, so identify the enabled accessibility/fairness rule instead.
  if (feedback.accent === "chord-assist") return "ASSIST";
  if (feedback.judgment === "miss" || Math.abs(feedback.deltaMs) < 8) return null;
  return feedback.deltaMs < 0 ? "EARLY" : "LATE";
}

/** Keep longer gesture coaching inside narrow first/last lanes. */
export function judgmentTimingCenterX(rawCenterX: number, canvasWidth: number, label: string): number {
  if (label.length <= 8 || !Number.isFinite(rawCenterX) || !Number.isFinite(canvasWidth)) {
    return rawCenterX;
  }
  const edgeMargin = Math.min(56, Math.max(0, canvasWidth / 2));
  return Math.min(canvasWidth - edgeMargin, Math.max(edgeMargin, rawCenterX));
}

/**
 * Keep the main judgment word, including its outline and current pop scale,
 * inside the visible canvas. The starburst remains anchored to the true lane;
 * only the text group moves inward when an EARLY/LATE lean points offscreen.
 */
export function judgmentLabelCenterX(
  rawCenterX: number,
  canvasWidth: number,
  textWidth: number,
  scale: number,
  strokeWidth: number,
): number {
  if (
    !Number.isFinite(rawCenterX)
    || !Number.isFinite(canvasWidth)
    || !Number.isFinite(textWidth)
    || !Number.isFinite(scale)
    || !Number.isFinite(strokeWidth)
  ) return rawCenterX;

  const width = Math.max(0, canvasWidth);
  const halfExtent = (
    (Math.max(0, textWidth) + Math.max(0, strokeWidth)) * Math.max(0, scale) / 2
  ) + 2;
  const edgeMargin = Math.min(width / 2, halfExtent);
  return Math.min(width - edgeMargin, Math.max(edgeMargin, rawCenterX));
}
