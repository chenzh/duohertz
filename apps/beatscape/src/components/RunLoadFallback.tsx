import { Link } from "../router";

type Props = {
  missing: boolean;
  trackHref: string;
  libraryHref: string;
  onRetry: () => void;
};

/** Shared, player-facing recovery for a run that could not finish loading. */
export function RunLoadFallback({ missing, trackHref, libraryHref, onRetry }: Props) {
  return (
    <section className="track-load-fallback run-load-fallback" role="alert">
      <span className="track-load-mark" aria-hidden>◇</span>
      <p className="eyebrow">The Late Static</p>
      <h1>{missing ? "Track not found" : "Run could not load"}</h1>
      <p className="tagline">
        {missing
          ? "This track is no longer in the current set."
          : "Check your connection, then try again. Your selected track, difficulty, and mode are still here."}
      </p>
      <div className="cta-row">
        {!missing && (
          <button type="button" className="btn primary" onClick={onRetry}>
            Try again
          </button>
        )}
        <Link className={missing ? "btn primary" : "btn"} to={missing ? libraryHref : trackHref}>
          {missing ? "Browse Library" : "Back to track"}
        </Link>
      </div>
    </section>
  );
}
