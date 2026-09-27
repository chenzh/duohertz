import { useEffect, useState } from "react";
import { appHref, normalizeAppBase } from "../lib/appBase";
import { useSearchParams } from "../router";
import { clearApprovedDuohertzCatalogCache, loadApprovedDuohertzCatalog } from "./catalog";
import { DuohertzRadio, type DuohertzRadioEntry } from "./Radio";

type RadioState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; entries: DuohertzRadioEntry[] };

/** Loads only signed v2 catalog metadata before constructing the station queue. */
export function DuohertzApprovedRadio({ catalogUrl, gameHref, playHref }: {
  catalogUrl: string;
  gameHref: string;
  playHref: (id: string) => string;
}) {
  const [search, setSearch] = useSearchParams();
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<RadioState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    void loadApprovedDuohertzCatalog(catalogUrl)
      .then((catalog) => {
        if (cancelled) return;
        const base = normalizeAppBase(import.meta.env.BASE_URL);
        const entries: DuohertzRadioEntry[] = catalog.tracks.map((track) => [track.track_id, {
          title: track.title,
          artist: track.artist,
          subgenre: track.genre,
          bpm: track.bpm,
          streamUrl: appHref(track.stream_audio, base),
          coverUrl: appHref(track.cover_thumb, base),
          coverAlt: `${track.title} cover art`,
          streamDurationMs: Math.round(track.stream_duration_sec * 1000),
        }]);
        setState({ kind: "ready", entries });
      })
      .catch(() => { if (!cancelled) setState({ kind: "error" }); });
    return () => { cancelled = true; };
  }, [catalogUrl, retry]);

  if (state.kind === "loading") return <p role="status">Loading the duohertz music station…</p>;
  if (state.kind === "error") return <section className="dh-radio-lab" role="alert">
    <h1>The duohertz music station is not available yet.</h1>
    <button type="button" onClick={() => {
      clearApprovedDuohertzCatalogCache(catalogUrl);
      setRetry((current) => current + 1);
    }}>Try again</button>
  </section>;
  const requestedId = search.get("track");
  if (requestedId && !state.entries.some(([id]) => id === requestedId)) return <section className="dh-radio-lab dh-radio-lab__missing" role="alert">
    <h1>{requestedId.startsWith("bs-") ? "This link belongs to the previous music library." : "This track is not in the duohertz music station."}</h1>
    <p>{requestedId.startsWith("bs-")
      ? "There is no direct replacement for an old song. Choose a track from the new electronic music library."
      : "Check the link or choose a track from the electronic music library."}</p>
    <button type="button" onClick={() => {
      const next = new URLSearchParams(search);
      next.delete("track");
      setSearch(next);
    }}>Browse new music</button>
  </section>;

  return <DuohertzRadio entries={state.entries} preview={false} gameHref={gameHref} playHref={playHref}
    selectedTrackId={requestedId ?? state.entries[0]?.[0]}
    onSelectTrack={(id) => {
      const next = new URLSearchParams(search);
      next.set("track", id);
      setSearch(next);
    }} />;
}
