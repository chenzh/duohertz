import type { GameSession } from "../../engine/playState";

/**
 * Exclusive end of the draw window in GameSession.order. The session cursor
 * retains unfinished hold/slide tails even when their heads are in the past.
 * Compute the upper bound afresh so offsets, scroll speed and restarts can move
 * the window in either direction. This returns an index without a frame array.
 */
export function visibleNoteEnd(
  session: Pick<GameSession, "order" | "cursor">,
  songMs: number,
  approachSec: number,
): number {
  const latestHeadMs = songMs + approachSec * 1000;
  let first = session.cursor;
  let end = session.order.length;
  while (first < end) {
    const middle = first + Math.floor((end - first) / 2);
    // A head exactly at spawn is already visible at the top of the field.
    if (session.order[middle]!.tMs <= latestHeadMs) first = middle + 1;
    else end = middle;
  }
  return first;
}
