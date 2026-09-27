import { readItem, writeItem } from "../storage/safeStorage";
import { inputEventPerformanceTimeMs, songTimeAtInputMs } from "../input/eventTiming";

export const DUOHERTZ_OFFSET_STORAGE_KEY = "duohertz_timing_offset_ms";

export function normalizeDuohertzOffset(value: number): number {
  return Math.max(-200, Math.min(200, Math.round(value)));
}

/** A positive measured offset means the player's input arrived after the audible pulse. */
export function judgedSongTimeMs(songTimeMs: number, offsetMs: number): number {
  return songTimeMs - offsetMs;
}

/** Rewind a Web Audio clock sample to a recent physical DOM input, if its timestamp is trustworthy. */
export function clockTimeAtInputMs(clockNowMs: number, eventTimeStamp: number | undefined,
  sampledAtPerformanceMs: number, timeOriginMs: number): number {
  if (eventTimeStamp === undefined) return clockNowMs;
  const inputAt = inputEventPerformanceTimeMs(eventTimeStamp, sampledAtPerformanceMs, timeOriginMs);
  return songTimeAtInputMs(clockNowMs, 1, inputAt, sampledAtPerformanceMs);
}

export function loadDuohertzOffsetMs(): number {
  const raw = readItem(DUOHERTZ_OFFSET_STORAGE_KEY);
  if (raw === null) return 0;
  const value = Number(raw);
  return Number.isFinite(value) ? normalizeDuohertzOffset(value) : 0;
}

export function saveDuohertzOffsetMs(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  return writeItem(DUOHERTZ_OFFSET_STORAGE_KEY, String(normalizeDuohertzOffset(value)));
}
