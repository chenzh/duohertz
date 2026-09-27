import { Link } from "../router";

/** Preserve old song/share URLs without pretending that a new song is its replacement. */
export function DuohertzLegacyTrackTransition({ homeHref, libraryHref }: {
  homeHref: string;
  libraryHref: string;
}) {
  return <section className="dh-v2-legacy" aria-labelledby="dh-v2-legacy-title">
    <p className="dh-v2-legacy__eyebrow">OLD LINK / NEW SOUND</p>
    <h1 id="dh-v2-legacy-title">This song belongs to the previous game.</h1>
    <p>duohertz has a new electronic music library. This old song has no direct replacement, and earlier scores do not carry over.</p>
    <div className="dh-v2-legacy__actions">
      <Link to={libraryHref} className="dh-v2-legacy__primary">Explore the new music library <span aria-hidden="true">↗</span></Link>
      <Link to={homeHref}>Back to duohertz home</Link>
    </div>
  </section>;
}
