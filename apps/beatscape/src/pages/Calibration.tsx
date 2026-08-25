import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "../router";
import { unlockAudio } from "../audio/context";
import { playHit } from "../audio/hitsounds";
import { getAudioContext } from "../audio/context";
import { saveOffsetMs } from "../storage/settings";
import { SCAPE_COPY } from "../constants/scape";

const BEAT_MS = 60000 / 120;
const LANES = ["D", "F", "J", "K"];
const COUNT = 8;

export function CalibrationPage() {
  const nav = useNavigate();
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [hits, setHits] = useState<number[]>([]);
  const [flash, setFlash] = useState(-1);
  const t0 = useRef(0);
  const beat = useRef(0);

  useEffect(() => {
    if (phase !== "playing") return;
    t0.current = getAudioContext().currentTime * 1000;
    beat.current = 0;
    const id = window.setInterval(() => {
      beat.current++;
      setFlash(beat.current % COUNT);
      window.setTimeout(() => setFlash(-1), 120);
      if (beat.current >= COUNT) {
        clearInterval(id);
        setPhase("done");
      }
    }, BEAT_MS);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      const lane = LANES.findIndex((k) => k.toLowerCase() === e.key.toLowerCase());
      if (lane < 0) return;
      e.preventDefault();
      void unlockAudio();
      playHit("perfect");
      const expected = t0.current + beat.current * BEAT_MS;
      const delta = getAudioContext().currentTime * 1000 - expected;
      setHits((h) => [...h, delta]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const finish = (offset: number) => {
    saveOffsetMs(offset);
    nav("/play/bs-s1-02?tier=easy&mode=casual");
  };

  const median =
    hits.length >= 3 ? [...hits].sort((a, b) => a - b)[Math.floor(hits.length / 2)]! : 0;

  return (
    <section className="calibrate">
      <Link to="/" className="back-link">
        Back
      </Link>
      <h1>{SCAPE_COPY.calibrateTitle}</h1>
      <p className="tagline">{SCAPE_COPY.calibrateHint}</p>
      {phase === "intro" && (
        <button type="button" className="btn primary" onClick={() => setPhase("playing")}>
          Start
        </button>
      )}
      {phase === "playing" && (
        <div className="calib-lanes">
          {LANES.map((k, i) => (
            <div key={k} className={`calib-lane ${flash === i ? "flash" : ""}`}>
              {k}
            </div>
          ))}
          <p>
            Beat {Math.min(beat.current + 1, COUNT)} / {COUNT} · hits {hits.length}
          </p>
        </div>
      )}
      {phase === "done" && (
        <div>
          <p>{SCAPE_COPY.calibrateDone}</p>
          <button type="button" className="btn primary" onClick={() => finish(Math.round(median))}>
            Save &amp; play Glass Horizon
          </button>
        </div>
      )}
      <button type="button" className="btn linkish" onClick={() => finish(0)} title={SCAPE_COPY.calibrateSkip}>
        Skip (offset 0)
      </button>
    </section>
  );
}
