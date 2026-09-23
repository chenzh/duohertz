import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "../router";
import { assetUrl, getTrack } from "../catalog/loadCatalog";
import { beginIntentAudio, type IntentAudioLease } from "../audio/intentAudio";
import { FIRST_SHIFT, shiftPlayHref, type ShiftStep } from "../data/firstShift";
import { loadShiftProgress, shiftInputSurface, shiftLaneAction, shiftStorageNotice } from "../lib/firstShift";
import { CrewDialogue, ShiftCircuit, ShiftSignalPath } from "../components/ShiftStory";
import type { CrewLine } from "../data/firstShift";
import { usePageMeta } from "../seo/pageMeta";
import { isCoarsePointer } from "../input/touchInput";
import { usePhysicalKeyboardInput } from "../input/usePhysicalKeyboardInput";
import { useGamepadAssignments } from "../input/useGamepadAssignments";

const META = { title: "Your First Shift — BeatScape", description: "A broken radio, three musicians, and your first night on the line. Play three short rhythm sets and help NIGHTSHIFT get back on air." };

/** 开场台词：有人物就用人物的那几句，没有就念全部（见 data/firstShift.ts）。 */
function openingLines(step: ShiftStep): readonly CrewLine[] {
  return step.opening ?? step.before;
}

export function FirstShiftPage() {
  usePageMeta(META);
  const [touchUi] = useState(isCoarsePointer);
  const physicalKeyboardSeen = usePhysicalKeyboardInput();
  const [gamepadIndex] = useGamepadAssignments(1);
  const action = shiftLaneAction(shiftInputSurface(touchUi, physicalKeyboardSeen, gamepadIndex !== null));
  const instruction = `${action[0]!.toUpperCase()}${action.slice(1)} as notes reach the line.`;
  const progress = loadShiftProgress();
  const count = progress.completed.length;
  const next = FIRST_SHIFT[count];
  const nextTrackId = next?.trackId;
  const audioIntentRef = useRef<IntentAudioLease | null>(null);

  useEffect(() => {
    if (!nextTrackId) return;
    let active = true;
    // The player chose the story, but let its first paint settle before
    // spending mobile bandwidth on a full song they may not play.
    const timer = window.setTimeout(() => {
      void getTrack(nextTrackId).then((track) => {
        if (active && track) audioIntentRef.current = beginIntentAudio(assetUrl(track.audio));
      }).catch(() => {
        // Optional prefetch failure leaves Play's normal loading/error path intact.
      });
    }, 500);
    return () => {
      active = false;
      window.clearTimeout(timer);
      audioIntentRef.current?.release();
      audioIntentRef.current = null;
    };
  }, [nextTrackId]);

  const handoffAudioOnPlay = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    audioIntentRef.current?.handoff();
  };

  return <section className="first-shift-page">
    <header className="page-header">
      <p className="eyebrow">NIGHTSHIFT · A playable opening night</p>
      <h1>{next ? "Your first shift" : "Welcome to the crew."}</h1>
      <p className="tagline">{next ? "In Scape City, music keeps the lights on. You're a listener calling a struggling pirate radio station. Tonight, they could use a hand." : "The studio can hear itself. The speaker holds. The signal reaches the next rooftop. You helped three people finish a difficult night."}</p>
    </header>
    <ShiftCircuit completed={count} />
    <p className="shift-storage-note" role="status">{shiftStorageNotice()}</p>
    {next ? <article className="shift-scene" aria-labelledby="shift-scene-title">
      <div className="shift-scene-heading"><p className="eyebrow">Connection {count + 1} of 3 · {next.district}</p><h2 id="shift-scene-title">{next.title}</h2><p className="shift-setup">{next.setup}</p></div>
      <CrewDialogue lines={openingLines(next)} />
      <div className="shift-play-card">
        <div><p className="eyebrow">Your part</p><h3>{next.trackTitle}</h3><p>Easy · Casual. {instruction} Stay to the end and land a note to carry the signal; every grade counts.</p>
        <ShiftSignalPath className="shift-link-goal" from={next.link.from} to={next.link.to} /></div>
        <Link className="btn primary" to={shiftPlayHref(next)} onClick={handoffAudioOnPlay}>Play {next.trackTitle}</Link>
      </div>
    </article> : <article className="shift-scene shift-finale" aria-labelledby="shift-finale-title">
      <p className="eyebrow">The Late Static · Back on air</p><h2 id="shift-finale-title">The fourth chair is yours.</h2>
      <CrewDialogue lines={FIRST_SHIFT[2]!.after} />
      <p>The rest of the city still has its troubles. The crew will tell you about them in their weekly broadcasts. Tonight, this much worked.</p>
      <div className="cta-row"><Link className="btn primary" to="/radio">Read the broadcasts</Link><Link className="btn" to="/library">Pick the next song</Link><Link className="btn ghost" to="/characters">Get to know NIGHTSHIFT</Link></div>
    </article>}
    {count > 0 && <section className="shift-journal" aria-labelledby="shift-journal-title">
      <h2 id="shift-journal-title">From your first night</h2>
      {FIRST_SHIFT.slice(0, count).map((step) => <details key={step.id}>
        <summary>{step.title}<span>Connection restored</span></summary>
        <p>{step.setup}</p><CrewDialogue lines={step.before} /><p className="shift-change">{step.restored}</p><CrewDialogue lines={step.after} />
        <Link className="btn ghost" to={shiftPlayHref(step)}>Replay {step.trackTitle}</Link>
      </details>)}
    </section>}
    {next && <p className="shift-exit"><Link className="section-link" to="/library">Just here for the music? Browse the tracks →</Link></p>}
  </section>;
}
