import { useState } from "react";
import { DUOHERTZ_CHARACTER_CONCEPTS } from "./characters";
import rhyvoriComicArt from "../../candidates/duohertz/style-studies/rhyvori-editorial/front.png?url";
import nivareoComicArt from "../../candidates/duohertz/style-studies/nivareo-editorial/front.png?url";
import zorymelaComicArt from "../../candidates/duohertz/style-studies/zorymela-editorial/front.png?url";
import "./approved-characters.css";
import "./shell.css";

const COMIC_ART = { RHYVORI: rhyvoriComicArt, NIVAREO: nivareoComicArt, ZORYMELA: zorymelaComicArt };

function CandidateCharacterCard({ character, index }: { character: (typeof DUOHERTZ_CHARACTER_CONCEPTS)[number]; index: number }) {
  const [side, setSide] = useState(false);
  const [comic, setComic] = useState(true);
  return <article className="dh-characters__card">
    <div className="dh-characters__portrait"><span className="dh-characters__number">0{index + 1} / 03</span>
      <img src={side ? character.sideArt : comic ? COMIC_ART[character.name] : character.art}
        alt={side ? character.sideAlt : comic ? `Comic study of ${character.name}` : character.alt} loading="lazy" />
      <div className="dh-characters__view" role="group" aria-label={`${character.name} view`}>
        <button type="button" aria-pressed={!side && comic} onClick={() => { setSide(false); setComic(true); }}>Comic</button>
        <button type="button" aria-pressed={!side && !comic} onClick={() => { setSide(false); setComic(false); }}>Concept</button>
        <button type="button" aria-pressed={side} onClick={() => setSide(true)}>Side</button>
      </div>
    </div>
    <div className="dh-characters__copy"><p className="dh-characters__role">{character.role} <span>· {character.region}</span></p>
      <h2>{character.name}</h2><p className="dh-characters__title">{character.title}</p>
      <p className="dh-characters__identity">{character.identity}</p><blockquote>“{character.quote}”</blockquote>
      <h3>Meet {character.name}</h3><p className="dh-characters__story">{character.story}</p>
    </div>
  </article>;
}

/** Review-only character page; no production character signoff is implied. */
export function DuohertzCandidateCharacters() {
  return <div className="dh-characters">
    <header className="dh-characters__header"><p>THE SOUNDFIELD / THREE FREQUENCIES · CONCEPT PREVIEW</p>
      <h1>Meet the voices <span>behind the beat.</span></h1>
      <p>Three unreviewed character concepts. Names, stories and art are pending human review.</p>
    </header>
    <div className="dh-characters__list">{DUOHERTZ_CHARACTER_CONCEPTS.map((character, index) =>
      <CandidateCharacterCard key={character.name} character={character} index={index} />)}</div>
  </div>;
}
