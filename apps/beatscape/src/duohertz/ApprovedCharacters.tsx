import { useEffect, useState } from "react";
import { appHref, normalizeAppBase } from "../lib/appBase";
import { clearApprovedDuohertzCatalogCache, loadApprovedDuohertzCatalog } from "./catalog";
import { loadApprovedDuohertzCharacters, type DuohertzApprovedCharacter } from "./characterCatalog";
import "./approved-characters.css";

type CharacterState = { kind: "loading" } | { kind: "error" }
  | { kind: "ready"; characters: DuohertzApprovedCharacter[] };

function CharacterCard({ character, index }: { character: DuohertzApprovedCharacter; index: number }) {
  const [side, setSide] = useState(false);
  const base = normalizeAppBase(import.meta.env.BASE_URL);
  return <article className="dh-characters__card">
    <div className="dh-characters__portrait">
      <span className="dh-characters__number" aria-hidden="true">0{index + 1} / 03</span>
      <img src={appHref(side ? character.side_art : character.art, base)}
        alt={side ? character.side_alt : character.alt} loading="lazy"
        onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
      <div className="dh-characters__view" role="group" aria-label={`${character.name} view`}>
        <button type="button" aria-pressed={!side} onClick={() => setSide(false)}>Front</button>
        <button type="button" aria-pressed={side} onClick={() => setSide(true)}>Side</button>
      </div>
    </div>
    <div className="dh-characters__copy">
      <p className="dh-characters__role">{character.role} <span>· {character.region}</span></p>
      <h2>{character.name}</h2>
      <p className="dh-characters__title">{character.title}</p>
      <p className="dh-characters__identity">{character.identity}</p>
      <dl>
        <div><dt>Height</dt><dd>{character.height}</dd></div>
        <div><dt>Traits</dt><dd>{character.traits}</dd></div>
      </dl>
      <blockquote>“{character.quote}”</blockquote>
      <h3>Meet {character.name}</h3>
      <p className="dh-characters__story dh-characters__story--desktop">{character.story}</p>
      <details className="dh-characters__story-details">
        <summary>Read {character.name}'s story</summary>
        <p className="dh-characters__story">{character.story}</p>
      </details>
    </div>
  </article>;
}

/** The real route stays closed until both the music catalog and separate character signoff exist. */
export function DuohertzApprovedCharacters({ catalogUrl, charactersUrl }: {
  catalogUrl: string;
  charactersUrl: string;
}) {
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<CharacterState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    void loadApprovedDuohertzCatalog(catalogUrl)
      .then(() => loadApprovedDuohertzCharacters(charactersUrl))
      .then((catalog) => { if (!cancelled) setState({ kind: "ready", characters: catalog.characters }); })
      .catch(() => { if (!cancelled) setState({ kind: "error" }); });
    return () => { cancelled = true; };
  }, [catalogUrl, charactersUrl, retry]);

  if (state.kind === "loading") return <p className="dh-status" role="status">Loading duohertz characters…</p>;
  if (state.kind === "error") return <section className="dh-error" role="alert">
    <h1>The duohertz characters are not available yet.</h1>
    <p>The approved music and character catalogs could not both be loaded.</p>
    <button type="button" onClick={() => {
      clearApprovedDuohertzCatalogCache(catalogUrl);
      setRetry((current) => current + 1);
    }}>Try again</button>
  </section>;

  return <div className="dh-characters">
    <header className="dh-characters__header">
      <p className="dh-eyebrow">THE SOUNDFIELD / THREE FREQUENCIES</p>
      <h1>Meet the voices <span>behind the beat.</span></h1>
      <p>One pulse starts the music. A reply gives it shape. Together, the waves make room for everyone.</p>
    </header>
    <div className="dh-characters__list">
      {state.characters.map((character, index) => <CharacterCard key={character.id} character={character} index={index} />)}
    </div>
  </div>;
}
