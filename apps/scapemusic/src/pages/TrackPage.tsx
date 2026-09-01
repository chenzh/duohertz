import { useEffect, useMemo } from "react";
import { gameTrackUrl, TRACKS, trackById, vibeMeta, type Track } from "../lib/catalog";
import { fmtTime } from "../lib/format";
import { useFavorites } from "../lib/storage";
import { usePlayerActions, usePlayerState } from "../player/playerContext";
import { HeartIcon, PauseIcon, PlayIcon } from "../components/icons";
import { TrackRow } from "../components/TrackRow";

const BASE_TITLE = "Scape Music — BeatScape Originals · Full Length";

export function TrackPage({ id }: { id: string }) {
  const actions = usePlayerActions();
  const st = usePlayerState();
  const { favorites, toggleFavorite } = useFavorites();

  const t = trackById(id);
  const similar = useMemo(() => {
    if (!t) return [];
    return TRACKS.filter((x) => x.vibe === t.vibe && x.track_id !== t.track_id)
      .slice(0, 6)
      .map((x) => x.track_id);
  }, [t]);
  const similarTracks = useMemo(
    () => similar.map((tid) => trackById(tid)).filter((x): x is Track => Boolean(x)),
    [similar],
  );

  useEffect(() => {
    if (t) document.title = `${t.title} — ${t.artist} · Scape Music`;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [t]);

  if (!t) {
    return (
      <div className="page">
        <h1 className="page-title">Off air</h1>
        <p className="empty">That track ID isn't on the board.</p>
      </div>
    );
  }

  const vm = vibeMeta(t.vibe);
  const fav = favorites.includes(t.track_id);
  const isCurrent = st.track?.track_id === t.track_id;

  return (
    <div className="page trackpage">
      <div className="tp-hero">
        <img className="tp-art" src={t.og} alt={`${t.title} — cover art`} />
        <div className="tp-info">
          <span className="feed-tag" style={{ color: vm.color, borderColor: vm.color }}>
            {vm.column}
          </span>
          <h1 className="tp-title">{t.title}</h1>
          <p className="tp-artist">{t.artist}</p>
          <p className="count">
            {t.genre} · {t.bpm} BPM · {t.district} · {fmtTime(t.stream_duration_sec)} full length
          </p>
          {t.quote && (
            <blockquote className="tp-quote">
              “{t.quote}”
              <footer>— The Late Static</footer>
            </blockquote>
          )}
          <div className="pl-actions">
            <button
              className="primary-btn"
              onClick={() =>
                isCurrent ? actions.toggle() : actions.playContext(similar.length > 0 ? [t.track_id, ...similar] : [t.track_id], 0, "Track")
              }
            >
              {isCurrent && st.playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
              {isCurrent && st.playing ? "Pause" : "Play full track"}
            </button>
            <button
              className={`ghost-btn ${fav ? "is-fav" : ""}`}
              onClick={() => toggleFavorite(t.track_id)}
              aria-pressed={fav}
            >
              <HeartIcon filled={fav} size={16} /> {fav ? "Saved" : "Save"}
            </button>
            <a className="ghost-btn" href={gameTrackUrl(t.track_id)} target="_blank" rel="noreferrer">
              Play the chart in BeatScape ↗
            </a>
          </div>
        </div>
      </div>

      {similarTracks.length > 0 && (
        <section className="tp-more">
          <h2 className="section-title">More from {vm.column}</h2>
          <div className="tracklist">
            {similarTracks.map((x, i) => (
              <TrackRow
                key={x.track_id}
                track={x}
                queueIds={similar}
                index={i}
                label={vm.column}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
