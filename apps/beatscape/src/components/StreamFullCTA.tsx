import type { CatalogTrack } from "../types/catalog";
import {
  formatStreamDuration,
  hasStreamAsset,
  resolveStreamAppUrl,
} from "../lib/streamLink";

type Props = {
  track: CatalogTrack;
  variant?: "card" | "inline";
};

export function StreamFullCTA({ track, variant = "card" }: Props) {
  const url = resolveStreamAppUrl(track);
  const durationLabel = formatStreamDuration(track.stream_duration_sec);
  const show = hasStreamAsset(track) || durationLabel;

  if (!show) return null;

  const title = track.title;
  const body = durationLabel
    ? `Hear the full track (${durationLabel}) on MusicSaas — not the ${track.duration_sec}s game clip.`
    : `Hear the full version of “${title}” on MusicSaas.`;

  if (variant === "inline") {
    return (
      <p className="stream-cta-inline">
        {body}
        {url ? (
          <a className="stream-cta-link" href={url} target="_blank" rel="noopener noreferrer">
            Open in MusicSaas
          </a>
        ) : (
          <span className="stream-cta-soon">App link coming soon</span>
        )}
      </p>
    );
  }

  return (
    <div className="stream-cta">
      <div className="stream-cta-icon" aria-hidden>♫</div>
      <div className="stream-cta-body">
        <strong>Full track on MusicSaas</strong>
        <p>{body}</p>
      </div>
      {url ? (
        <a className="btn primary stream-cta-btn" href={url} target="_blank" rel="noopener noreferrer">
          {durationLabel ? `Play full · ${durationLabel}` : "Open in MusicSaas"}
        </a>
      ) : (
        <span className="stream-cta-soon badge">Coming soon</span>
      )}
    </div>
  );
}
