import { useMemo } from "react";
import { trackById, type Track } from "../lib/catalog";
import { useFavorites, useRecent } from "../lib/storage";
import { usePlayerActions } from "../player/playerContext";
import { navigate } from "../router";
import { PlayIcon } from "../components/icons";
import { TrackRow } from "../components/TrackRow";

function toTracks(ids: string[]): Track[] {
  return ids
    .map((id) => trackById(id))
    .filter((t): t is Track => Boolean(t));
}

export function Favorites() {
  const actions = usePlayerActions();
  const favIds = useFavorites().favorites;
  const recentIds = useRecent();

  const favTracks = useMemo(() => toTracks(favIds), [favIds]);
  const recentTracks = useMemo(() => toTracks(recentIds), [recentIds]);
  const favIdsForQueue = useMemo(() => favTracks.map((t) => t.track_id), [favTracks]);

  return (
    <div className="page">
      <h1 className="page-title">Saved</h1>
      <p className="page-sub">Your block's frequencies, kept loud.</p>

      {favTracks.length > 0 ? (
        <>
          <div className="pl-actions">
            <button className="primary-btn" onClick={() => actions.playContext(favIdsForQueue, 0, "Saved")}>
              <PlayIcon size={16} /> Play saved
            </button>
          </div>
          <div className="tracklist">
            {favTracks.map((t, i) => (
              <TrackRow key={t.track_id} track={t} queueIds={favIdsForQueue} index={i} label="Saved" />
            ))}
          </div>
        </>
      ) : (
        <p className="empty">
          Nothing saved yet — the city's still quiet on your block.{" "}
          <button className="ghost-btn" onClick={() => navigate("#/library")}>
            Open the Library
          </button>
        </p>
      )}

      {recentTracks.length > 0 && (
        <section className="tp-more">
          <h2 className="section-title">Recently played</h2>
          <div className="tracklist">
            {recentTracks.slice(0, 12).map((t, i) => (
              <TrackRow
                key={t.track_id}
                track={t}
                queueIds={recentIds}
                index={i}
                label="Recently played"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
