import type { LastRun } from "../types/chart";
import { challengeReplayHref } from "./challenge";
import { dailyReplayHref } from "./dailyChallenge";
import { withLibraryReturn } from "./libraryReturn";

/** Build the exact rematch represented by a Results page.
 *
 * Results and the mobile fixed action must not drift: practice keeps its
 * section, Daily keeps its date, challenges keep their target, and story runs
 * keep the scene identity when the page offers a direct replay.
 */
export function resultReplayHref(
  run: LastRun,
  libraryReturnHref = "/library",
  currentDateKey?: string,
): string {
  const dailyHref = dailyReplayHref(run, currentDateKey);
  const baseHref = run.seekedFrom !== undefined
    ? `/play/${run.track_id}?tier=${run.tier}&mode=${run.mode}&seek=${run.seekedFrom}${run.seekedUntil !== undefined ? `&until=${run.seekedUntil}` : ""}${run.practiceRepetitions !== undefined ? `&reps=${run.practiceRepetitions}` : ""}`
    : dailyHref ?? challengeReplayHref(run);
  const shiftHref = run.shiftStep
    ? `${baseHref}&shift=${encodeURIComponent(run.shiftStep)}`
    : baseHref;
  return withLibraryReturn(shiftHref, libraryReturnHref);
}
