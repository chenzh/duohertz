import { Link } from "../router";
import { CHARACTER_LIST } from "../constants/scape";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { CHARACTERS_PAGE_META, usePageMeta } from "../seo/pageMeta";

export function CharactersPage() {
  usePageMeta(CHARACTERS_PAGE_META);
  return (
    <section className="characters">
      <header className="page-header">
        <h1>Characters</h1>
        <p className="tagline">
          Three musicians. Seven Districts. No record deal. NIGHTSHIFT is the only band
          still keeping the city loud — original, owned outright.
        </p>
        <p className="tagline">
          Their pirate radio, The Late Static, broadcasts one episode a week.{" "}
          <Link to="/radio" className="section-link">
            Season program →
          </Link>
        </p>
      </header>

      <div className="character-grid">
        {CHARACTER_LIST.map((c) => (
          <article
            key={c.code}
            className="character-card"
            style={{ ["--district-color" as string]: c.color }}
          >
            <div className="character-card-art">
              <CharacterAvatar district={c.district} rounded={false} glow />
            </div>
            <div className="character-card-body">
              <span className="character-code">{c.code}</span>
              <h2>{c.district}</h2>
              <p className="character-role">{c.role}</p>
              <p className="character-motif">
                <span className="motif-label">Motif</span>
                {c.motif}
              </p>
            </div>
          </article>
        ))}
      </div>

      <p className="characters-foot">
        Visual identity: RESONANCE flat + hard-edge ink line. Voice, ear, heart — three
        crew, seven blocks, every night one choice. If it&apos;s not yours, don&apos;t
        sample it.
      </p>
    </section>
  );
}
