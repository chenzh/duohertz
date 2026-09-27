import { Link } from "../router";
import type { DuohertzTrackCard } from "./trackCards";

/** Shared visual grid for candidate preview and the approved v2 library. */
export function DuohertzTrackGrid({ tracks }: { tracks: readonly DuohertzTrackCard[] }) {
  return <div className="dh-grid">
    {tracks.map((track, index) => <article key={track.id} className="dh-track">
      <div className="dh-track__art">
        <img className="dh-track__cover" src={track.coverUrl} alt={track.coverAlt} loading="lazy"
          onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
        <span className={`dh-track__diff dh-track__diff--${track.difficulty.toLowerCase()}`}>{track.difficulty}</span>
        <span className="dh-track__index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="dh-track__body">
        <span className="dh-track__genre">{track.genre}</span>
        <h3 className="dh-track__title">{track.title}</h3>
        <p className="dh-track__meta">{Math.round(track.bpm)} BPM · {Math.round(track.durationMs / 1000)}s</p>
        <div className="dh-track__actions">
          <Link to={track.href} className="dh-track__play" aria-label={`Try ${track.title} in the rhythm game`}>{track.actionLabel} <span aria-hidden="true">↗</span></Link>
          {track.radioHref && <Link to={track.radioHref} className="dh-track__listen" aria-label={`Listen to ${track.title} in the music station`}>Listen <span aria-hidden="true">↗</span></Link>}
        </div>
      </div>
    </article>)}
  </div>;
}
