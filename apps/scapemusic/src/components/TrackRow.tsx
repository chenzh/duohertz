import { fmtTime } from "../lib/format";
import type { Track } from "../lib/catalog";
import { useFavorites } from "../lib/storage";
import { usePlayerActions, usePlayerState } from "../player/playerContext";
import { navigate, trackHref } from "../router";
import { HeartIcon, InfoIcon } from "./icons";

interface TrackRowProps {
  track: Track;
  /** ids of the queue this row belongs to (row click plays into it). */
  queueIds: string[];
  index: number;
  label: string;
}

export function TrackRow({ track, queueIds, index, label }: TrackRowProps) {
  const actions = usePlayerActions();
  const st = usePlayerState();
  const { favorites, toggleFavorite } = useFavorites();
  const isCurrent = st.track?.track_id === track.track_id;
  const fav = favorites.includes(track.track_id);

  return (
    <div className={`trackrow ${isCurrent ? "is-current" : ""}`}>
      <button
        className="trackrow-main"
        onClick={() => (isCurrent ? actions.toggle() : actions.playContext(queueIds, index, label))}
      >
        <img src={track.cover} alt="" className="row-cover" loading="lazy" />
        <span className="row-meta">
          <span className="row-title">{track.title}</span>
          <span className="row-artist">
            {track.artist} · {track.district}
          </span>
        </span>
        <span className="row-duration">{fmtTime(track.stream_duration_sec)}</span>
      </button>
      <button
        className={`icon-btn row-heart ${fav ? "is-fav" : ""}`}
        onClick={() => toggleFavorite(track.track_id)}
        aria-pressed={fav}
        aria-label={fav ? "Remove from saved" : "Save track"}
      >
        <HeartIcon filled={fav} size={16} />
      </button>
      <button
        className="icon-btn row-open"
        onClick={() => navigate(trackHref(track.track_id))}
        aria-label={`Track page for ${track.title}`}
      >
        <InfoIcon size={16} />
      </button>
    </div>
  );
}
