import { useEffect, useState } from "react";
import { Link, useParams } from "../router";
import { getMessages } from "../i18n";
import { assetUrl, getTrack } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import type { ChartTier, PlayMode } from "../types/chart";
import { toggleFavorite, loadFavorites } from "../storage/settings";
import { StreamFullCTA } from "../components/StreamFullCTA";
import { TrackAudioPreview } from "../components/TrackAudioPreview";
import { DistrictBadge } from "../components/DistrictBadge";
import { VibeBadge } from "../components/VibeBadge";
import { resolveTrackVibe } from "../catalog/trackVibe";
import { trackRequest } from "../catalog/trackRequests";
import { SCAPE_COPY, artistBio } from "../constants/scape";

export function TrackPage() {
  const { id } = useParams();
  const t = getMessages();
  const [track, setTrack] = useState<CatalogTrack | null>(null);
  const [tier, setTier] = useState<ChartTier>("standard");
  const [mode, setMode] = useState<PlayMode>("arcade");
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!id) return;
    void getTrack(id).then((t) => {
      setTrack(t ?? null);
      if (t) {
        setTier(t.default_tier);
        setMode(t.default_mode);
        setFav(loadFavorites().includes(t.track_id));
      }
    });
  }, [id]);

  if (!track) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" aria-hidden />
        <p>{SCAPE_COPY.weakNetwork}</p>
      </div>
    );
  }

  const bio = track.artist_bio ?? artistBio(track.artist);
  const request = trackRequest(track.track_id);

  return (
    <section className="track-detail">
      <Link to="/library" className="back-link">
        {t.ui.library}
      </Link>

      <div className="track-hero">
        <div className="track-hero-cover">
          <img
            src={assetUrl(track.cover)}
            alt=""
            width={512}
            height={512}
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <div className="track-hero-body">
          <div className="track-hero-badges">
            <VibeBadge vibe={resolveTrackVibe(track)} />
            <DistrictBadge district={track.district} />
          </div>
          <h1>{track.title}</h1>
          <p className="artist">{track.artist}</p>
          {bio && <p className="artist-bio">{bio}</p>}
          {request && (
            <p className="artist-bio radio-request">
              “{request}” — <strong>The Late Static</strong>
            </p>
          )}
          <p className="meta">
            {track.genre} · {track.bpm} BPM · {track.duration_sec}s clip
          </p>
          <p className="rights">{SCAPE_COPY.rights}</p>
          <TrackAudioPreview trackId={track.track_id} audioPath={track.preview ?? track.audio} title={track.title} />
          <StreamFullCTA track={track} />

          <div className="track-pickers">
            <label className="picker-pill">
              {t.ui.tier}
              <select value={tier} onChange={(e) => setTier(e.target.value as ChartTier)}>
                <option value="easy">Easy</option>
                <option value="standard">Standard</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label className="picker-pill">
              {t.ui.mode}
              <select value={mode} onChange={(e) => setMode(e.target.value as PlayMode)}>
                <option value="arcade">Arcade</option>
                <option value="casual">Casual</option>
                <option value="practice">Practice</option>
              </select>
            </label>
          </div>

          <div className="cta-row">
            <Link className="btn primary" to={`/play/${track.track_id}?tier=${tier}&mode=${mode}`}>
              {SCAPE_COPY.play}
            </Link>
            {/* DUO · 同屏分屏对战。键盘：P1 用存档键位、P2 用不冲突的另一套；
                触屏：两个 field 各自按 x 坐标分 lane，两人各摸自己那半边。 */}
            <Link className="btn ghost" to={`/duo/${track.track_id}?tier=${tier}&mode=${mode}`}>
              Duo
            </Link>
            <button
              type="button"
              className={`btn ${fav ? "primary" : "ghost"}`}
              onClick={() => setFav(toggleFavorite(track.track_id).includes(track.track_id))}
            >
              {fav ? t.ui.favorited : t.ui.favorite}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
