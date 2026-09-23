/**
 * Long-task protection for timestamped browser input.
 *
 * DOM events and W3C-standard Gamepad snapshots carry the time at which the
 * browser received the physical update. Handlers or the next animation-frame
 * poll can run later when the main thread is busy, which is enough to turn a
 * 15ms Perfect into a Late/Good. Keep a bounded amount of that trustworthy
 * input age and project the authoritative song clock back to the physical
 * input instant.
 */
export const MAX_INPUT_EVENT_AGE_MS = 250;

const FUTURE_TOLERANCE_MS = 2;

/**
 * Convert a modern monotonic input timestamp—or a legacy epoch-based
 * Event.timeStamp—into the current performance timeline. Invalid, stale and
 * future values fail closed to `nowMs`, meaning no latency compensation.
 */
export function inputEventPerformanceTimeMs(
  eventTimeStamp: number,
  nowMs: number,
  timeOriginMs: number,
): number {
  if (!Number.isFinite(nowMs)) return 0;
  if (!Number.isFinite(eventTimeStamp) || eventTimeStamp <= 0) return nowMs;

  let candidate = eventTimeStamp;
  if (candidate > nowMs + FUTURE_TOLERANCE_MS && Number.isFinite(timeOriginMs)) {
    candidate -= timeOriginMs;
  }

  const ageMs = nowMs - candidate;
  if (ageMs < -FUTURE_TOLERANCE_MS || ageMs > MAX_INPUT_EVENT_AGE_MS) return nowMs;
  return Math.min(candidate, nowMs);
}

/** Project a current song-clock sample back to the normalized input instant. */
export function songTimeAtInputMs(
  currentSongTimeMs: number,
  playbackRate: number,
  inputPerformanceTimeMs: number,
  sampledAtPerformanceTimeMs: number,
): number {
  if (!Number.isFinite(currentSongTimeMs)) return currentSongTimeMs;
  const eventAgeMs = sampledAtPerformanceTimeMs - inputPerformanceTimeMs;
  if (!Number.isFinite(eventAgeMs) || eventAgeMs <= 0 || eventAgeMs > MAX_INPUT_EVENT_AGE_MS) {
    return currentSongTimeMs;
  }
  const safeRate = Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1;
  return currentSongTimeMs - eventAgeMs * safeRate;
}
