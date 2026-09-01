import { useEffect } from "react";
import { RADIO_EPISODES, RADIO_SEASONS, SEASON_PREMIERE_MS } from "../data/radioEpisodes";
import { episodeAirLabel, episodeIndexAt, episodeState } from "../lib/radio";
import { trackEvent } from "../lib/analytics";
import { RADIO_PAGE_META, usePageMeta } from "../seo/pageMeta";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/** Human air date for an episode slot ("Dec 18"). */
function airDate(week: number): string {
  return new Date(SEASON_PREMIERE_MS + week * WEEK_MS).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function RadioPage() {
  usePageMeta(RADIO_PAGE_META);
  useEffect(() => {
    trackEvent("radio_view");
  }, []);
  const now = Date.now();
  const current = RADIO_EPISODES[episodeIndexAt(now)];
  const currentSeason = RADIO_SEASONS.find((s) => s.number === current?.season);

  return (
    <section className="radio-page">
      <header className="page-header">
        <p className="eyebrow">
          {currentSeason ? `Season ${currentSeason.number} · ${currentSeason.name}` : "Season radio"}
        </p>
        <h1>The Late Static</h1>
        <p className="tagline">
          One broadcast a week, from a rooftop nobody can find. Past episodes stay in the
          archive — future ones are just static until they air.
        </p>
      </header>

      {RADIO_SEASONS.map((season) => {
        const episodes = RADIO_EPISODES.filter((e) => e.season === season.number);
        if (episodes.length === 0) return null;
        return (
          <section key={season.number} className="radio-season" aria-label={`Season ${season.number} — ${season.name}`}>
            <h2 className="radio-season-title">{`Season ${season.number} · ${season.name}`}</h2>
            <div className="radio-episode-list">
              {episodes.map((episode) => {
                const index = RADIO_EPISODES.indexOf(episode);
                const state = episodeState(index, now);
                return (
                  <article key={episode.ep} id={`ep-${episode.ep}`} className={`radio-episode ${state}`}>
                    <div className="radio-episode-head">
                      <span className="radio-ep-num">EP {episode.ep}</span>
                      <h3>{episode.title}</h3>
                      <span className="radio-ep-air">{episodeAirLabel(episode)}</span>
                    </div>
                    {state === "upcoming" ? (
                      <p className="radio-teaser">
                        {episode.teaser}{" "}
                        <span className="radio-airdate">· airs {airDate(episode.week)}</span>
                      </p>
                    ) : (
                      <>
                        {state === "now" && <p className="radio-onair">On air now</p>}
                        {episode.lines.map((line, i) => (
                          <p key={i} className="radio-line">
                            {line}
                          </p>
                        ))}
                        <p className="radio-signoff">{episode.signoff}</p>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </section>
  );
}
