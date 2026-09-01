import { fmtTime } from "../lib/format";
import { gameTrackUrl, vibeMeta } from "../lib/catalog";
import { useFavorites } from "../lib/storage";
import { usePlayerActions, usePlayerState } from "../player/playerContext";
import {
  ChevronDownIcon,
  HeartIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
} from "./icons";

export function NowPlaying() {
  const st = usePlayerState();
  const actions = usePlayerActions();
  const { favorites, toggleFavorite } = useFavorites();
  if (!st.track || !st.expanded) return null;
  const t = st.track;
  const vm = vibeMeta(t.vibe);
  const fav = favorites.includes(t.track_id);

  return (
    <div className="np-overlay" role="dialog" aria-modal="true" aria-label="Now playing">
      <header className="np-top">
        <button
          className="icon-btn"
          onClick={() => actions.setExpanded(false)}
          aria-label="Close player"
        >
          <ChevronDownIcon />
        </button>
        <span className="np-context">{st.contextLabel || "Scape Music"}</span>
        <span className={`np-air ${st.playing ? "is-live" : ""}`}>
          {st.playing ? "ON AIR" : "PAUSED"}
        </span>
      </header>

      <div className="np-art">
        <img src={t.og} alt={`${t.title} — cover art`} />
      </div>

      <div className="np-info">
        <h2 className="np-title">{t.title}</h2>
        <p className="np-artist">{t.artist}</p>
        {t.quote && (
          <p className="np-quote">
            “{t.quote}” <span>— The Late Static</span>
          </p>
        )}
        <div className="np-chips">
          <span className="chip" style={{ borderColor: vm.color, color: vm.color }}>
            {vm.column}
          </span>
          <span className="chip">{t.district}</span>
          <span className="chip">{t.bpm} BPM</span>
          <span className="chip">{t.genre}</span>
        </div>
      </div>

      {st.error ? (
        <p className="np-error">Stream hiccup — this frequency dropped out. Try the next track.</p>
      ) : (
        <div className="np-seek">
          <span className="np-time">{fmtTime(st.pos)}</span>
          <input
            type="range"
            min={0}
            max={Math.floor(st.dur) || 0}
            value={Math.floor(st.pos)}
            onChange={(e) => actions.seekTo(Number(e.target.value))}
            aria-label="Seek"
            disabled={!st.dur}
          />
          <span className="np-time">{fmtTime(st.dur)}</span>
        </div>
      )}

      <div className="np-controls">
        <button
          className={`icon-btn ${st.shuffle ? "is-on" : ""}`}
          onClick={actions.toggleShuffle}
          aria-pressed={st.shuffle}
          aria-label="Shuffle"
        >
          <ShuffleIcon />
        </button>
        <button className="icon-btn" onClick={actions.prev} aria-label="Previous track">
          <PrevIcon />
        </button>
        <button
          className="np-play"
          onClick={actions.toggle}
          aria-label={st.playing ? "Pause" : "Play"}
        >
          {st.playing ? <PauseIcon size={26} /> : <PlayIcon size={26} />}
        </button>
        <button className="icon-btn" onClick={actions.next} aria-label="Next track">
          <NextIcon />
        </button>
        <button
          className={`icon-btn ${st.repeat !== "off" ? "is-on" : ""}`}
          onClick={actions.cycleRepeat}
          aria-label={`Repeat mode: ${st.repeat}`}
        >
          {st.repeat === "one" ? <RepeatOneIcon /> : <RepeatIcon />}
        </button>
      </div>

      <div className="np-side">
        <button
          className={`icon-btn ${fav ? "is-fav" : ""}`}
          onClick={() => toggleFavorite(t.track_id)}
          aria-pressed={fav}
          aria-label="Save track"
        >
          <HeartIcon filled={fav} />
        </button>
        <a className="np-game-link" href={gameTrackUrl(t.track_id)} target="_blank" rel="noreferrer">
          Play the chart in BeatScape ↗
        </a>
      </div>
    </div>
  );
}
