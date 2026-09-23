import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useState } from "react";
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
 *  live season is identified separately from the channel the listener selects. */
const DIAL_BASE = 88.6;
const DIAL_STEP = 1.4;
const numSeasons = RADIO_SEASONS.length;
const COMPACT_EPISODE_QUERY = "(max-width: 680px)";

function freqFor(season: number): string {
  return (DIAL_BASE + (season - 1) * DIAL_STEP).toFixed(1);
}

/** Position on the dial as a percentage (inset 8%..92% so edge channels stay on-screen). */
function tickPos(season: number): number {
  if (numSeasons <= 1) return 50;
  return 8 + ((season - 1) / (numSeasons - 1)) * 84;
}

function scrollToSeason(season: number): void {
  // 跳转目标若是折叠的归档季，先展开再滚动。
  const el = document.getElementById(`season-${season}`);
  if (el instanceof HTMLDetailsElement) el.open = true;
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function linkedEpisodeNumber(): number | undefined {
  if (typeof window === "undefined") return undefined;
  const match = window.location.hash.match(/^#ep-(\d+)$/);
  if (!match) return undefined;
  const ep = Number(match[1]);
  return RADIO_EPISODES.some((episode) => episode.ep === ep) ? ep : undefined;
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
  const liveSeason = currentSeason?.number ?? 1;
  const [tuned, setTuned] = useState(liveSeason);
  const [compactEpisodes, setCompactEpisodes] = useState(
    () => typeof window !== "undefined" && window.matchMedia(COMPACT_EPISODE_QUERY).matches,
  );
  const [openEpisode, setOpenEpisode] = useState<number | null>(
    () => linkedEpisodeNumber() ?? current?.ep ?? null,
  );

  useEffect(() => {
    const media = window.matchMedia(COMPACT_EPISODE_QUERY);
    const syncLayout = () => setCompactEpisodes(media.matches);
    syncLayout();
    media.addEventListener("change", syncLayout);
    return () => media.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    const revealLinkedEpisode = () => {
      const ep = linkedEpisodeNumber();
      if (ep === undefined) return;
      const episode = RADIO_EPISODES.find((item) => item.ep === ep);
      if (!episode) return;
      const index = RADIO_EPISODES.indexOf(episode);
      if (compactEpisodes && episodeState(index, Date.now()) !== "upcoming") setOpenEpisode(ep);
      setTuned(episode.season);
      const season = document.getElementById(`season-${episode.season}`);
      if (season instanceof HTMLDetailsElement) season.open = true;
      requestAnimationFrame(() => document.getElementById(`ep-${ep}`)?.scrollIntoView({ block: "start" }));
    };
    revealLinkedEpisode();
    window.addEventListener("hashchange", revealLinkedEpisode);
    return () => window.removeEventListener("hashchange", revealLinkedEpisode);
  }, [compactEpisodes]);

  // Signal strength follows the selected channel: live is strongest, archive is stable,
  // and a future season only carries a faint preview signal.
  const signalLevel = tuned === liveSeason
    ? currentState === "now" ? 5 : currentState === "aired" ? 3 : currentState === "upcoming" ? 2 : 0
    : tuned < liveSeason ? 3 : 1;

  const tuneSeason = (season: number, focusChannel = false) => {
    setTuned(season);
    scrollToSeason(season);
    if (focusChannel) {
      requestAnimationFrame(() => document.getElementById(`radio-channel-${season}`)?.focus());
    }
  };

  const handleChannelKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % RADIO_SEASONS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + RADIO_SEASONS.length) % RADIO_SEASONS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = RADIO_SEASONS.length - 1;
    }
    if (nextIndex === null) return;

    event.preventDefault();
    tuneSeason(RADIO_SEASONS[nextIndex]!.number, true);
  };

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
          <div className="radio-signal" role="img" aria-label={`Signal strength ${signalLevel} of 5`}>
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

        <div className="radio-channels" role="radiogroup" aria-label="Receiver channels">
          {RADIO_SEASONS.map((s, index) => (
            <button
              key={s.number}
              id={`radio-channel-${s.number}`}
              type="button"
              className={`radio-channel${s.number === tuned ? " active" : ""}`}
              role="radio"
              aria-checked={s.number === tuned}
              tabIndex={s.number === tuned ? 0 : -1}
              onClick={() => tuneSeason(s.number)}
              onKeyDown={(event) => handleChannelKeyDown(event, index)}
            >
              <span className="radio-channel-num">CH {s.number}</span>
              <span className="radio-channel-name">{s.name}</span>
              {s.number === liveSeason && <span className="radio-channel-live">Live</span>}
            </button>
          ))}
        </div>
      </div>

      {RADIO_SEASONS.map((season) => {
        const episodes = RADIO_EPISODES.filter((e) => e.season === season.number);
        if (episodes.length === 0) return null;
        // 只默认展开正在播的这一季；旧季折叠归档，点季标题或拨盘频道展开。
        const isTuned = season.number === tuned;
        const isLive = season.number === liveSeason;
        return (
          <details
            key={season.number}
            id={`season-${season.number}`}
            className="radio-season"
            open={isTuned}
            aria-label={`Season ${season.number} — ${season.name}`}
            onToggle={(event) => {
              if (event.currentTarget.open) setTuned(season.number);
            }}
          >
            <summary className="radio-season-title">
              <span>{`Season ${season.number} · ${season.name}`}</span>
              <span className="radio-season-count">
                {episodes.length} eps{isLive ? " · on air" : ""}
              </span>
            </summary>
            <div className="radio-episode-list">
              {episodes.map((episode) => {
                const index = RADIO_EPISODES.indexOf(episode);
                const state = episodeState(index, now);
                const isExpandable = state !== "upcoming";
                const isExpanded = !compactEpisodes || openEpisode === episode.ep;
                const contentId = `ep-${episode.ep}-content`;
                return (
                  <article key={episode.ep} id={`ep-${episode.ep}`} className={`radio-episode ${state}`}>
                    {compactEpisodes && isExpandable ? (
                      <h3 className="radio-episode-toggle-heading">
                        <button
                          type="button"
                          className="radio-episode-head radio-episode-toggle"
                          aria-expanded={isExpanded}
                          aria-controls={contentId}
                          onClick={() => {
                            const nextEpisode = isExpanded ? null : episode.ep;
                            setOpenEpisode(nextEpisode);
                            const nextUrl = nextEpisode
                              ? `${window.location.pathname}${window.location.search}#ep-${nextEpisode}`
                              : `${window.location.pathname}${window.location.search}`;
                            window.history.replaceState(null, "", nextUrl);
                          }}
                        >
                          <span className="radio-ep-num">EP {episode.ep}</span>
                          <span className="radio-episode-title">{episode.title}</span>
                          <span className="radio-ep-air">{episodeAirLabel(episode)}</span>
                          <span className="radio-episode-toggle-mark" aria-hidden="true">{isExpanded ? "–" : "+"}</span>
                        </button>
                      </h3>
                    ) : (
                      <div className="radio-episode-head">
                        <span className="radio-ep-num">EP {episode.ep}</span>
                        <h3>{episode.title}</h3>
                        <span className="radio-ep-air">{episodeAirLabel(episode)}</span>
                      </div>
                    )}
                    {state === "upcoming" ? (
                      <p className="radio-teaser">
                        {episode.teaser}{" "}
                        <span className="radio-airdate">· airs {airDate(episode.week)}</span>
                      </p>
                    ) : (
                      <div id={contentId} className="radio-episode-content" hidden={!isExpanded}>
                        {state === "now" && <p className="radio-onair">This week’s transcript</p>}
                        <RadioDialogue lines={episode.lines} />
                        <p className="radio-signoff">{episode.signoff}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </details>
        );
      })}
    </section>
  );
}
