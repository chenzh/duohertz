import { Link } from "../router";
import { assetUrl } from "../catalog/loadCatalog";
import type { CatalogTrack } from "../types/catalog";
import type { CuratedPick } from "../data/curated";
import { playHref } from "../lib/playHref";
import { AudioBar } from "./AudioBar";
import { trackEvent } from "../lib/analytics";

/**
 * 曲库上层：一个很小的推荐区。
 *
 * 这是人排的歌单（见 data/curated.ts），不是"智能推荐"：每首都写清
 * "为什么从这首开始"，理由只讲曲目/谱面里真实存在的东西。试听也从最能代表
 * 这首的那一段开始，而不是歌曲开头的铺垫。
 */
export function CuratedPickCard({ track, pick }: { track: CatalogTrack; pick: CuratedPick }) {
  const preview = track.preview ?? track.audio;
  return (
    <article className="curated-card">
      <img
        className="curated-cover"
        src={assetUrl(track.cover)}
        alt=""
        loading="lazy"
        decoding="async"
        width={256}
        height={256}
      />
      <div className="curated-body">
        <h3>{track.title}</h3>
        <p className="curated-meta">
          {track.artist} · {pick.tier} · {Math.round(track.duration_sec)}s · {track.bpm} BPM
        </p>
        <p className="curated-why">{pick.why}</p>
        <p className="curated-line">
          <strong>{pick.line.speaker}</strong> {pick.line.text}
        </p>
        <div className="curated-actions">
          <Link
            className="btn primary"
            to={playHref(track.track_id, pick.tier, pick.mode)}
            aria-label={`Play ${track.title}`}
            onClick={() => trackEvent("curated_play", { track: track.track_id })}
          >
            Play now
          </Link>
          <Link className="btn ghost" to={`/track/${track.track_id}`}>
            Details
          </Link>
        </div>
        <AudioBar
          className="curated-preview"
          preload="none"
          src={assetUrl(preview)}
          label={`Preview ${track.title}`}
          startSec={pick.previewStart}
          segmentSec={pick.previewSeconds}
        />
      </div>
    </article>
  );
}

export function CuratedRow({
  title,
  subtitle,
  picks,
  tracks,
  className,
  showAllLink = true,
}: {
  title: string;
  subtitle: string;
  picks: readonly CuratedPick[];
  tracks: CatalogTrack[];
  className?: string;
  showAllLink?: boolean;
}) {
  const found = picks
    .map((pick) => ({ pick, track: tracks.find((t) => t.track_id === pick.trackId) }))
    .filter((x): x is { pick: CuratedPick; track: CatalogTrack } => Boolean(x.track));
  if (!found.length) return null;
  return (
    <section className={`curated-section${className ? ` ${className}` : ""}`} aria-label={title}>
      <div className="section-head">
        <h2>{title}</h2>
        {showAllLink && (
          <Link to="/library" className="section-link">
            All tracks
          </Link>
        )}
      </div>
      <p className="curated-subtitle">{subtitle}</p>
      <div className="curated-grid">
        {found.map(({ pick, track }) => (
          <CuratedPickCard key={track.track_id} track={track} pick={pick} />
        ))}
      </div>
    </section>
  );
}
