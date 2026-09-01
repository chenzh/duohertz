import { useMemo } from "react";
import { trackById, type Track } from "../lib/catalog";
import { fmtTotalDuration } from "../lib/format";
import { playlistById } from "../lib/playlists";
import { usePlayerActions } from "../player/playerContext";
import { navigate } from "../router";
import { PlayIcon, ShuffleIcon } from "../components/icons";
import { TrackRow } from "../components/TrackRow";

export function PlaylistDetail({ id }: { id: string }) {
  const actions = usePlayerActions();
  const pl = useMemo(() => playlistById(id), [id]);

  const tracks = useMemo(() => {
    if (!pl) return [];
    return pl.trackIds
      .map((tid) => trackById(tid))
      .filter((t): t is Track => Boolean(t));
  }, [pl]);

  if (!pl) {
    return (
      <div className="page">
        <h1 className="page-title">Off air</h1>
        <p className="empty">
          That column isn't on the board.{" "}
          <button className="ghost-btn" onClick={() => navigate("#/playlists")}>
            Back to Shows
          </button>
        </p>
      </div>
    );
  }

  const totalSec = tracks.reduce((s, t) => s + t.stream_duration_sec, 0);
  const ids = tracks.map((t) => t.track_id);

  return (
    <div className="page">
      <header className="pl-head" style={pl.color ? { borderLeftColor: pl.color } : undefined}>
        <span className="pl-kind">{pl.kind}</span>
        <h1 className="page-title">{pl.name}</h1>
        <p className="page-sub">{pl.blurb}</p>
        <p className="count">
          {tracks.length} tracks · {fmtTotalDuration(totalSec)}
        </p>
        <div className="pl-actions">
          <button
            className="primary-btn"
            onClick={() => actions.playContext(ids, 0, pl.name)}
            disabled={tracks.length === 0}
          >
            <PlayIcon size={16} /> Play all
          </button>
          <button
            className="ghost-btn"
            onClick={() => {
              actions.setShuffle(true);
              actions.playContext(ids, 0, pl.name);
            }}
            disabled={tracks.length === 0}
          >
            <ShuffleIcon size={16} /> Shuffle
          </button>
        </div>
      </header>

      <div className="tracklist">
        {tracks.map((t, i) => (
          <TrackRow key={t.track_id} track={t} queueIds={ids} index={i} label={pl.name} />
        ))}
      </div>
    </div>
  );
}
