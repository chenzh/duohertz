import { type CSSProperties } from "react";
import { Link } from "../router";
import { CHARACTER_LIST } from "../constants/scape";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { useReveal } from "../components/useReveal";
import { firstPlayHref } from "../lib/firstPlay";
import { CHARACTERS_PAGE_META, usePageMeta } from "../seo/pageMeta";
import "../styles/characters-story.css";

export function CharactersPage() {
  usePageMeta(CHARACTERS_PAGE_META);
  const pageRef = useReveal<HTMLElement>(undefined, ".crew-card");

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

      <div className="crew-grid">
        {CHARACTER_LIST.map((character) => (
          <article
            key={character.code}
            className="crew-card"
            aria-labelledby={`crew-${character.code.toLowerCase()}`}
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
