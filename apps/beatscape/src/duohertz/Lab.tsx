import { useRouter } from "../router";
import { DUOHERTZ_CANDIDATES, DUOHERTZ_CANDIDATE_ENTRIES } from "./candidate";
import { DUOHERTZ_CHARACTER_CONCEPTS } from "./characters";
import { DuohertzGame, type DuohertzPlayableTrack } from "./Game";

// Candidate imports live only in this DEV route. The game component can later
// receive approved v2 tracks without pulling these review assets into a build.
const LAB_TRACKS: DuohertzPlayableTrack[] = DUOHERTZ_CANDIDATE_ENTRIES.map(([id, staged]) => ({
  id,
  title: staged.title,
  audioUrl: staged.audioUrl,
  coverUrl: staged.coverUrl,
  coverAlt: staged.coverAlt,
  durationMs: staged.durationMs,
  charts: staged.charts,
}));

export function DuohertzLabPage() {
  const { search } = useRouter();
  const requested = new URLSearchParams(search).get("track");
  const initialTrackId = requested && Object.prototype.hasOwnProperty.call(DUOHERTZ_CANDIDATES, requested)
    ? requested : "sketch";
  return <DuohertzGame key={initialTrackId} tracks={LAB_TRACKS} initialTrackId={initialTrackId}
    preview allowSketch characters={DUOHERTZ_CHARACTER_CONCEPTS}
    libraryHref="/lab/duohertz/library" radioHref="/lab/duohertz/radio" />;
}
