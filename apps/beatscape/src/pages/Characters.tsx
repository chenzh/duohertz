import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "../router";
import { CHARACTER_LIST } from "../constants/scape";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { useReveal } from "../components/useReveal";
import { firstPlayHref } from "../lib/firstPlay";
import { CHARACTERS_PAGE_META, usePageMeta } from "../seo/pageMeta";
import "../styles/characters-story.css";

const COMPACT_ROSTER_QUERY = "(max-width: 680px)";

export function CharactersPage() {
  usePageMeta(CHARACTERS_PAGE_META);
  const pageRef = useReveal<HTMLElement>(undefined, ".crew-card");
  const [activeCharacter, setActiveCharacter] = useState(CHARACTER_LIST[0]!.code);
  const [compactRoster, setCompactRoster] = useState(
    () => typeof window !== "undefined" && window.matchMedia(COMPACT_ROSTER_QUERY).matches,
  );
  const alignSelectedPanelRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia(COMPACT_ROSTER_QUERY);
    const syncLayout = (event: MediaQueryListEvent) => setCompactRoster(event.matches);
    media.addEventListener("change", syncLayout);
    return () => media.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    if (!alignSelectedPanelRef.current) return;
    alignSelectedPanelRef.current = false;
    document
      .getElementById(`crew-panel-${activeCharacter.toLowerCase()}`)
      ?.scrollIntoView({ block: "start" });
  }, [activeCharacter]);

  const selectCharacter = (code: string, roster: Element | null) => {
    alignSelectedPanelRef.current = (roster?.getBoundingClientRect().top ?? 2) <= 1;
    setActiveCharacter(code);
  };

  const handleRosterKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % CHARACTER_LIST.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + CHARACTER_LIST.length) % CHARACTER_LIST.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = CHARACTER_LIST.length - 1;
    }
    if (nextIndex === null) return;

    event.preventDefault();
    const nextCharacter = CHARACTER_LIST[nextIndex]!;
    const roster = event.currentTarget.closest(".crew-roster");
    selectCharacter(nextCharacter.code, roster);
    roster
      ?.querySelector<HTMLButtonElement>(`#crew-tab-${nextCharacter.code.toLowerCase()}`)
      ?.focus();
  };

  return (
    <section className="characters crew-story" ref={pageRef}>
      <header className="page-header crew-story-header">
        <p className="eyebrow">The voices on the other end</p>
        <h1>NIGHTSHIFT</h1>
        <p className="crew-story-lede">
          Three musicians. Seven blocks. One rooftop radio station.
        </p>
        <p className="tagline">
          They work days and play rooftops after dark. In Scape City, a block that loses
          its music starts losing its memories. These three can&apos;t be everywhere.
          You&apos;re the Listener who keeps calling in.
        </p>
        <Link to="/radio" className="btn ghost">
          Read their broadcasts
        </Link>
      </header>

      <div
        className="crew-roster"
        role={compactRoster ? "tablist" : undefined}
        aria-label={compactRoster ? "Choose a crew member" : undefined}
      >
        {CHARACTER_LIST.map((character, index) => (
          <button
            key={character.code}
            id={compactRoster ? `crew-tab-${character.code.toLowerCase()}` : undefined}
            type="button"
            className="crew-roster-button"
            role={compactRoster ? "tab" : undefined}
            aria-selected={compactRoster ? activeCharacter === character.code : undefined}
            aria-controls={compactRoster ? `crew-panel-${character.code.toLowerCase()}` : undefined}
            tabIndex={compactRoster ? (activeCharacter === character.code ? 0 : -1) : undefined}
            style={{ "--district-color": character.color } as CSSProperties}
            onClick={(event) => {
              selectCharacter(character.code, event.currentTarget.closest(".crew-roster"));
            }}
            onKeyDown={(event) => handleRosterKeyDown(event, index)}
          >
            <strong>{character.name}</strong>
            <span>{character.district}</span>
          </button>
        ))}
      </div>

      <div className="crew-grid">
        {CHARACTER_LIST.map((character) => (
          <article
            key={character.code}
            id={`crew-panel-${character.code.toLowerCase()}`}
            className="crew-card"
            data-active={activeCharacter === character.code}
            role={compactRoster ? "tabpanel" : undefined}
            aria-labelledby={compactRoster
              ? `crew-tab-${character.code.toLowerCase()}`
              : `crew-${character.code.toLowerCase()}`}
            tabIndex={compactRoster ? 0 : undefined}
            style={{ "--district-color": character.color } as CSSProperties}
          >
            <div className="crew-card-portrait">
              <CharacterAvatar district={character.district} rounded={false} />
              <span className="crew-card-district">{character.district}</span>
            </div>
            <div className="crew-card-copy">
              <header>
                <h2 id={`crew-${character.code.toLowerCase()}`}>{character.name}</h2>
                <p className="crew-card-role">{character.role}</p>
              </header>
              <blockquote className="crew-card-quote">
                <p>“{character.quote}”</p>
              </blockquote>
              <p className="crew-card-bio">{character.bio}</p>
              <p className="crew-card-dilemma">{character.dilemma}</p>
              <div className="crew-card-relationship">
                <h3>With the crew</h3>
                <p>{character.relationship}</p>
              </div>
              <div className="crew-card-request">
                <h3>On the request line</h3>
                <p>{character.recommendedTrack.note}</p>
                <Link
                  to={firstPlayHref(character.recommendedTrack.trackId)}
                  className="btn crew-card-play"
                  aria-label={`Play ${character.recommendedTrack.title}, ${character.name}'s pick, Easy Casual`}
                >
                  Play {character.recommendedTrack.title}
                  <span aria-hidden="true">↗</span>
                </Link>
                <span className="crew-card-difficulty">Easy · Casual · four lanes</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="crew-story-invitation" aria-label="A place on the request line">
        <p className="eyebrow">No gig is too small</p>
        <p>
          You don&apos;t have to be good to belong here. Pick a song, play a few bars,
          come back when you feel like it. They&apos;ll leave the line open.
        </p>
        <Link to="/library" className="btn ghost">Find your next song</Link>
      </aside>
    </section>
  );
}
