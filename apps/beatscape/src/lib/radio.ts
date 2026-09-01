import { RADIO_EPISODES, SEASON_PREMIERE_MS } from "../data/radioEpisodes";

/** One episode airs per week (World Bible §8 Radio Episode cadence). */
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Index of the episode currently on air, clamped to the program range. */
export function episodeIndexAt(now: number): number {
  const week = Math.floor((now - SEASON_PREMIERE_MS) / WEEK_MS);
  if (week < 0) return 0;
  let current = 0;
  for (let i = 0; i < RADIO_EPISODES.length; i++) {
    if (RADIO_EPISODES[i].week <= week) current = i;
    else break;
  }
  return current;
}

export type EpisodeState = "aired" | "now" | "upcoming";

export function episodeState(index: number, now: number): EpisodeState {
  const current = episodeIndexAt(now);
  if (index < current) return "aired";
  if (index === current) return "now";
  return "upcoming";
}

/** 1-based week label within the episode's own season, e.g. "Week 3" / "S2 · Week 1". */
export function episodeAirLabel(episode: { season: number; week: number }): string {
  const seasonWeeks = RADIO_EPISODES.filter((e) => e.season === episode.season).map((e) => e.week);
  const seasonStart = Math.min(...seasonWeeks);
  const within = episode.week - seasonStart + 1;
  return episode.season === 1 ? `Week ${within}` : `S${episode.season} · Week ${within}`;
}
