import { useEffect } from "react";
import { RADIO_EPISODES, RADIO_SEASONS, SEASON_PREMIERE_MS, type RadioLine } from "../data/radioEpisodes";
import { episodeAirLabel, episodeIndexAt, episodeState } from "../lib/radio";
import { trackEvent } from "../lib/analytics";
import { Link } from "../router";
import { RADIO_PAGE_META, usePageMeta } from "../seo/pageMeta";
import "../styles/radio-story.css";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/** Human air date for an episode slot ("Dec 18"). */
function airDate(week: number): string {
  return new Date(SEASON_PREMIERE_MS + week * WEEK_MS).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** C-1 · Retro receiver tuning. Each season is a channel on the dial; the
 *  currently-airing season is the tuned station. */
const DIAL_BASE = 88.6;
const DIAL_STEP = 1.4;
const numSeasons = RADIO_SEASONS.length;

function freqFor(season: number): string {
  return (DIAL_BASE + (season - 1) * DIAL_STEP).toFixed(1);
}

/** Position on the dial as a percentage (inset 8%..92% so edge channels stay on-screen). */
function tickPos(season: number): number {
  if (numSeasons <= 1) return 50;
  return 8 + ((season - 1) / (numSeasons - 1)) * 84;
}

function scrollToSeason(season: number): void {
  document.getElementById(`season-${season}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function RadioDialogue({ lines }: { lines: readonly RadioLine[] }) {
  return (
    <ol className="radio-dialogue" aria-label="Broadcast transcript" role="list">
      {lines.map((line, i) => (
        <li key={i} className="radio-dialogue-turn" data-speaker={line.speaker}>
          <span className="radio-speaker">{line.speaker}</span>
          <p className="radio-dialogue-text">{line.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function RadioPage() {
  usePageMeta(RADIO_PAGE_META);
  useEffect(() => {
    trackEvent("radio_view");
  }, []);
  const now = Date.now();
  const current = RADIO_EPISODES[episodeIndexAt(now)];
  const currentIndex = current ? RADIO_EPISODES.indexOf(current) : -1;
  const currentState = currentIndex >= 0 ? episodeState(currentIndex, now) : undefined;
  const currentSeason = RADIO_SEASONS.find((s) => s.number === current?.season);
  const tuned = currentSeason?.number ?? 1;

  // Signal strength of the tuned station (retro VU feel): full on air, dimmer for the archive.
  const signalLevel =
    currentState === "now" ? 5 : currentState === "aired" ? 3 : currentState === "upcoming" ? 2 : 0;

  return (
    <section className="radio-page">
      <header className="page-header">
        <p className="eyebrow">
          {currentSeason ? `Broadcast transcripts · Season ${currentSeason.number}` : "Broadcast transcripts"}
        </p>
        <h1>The Late Static</h1>
        <p className="tagline">
          In Scape City, music keeps the lights on. When a block falls silent, the Hush
          takes its sound memories. NIGHTSHIFT is a three-piece band keeping the signal alive.
        </p>
        <p className="radio-story-note">
          Read the crew’s broadcast logs, one new episode each week. Past episodes stay here;
          future episodes show a preview until their date arrives.
        </p>
        <div className="radio-shift-entry">
          <Link to="/shift" className="btn secondary">Play your first shift</Link>
          <p>Start with a playable opening: help repair three broadcast nodes. The weekly logs follow life in the city.</p>
        </div>
      </header>

      <div className="radio-deck" role="group" aria-label="Receiver">
        <div className="radio-deck-top">
          <div className="radio-readout">
            <span className="radio-readout-band">FM</span>
            <span className="radio-readout-freq">{freqFor(tuned)}</span>
            <span className="radio-readout-mhz">MHz</span>
            <span className="radio-readout-station">THE LATE STATIC</span>
          </div>
          <div className="radio-signal" aria-label={`Signal strength ${signalLevel} of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`radio-signal-bar${n <= signalLevel ? " on" : ""}`} />
            ))}
          </div>
        </div>

        <div className="radio-dial" aria-hidden="true">
          <div className="radio-dial-ticks">
            {RADIO_SEASONS.map((s) => (
              <span
                key={s.number}
                className={`radio-dial-tick${s.number === tuned ? " tuned" : ""}`}
                style={{ left: `${tickPos(s.number)}%` }}
              />
            ))}
          </div>
          <div className="radio-dial-needle" style={{ left: `${tickPos(tuned)}%` }} />
          <div className="radio-dial-labels">
            {RADIO_SEASONS.map((s) => (
              <span
                key={s.number}
                className={`radio-dial-label${s.number === tuned ? " tuned" : ""}`}
                style={{ left: `${tickPos(s.number)}%` }}
              >
                {freqFor(s.number)}
              </span>
            ))}
          </div>
        </div>

        <div className="radio-channels">
          {RADIO_SEASONS.map((s) => (
            <button
              key={s.number}
              type="button"
              className={`radio-channel${s.number === tuned ? " active" : ""}`}
              onClick={() => scrollToSeason(s.number)}
            >
              <span className="radio-channel-num">CH {s.number}</span>
              <span className="radio-channel-name">{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {RADIO_SEASONS.map((season) => {
        const episodes = RADIO_EPISODES.filter((e) => e.season === season.number);
        if (episodes.length === 0) return null;
        return (
          <section
            key={season.number}
            id={`season-${season.number}`}
            className="radio-season"
            aria-label={`Season ${season.number} — ${season.name}`}
          >
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
                        {state === "now" && <p className="radio-onair">This week’s transcript</p>}
                        <RadioDialogue lines={episode.lines} />
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
