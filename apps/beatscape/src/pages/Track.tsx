import { useEffect, useState } from "react";
import { Link, useParams } from "../router";
import { assetUrl, getTrack } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import type { ChartTier, PlayMode } from "../types/chart";
import { toggleFavorite, loadFavorites } from "../storage/settings";

const BEGINNER_TAG = "Beginner Pick";

function confirmAdvanced(tier: ChartTier, mode: PlayMode): boolean {
  if (tier === "hard") {
    return window.confirm(
      "Hard charts are dense and fast. Try Casual Easy first — still want Hard?",
    );
  }
  if (mode === "arcade") {
    return window.confirm(
      "Arcade uses tight timing (15ms Perfect) and HP. Casual Easy is recommended for your first runs.",
    );
  }
  return true;
}

export function TrackPage() {
  const { id } = useParams();
  const [track, setTrack] = useState<CatalogTrack | null>(null);
  const [tier, setTier] = useState<ChartTier>("easy");
  const [mode, setMode] = useState<PlayMode>("casual");
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  if (!track) return <p>Loading…</p>;

  const isBeginner = track.tags.includes(BEGINNER_TAG);
  const playHref = `/play/${track.track_id}?tier=${tier}&mode=${mode}`;
  const practiceHref = `/play/${track.track_id}?tier=${tier}&mode=practice`;

  const pickTier = (next: ChartTier) => {
    if (next === tier) return;
    if (!confirmAdvanced(next, mode)) return;
    setTier(next);
  };

  const pickMode = (next: PlayMode) => {
    if (next === mode) return;
    if (!confirmAdvanced(tier, next)) return;
    setMode(next);
  };

  return (
    <section className="track-detail">
      <img className="cover-lg" src={assetUrl(track.cover)} alt="" />
      <div>
        <h1>{track.title}</h1>
        <p className="artist">{track.artist}</p>
        <p className="meta">
          {track.genre} · {track.bpm} BPM · {track.district}
        </p>
        {isBeginner && <p className="badge beginner">Recommended for beginners · Casual Easy</p>}
        <p className="rights">AI Original · Owned Rights</p>
        <div className="pickers">
          <label>
            Tier
            <select value={tier} onChange={(e) => pickTier(e.target.value as ChartTier)}>
              <option value="easy">Easy</option>
              {showAdvanced && <option value="standard">Standard</option>}
              {showAdvanced && <option value="hard">Hard</option>}
            </select>
          </label>
          <label>
            Mode
            <select value={mode} onChange={(e) => pickMode(e.target.value as PlayMode)}>
              <option value="casual">Casual</option>
              {showAdvanced && <option value="arcade">Arcade</option>}
            </select>
          </label>
        </div>
        <button type="button" className="btn linkish advanced-toggle" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? "Hide Standard / Hard / Arcade" : "Show Standard, Hard & Arcade"}
        </button>
        <div className="cta-row">
          <Link className="btn primary" to={playHref}>
            Play {tier} · {mode}
          </Link>
          <Link className="btn practice-btn" to={practiceHref}>
            Practice — slow on 3 misses
          </Link>
          <button
            type="button"
            className="btn"
            onClick={() => setFav(toggleFavorite(track.track_id).includes(track.track_id))}
          >
            {fav ? "★ Favorited" : "☆ Favorite"}
          </button>
        </div>
      </div>
    </section>
  );
}
