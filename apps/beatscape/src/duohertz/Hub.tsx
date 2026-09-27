import { Link } from "../router";
import { DUOHERTZ_CANDIDATE_ENTRIES } from "./candidate";
import { DUOHERTZ_CHARACTER_CONCEPTS } from "./characters";
import { DuohertzHomeHero } from "./HomeHero";
import { DuohertzTrackGrid } from "./TrackGrid";
import { candidateTrackCards } from "./trackCards";
import "./hub.css";
import "./home-layout.css";
import "./shell.css";

const CANDIDATE_CARDS = candidateTrackCards(DUOHERTZ_CANDIDATE_ENTRIES);

export function DuohertzHubPage() {
  return <div className="dh-hub">
    <DuohertzHomeHero playHref={CANDIDATE_CARDS[0]?.href ?? "/lab/duohertz"}
      libraryHref="/lab/duohertz/library" preview artUrl={DUOHERTZ_CHARACTER_CONCEPTS[1].art}
      artAlt="Unreviewed concept portrait of NIVAREO with an echo tuner" />
    <section className="dh-hub__catalog dh-hub__catalog--featured" id="dh-home-start" aria-labelledby="dh-hub-catalog-heading">
      <div className="dh-hub__section-title">
        <p>01 / START HERE</p>
        <h2 id="dh-hub-catalog-heading">Your first three beats</h2>
        <span>One key first · try a second when ready</span>
      </div>
      <DuohertzTrackGrid tracks={CANDIDATE_CARDS.slice(0, 3)} />
      <Link to="/lab/duohertz/library" className="dh-hub__section-cta">Browse all {CANDIDATE_CARDS.length} candidates ↗</Link>
    </section>
    <section className="dh-hub__radio-banner" aria-label="Music station">
      <div><p>ON AIR / DUOHERTZ</p><h2>Keep the frequency going</h2><span>Listen through the electronic catalog, then jump into a beat.</span></div>
      <Link to="/lab/duohertz/radio">Open music station ↗</Link>
    </section>
    <section className="dh-hub__people" aria-labelledby="dh-hub-people-heading">
      <div className="dh-hub__section-title">
        <p>02 / THE SOUNDFIELD</p>
        <h2 id="dh-hub-people-heading">Meet the frequencies</h2>
        <span>Character concepts · names and art awaiting review</span>
      </div>
      <div className="dh-hub__people-grid">
        {DUOHERTZ_CHARACTER_CONCEPTS.map((character) => <article key={character.name}>
          <div className="dh-hub__people-art"><img src={character.art} alt={character.alt} loading="lazy" width="180" height="260" /></div>
          <div className="dh-hub__people-copy"><h3>{character.name}</h3><p>{character.title}</p><small>{character.identity}</small></div>
        </article>)}
      </div>
      <Link to="/lab/duohertz/characters" className="dh-hub__section-cta">Meet all three characters ↗</Link>
    </section>
    <section className="dh-hub__catalog" aria-labelledby="dh-hub-explore-heading">
      <div className="dh-hub__section-title"><p>03 / EXPLORE</p><h2 id="dh-hub-explore-heading">More to discover</h2><span>{CANDIDATE_CARDS.length} technical candidates · 0 released</span></div>
      <DuohertzTrackGrid tracks={CANDIDATE_CARDS.slice(3, 9)} />
      <Link to="/lab/duohertz/library" className="dh-hub__section-cta">Explore the full library ↗</Link>
    </section>
    <p className="dh-hub__footer-note">These staged prototypes are pending human listening, rights, art and release review.</p>
  </div>;
}
