import { resolveTrackVibe } from "../catalog/trackVibe";
import type { CatalogTrack } from "../types/catalog";
import type { ChartTier } from "../types/chart";
import type { RunRecord } from "./progress";

type RankedTrack = {
  track: CatalogTrack;
  unplayed: boolean;
  sameVibe: boolean;
  lastPlayedAt: number;
  bpmDistance: number;
  durationDistance: number;
  forwardDistance: number;
};

/**
 * Pick one deterministic follow-up for a completed free-play run.
 *
 * Freshness comes first; within that group, the same vibe and the nearest BPM
 * win. Once every option has history, the least-recently played same-vibe
 * track leads. The UI can therefore stay honest and call this "Up next"
 * without claiming to be a personalized algorithm.
 */
export function nextTrackForRun(
  tracks: readonly CatalogTrack[],
  currentTrackId: string,
  tier: ChartTier,
  runs: readonly RunRecord[] = [],
): CatalogTrack | null {
  const currentIndex = tracks.findIndex((track) => track.track_id === currentTrackId);
  const current = tracks[currentIndex];
  if (!current) return null;

  const lastPlayed = new Map<string, number>();
  for (const run of runs) {
    const endedAt = Date.parse(run.endedAt);
    if (!Number.isFinite(endedAt)) continue;
    lastPlayed.set(run.track_id, Math.max(lastPlayed.get(run.track_id) ?? Number.NEGATIVE_INFINITY, endedAt));
  }

  const currentVibe = resolveTrackVibe(current);
  const candidates: RankedTrack[] = tracks.flatMap((track, index) => {
    if (track.track_id === currentTrackId || !track.charts[tier]) return [];
    const playedAt = lastPlayed.get(track.track_id);
    return [{
      track,
      unplayed: playedAt === undefined,
      sameVibe: resolveTrackVibe(track) === currentVibe,
      lastPlayedAt: playedAt ?? Number.NEGATIVE_INFINITY,
      bpmDistance: Math.abs(track.bpm - current.bpm),
      durationDistance: Math.abs(track.duration_sec - current.duration_sec),
      forwardDistance: (index - currentIndex + tracks.length) % tracks.length,
    }];
  });

  candidates.sort((a, b) =>
    Number(b.unplayed) - Number(a.unplayed) ||
    Number(b.sameVibe) - Number(a.sameVibe) ||
    a.lastPlayedAt - b.lastPlayedAt ||
    a.bpmDistance - b.bpmDistance ||
    a.durationDistance - b.durationDistance ||
    a.forwardDistance - b.forwardDistance ||
    a.track.track_id.localeCompare(b.track.track_id));

  return candidates[0]?.track ?? null;
}
