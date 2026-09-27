import { Suspense, lazy } from "react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Link, Router, useParams } from "../router";
import { DuohertzApprovedHome } from "./ApprovedHome";
import { DuohertzLegacyTrackTransition } from "./LegacyTrackTransition";
import { DuohertzV2Shell } from "./V2Shell";

const Library = lazy(() => import("./ApprovedLibrary").then(({ DuohertzApprovedLibrary }) => ({ default: DuohertzApprovedLibrary })));
const Play = lazy(() => import("./ApprovedPlay").then(({ DuohertzApprovedPlay }) => ({ default: DuohertzApprovedPlay })));
const Radio = lazy(() => import("./ApprovedRadio").then(({ DuohertzApprovedRadio }) => ({ default: DuohertzApprovedRadio })));
const Characters = lazy(() => import("./ApprovedCharacters").then(({ DuohertzApprovedCharacters }) => ({ default: DuohertzApprovedCharacters })));

const HOME = "/";
const LIBRARY = "/library";
const RADIO = "/radio";
const CHARACTERS = "/characters";
const PLAY = "/play";
const CATALOG_URL = `${import.meta.env.BASE_URL}duohertz-v2/catalog.json`;
const CHARACTERS_URL = `${import.meta.env.BASE_URL}duohertz-v2/characters.json`;
const playHref = (id: string) => `${PLAY}/${encodeURIComponent(id)}`;
const legacyHashRoute = (hash: string) => {
  const match = /^#\/track\/(bs-[a-z0-9-]+)(?:[?&]|$)/i.exec(hash);
  return match ? `/track/${match[1]}` : null;
};

function DuohertzPlayRoute() {
  const { id = "" } = useParams();
  if (id.startsWith("bs-")) return <DuohertzLegacyTrackTransition homeHref={HOME} libraryHref={LIBRARY} />;
  return <Play catalogUrl={CATALOG_URL} libraryHref={LIBRARY} radioHref={RADIO} />;
}

/** Independent future-brand artifact. Its pages still refuse an unsigned catalog. */
export function DuohertzApp() {
  return <ErrorBoundary brand="duohertz">
    <Router
      hashRoute={legacyHashRoute}
      layout={(child) => <DuohertzV2Shell homeHref={HOME} libraryHref={LIBRARY}
        radioHref={RADIO} charactersHref={CHARACTERS} playPath={PLAY}
        preview={import.meta.env.VITE_DUOHERTZ_PREVIEW === "1"}>
        <Suspense fallback={<p role="status">Loading duohertz…</p>}>{child}</Suspense>
      </DuohertzV2Shell>}
      fallback={<section className="dh-v2-unavailable">
        <h1>That beat is missing.</h1>
        <Link to={HOME}>Back to home</Link>
      </section>}
      routes={[
        { path: HOME, element: <DuohertzApprovedHome catalogUrl={CATALOG_URL}
          libraryHref={LIBRARY} radioHref={RADIO} charactersHref={CHARACTERS} playHref={playHref} /> },
        { path: LIBRARY, element: <Library catalogUrl={CATALOG_URL} playHref={playHref} radioHref={RADIO} /> },
        { path: RADIO, element: <Radio catalogUrl={CATALOG_URL} gameHref={LIBRARY} playHref={playHref} /> },
        { path: CHARACTERS, element: <Characters catalogUrl={CATALOG_URL} charactersUrl={CHARACTERS_URL} /> },
        { path: `${PLAY}/:id`, element: <DuohertzPlayRoute /> },
        { path: "/track/:id", element: <DuohertzLegacyTrackTransition homeHref={HOME} libraryHref={LIBRARY} /> },
        { path: "/duo/:id", element: <DuohertzLegacyTrackTransition homeHref={HOME} libraryHref={LIBRARY} /> },
        { path: "/beatscape/track/:id", element: <DuohertzLegacyTrackTransition homeHref={HOME} libraryHref={LIBRARY} /> },
        { path: "/beatscape/play/:id", element: <DuohertzLegacyTrackTransition homeHref={HOME} libraryHref={LIBRARY} /> },
        { path: "/beatscape/duo/:id", element: <DuohertzLegacyTrackTransition homeHref={HOME} libraryHref={LIBRARY} /> },
      ]}
    />
  </ErrorBoundary>;
}
