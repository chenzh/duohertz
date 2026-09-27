import { useEffect, useState, type MouseEvent } from "react";
import { Link } from "../router";
import { clearApprovedDuohertzCatalogCache, loadApprovedDuohertzCatalog } from "./catalog";
import { DuohertzHomeHero } from "./HomeHero";
import { DuohertzTrackGrid } from "./TrackGrid";
import { publicCatalogTrackCards, type DuohertzTrackCard } from "./trackCards";
import "./hub.css";
import "./home-layout.css";

type HomeState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; featured: DuohertzTrackCard[]; firstId: string };

/** Future-brand home preview backed only by the complete approved v2 catalog. */
export function DuohertzApprovedHome({ catalogUrl, libraryHref, radioHref, charactersHref, playHref }: {
  catalogUrl: string;
  libraryHref: string;
  radioHref: string;
  charactersHref: string;
  playHref: (id: string) => string;
}) {
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<HomeState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    void loadApprovedDuohertzCatalog(catalogUrl)
      .then((catalog) => {
        if (cancelled) return;
        const cards = publicCatalogTrackCards(catalog, playHref, import.meta.env.BASE_URL,
          (id) => `${radioHref}?track=${encodeURIComponent(id)}`);
        const featured = cards.slice(0, 9);
        setState({ kind: "ready", featured, firstId: catalog.tracks[0]!.track_id });
      })
      .catch(() => { if (!cancelled) setState({ kind: "error" }); });
    return () => { cancelled = true; };
  }, [catalogUrl, playHref, radioHref, retry]);

  const handleHomeMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mx = ((event.clientX - rect.left) / rect.width) * 100;
    const my = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.setProperty("--mx", `${mx}%`);
    event.currentTarget.style.setProperty("--my", `${my}%`);
  };

  if (state.kind === "loading") return <p className="dh-status" role="status">Loading duohertz…</p>;
  if (state.kind === "error") return <section className="dh-error" role="alert">
    <h1>The duohertz home is not available yet.</h1>
    <p>The approved music catalog could not be loaded.</p>
    <button type="button" onClick={() => {
      clearApprovedDuohertzCatalogCache(catalogUrl);
      setRetry((current) => current + 1);
    }}>Try again</button>
  </section>;

  return <div className="dh-home" onMouseMove={handleHomeMove}>
    <DuohertzHomeHero playHref={playHref(state.firstId)} libraryHref={libraryHref} />

    <section className="dh-section" id="dh-home-start" aria-labelledby="dh-approved-featured-heading">
      <div className="dh-section__head">
        <p className="dh-section__eyebrow">01 / GET STARTED</p>
        <h2 id="dh-approved-featured-heading" className="dh-section__title">Featured tracks</h2>
        <span className="dh-section__meta">Tap in solo · add a second key anytime</span>
      </div>
      <DuohertzTrackGrid tracks={state.featured.slice(0, 3)} />
      <Link to={libraryHref} className="dh-section__cta">Browse all 105 tracks ↗</Link>
    </section>

    <section className="dh-banner" aria-label="Hertz Radio">
      <div className="dh-banner__copy">
        <p>ON AIR / HERTZ RADIO</p>
        <h2>Keep the frequency alive</h2>
        <span>Listen to the electronic library, then drop into a match.</span>
      </div>
      <Link to={radioHref} className="dh-banner__cta">Open radio ↗</Link>
    </section>

    <section className="dh-banner dh-banner--magenta" aria-label="Characters">
      <div className="dh-banner__copy">
        <p>THE SOUNDFIELD / CHARACTERS</p>
        <h2>Meet the frequency</h2>
        <span>Three voices carry the whole beat.</span>
      </div>
      <Link to={charactersHref} className="dh-banner__cta">Meet characters ↗</Link>
    </section>

    <section className="dh-section" aria-labelledby="dh-approved-recent-heading">
      <div className="dh-section__head">
        <p className="dh-section__eyebrow">02 / RECENT</p>
        <h2 id="dh-approved-recent-heading" className="dh-section__title">Pick up where you left off</h2>
        <span className="dh-section__meta">Resume your rhythm</span>
      </div>
      <DuohertzTrackGrid tracks={state.featured.slice(3, 6)} />
    </section>

    <section className="dh-section" aria-labelledby="dh-approved-explore-heading">
      <div className="dh-section__head">
        <p className="dh-section__eyebrow">03 / EXPLORE</p>
        <h2 id="dh-approved-explore-heading" className="dh-section__title">More to discover</h2>
        <span className="dh-section__meta">105 tracks in the library</span>
      </div>
      <DuohertzTrackGrid tracks={state.featured.slice(6)} />
      <Link to={libraryHref} className="dh-section__cta">Explore the full library ↗</Link>
    </section>
  </div>;
}
