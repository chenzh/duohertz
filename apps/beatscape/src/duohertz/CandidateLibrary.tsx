import { useState } from "react";
import { DUOHERTZ_CANDIDATE_ENTRIES } from "./candidate";
import { DuohertzTrackGrid } from "./TrackGrid";
import { candidateTrackCards, DUOHERTZ_GENRES } from "./trackCards";
import "./hub.css";
import "./shell.css";

const GENRES = ["All sounds", ...DUOHERTZ_GENRES] as const;
const CARDS = candidateTrackCards(DUOHERTZ_CANDIDATE_ENTRIES);

/** Internal candidate library follows BeatScape's separate browse page. */
export function DuohertzCandidateLibrary() {
  const [genre, setGenre] = useState<(typeof GENRES)[number]>("All sounds");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(24);
  const search = query.trim().toLowerCase();
  const matches = CARDS.filter((track) => (genre === "All sounds" || track.genre === genre)
    && (!search || `${track.title} ${track.id}`.toLowerCase().includes(search)));
  return <section className="dh-hub dh-hub--library">
    <header className="dh-hub__section-title"><p>duohertz / ELECTRONIC SOUNDS</p><h1>Choose your beat</h1><span>{CARDS.length} technical candidates · 0 released</span></header>
    <div className="dh-hub__discovery"><label className="dh-hub__search"><span>Find a beat</span>
      <input type="search" value={query} maxLength={80} placeholder="Search title or track ID" onChange={(event) => { setQuery(event.target.value); setShown(24); }} />
    </label><p className="dh-hub__result-count" role="status">Showing {Math.min(shown, matches.length)} of {matches.length} matches</p></div>
    <div className="dh-hub__filters" role="group" aria-label="Filter music style">
      {GENRES.map((choice) => <button key={choice} type="button" aria-pressed={genre === choice}
        onClick={() => { setGenre(choice); setShown(24); }}>{choice}</button>)}
    </div>
    {matches.length === 0 ? <p className="dh-hub__empty">No tracks match. Try another title, track ID, or music style.</p>
      : <DuohertzTrackGrid tracks={matches.slice(0, shown)} />}
    {shown < matches.length && <div className="dh-hub__more"><button type="button" onClick={() => setShown((count) => count + 24)}>Show more tracks</button></div>}
    <p className="dh-hub__footer-note">All music and covers here are unreviewed candidates. This is not the released catalog.</p>
  </section>;
}
