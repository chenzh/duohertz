import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "../router";
import { clearApprovedDuohertzCatalogCache } from "./catalog";
import { loadApprovedDuohertzTrack } from "./approvedTrack";
import { DuohertzGame, type DuohertzPlayableTrack } from "./Game";
import { DUOHERTZ_GENRES } from "./trackCards";
import { DUOHERTZ_LIBRARY_BATCH_SIZE, libraryShownCount } from "./libraryDepth";

type PlayState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; track: DuohertzPlayableTrack };

/** Real-format game entry for a future release artifact, isolated from the lab. */
export function DuohertzApprovedPlay({ catalogUrl, libraryHref, radioHref }: {
  catalogUrl: string;
  libraryHref: string;
  radioHref: string;
}) {
  const { id = "" } = useParams();
  const [search] = useSearchParams();
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<PlayState>({ kind: "loading" });
  const returnParams = new URLSearchParams();
  const query = (search.get("q") ?? "").slice(0, 80);
  const style = DUOHERTZ_GENRES.find((genre) => genre === search.get("style"));
  if (query.trim()) returnParams.set("q", query);
  if (style) returnParams.set("style", style);
  const shownCount = libraryShownCount(search.get("show"));
  if (shownCount > DUOHERTZ_LIBRARY_BATCH_SIZE) returnParams.set("show", String(shownCount));
  const returnQuery = returnParams.toString();
  const returnHref = returnQuery ? `${libraryHref}?${returnQuery}` : libraryHref;

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    void loadApprovedDuohertzTrack(catalogUrl, id)
      .then((track) => { if (!cancelled) setState({ kind: "ready", track }); })
      .catch(() => { if (!cancelled) setState({ kind: "error" }); });
    return () => { cancelled = true; };
  }, [catalogUrl, id, retry]);

  if (state.kind === "ready") return <DuohertzGame key={state.track.id} tracks={[state.track]}
    initialTrackId={state.track.id} preview={false} libraryHref={returnHref}
    radioHref={`${radioHref}?track=${encodeURIComponent(state.track.id)}`} />;

  return <section className="dh-lab">
    {state.kind === "loading" ? <p role="status">Loading the selected beat…</p> : <div role="alert">
      <h1>This track is not available</h1>
      <p>The approved music library or this track could not be loaded.</p>
      <button type="button" onClick={() => {
        clearApprovedDuohertzCatalogCache(catalogUrl);
        setRetry((current) => current + 1);
      }}>Try again</button>
      <Link to={returnHref}>Choose another beat</Link>
    </div>}
  </section>;
}
