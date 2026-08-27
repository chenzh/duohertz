import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "../router";
import { resumeAudio, playHit } from "../audio/hitsounds";
import { CALIBRATION_PAGE_META, usePageMeta } from "../seo/pageMeta";
import { saveOffsetMs } from "../storage/settings";

const BEAT_MS = 60000 / 120;
const LANES = ["D", "F", "J", "K"];

export function CalibrationPage() {
  usePageMeta(CALIBRATION_PAGE_META);
  const nav = useNavigate();
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [hits, setHits] = useState<number[]>([]);
  const [flash, setFlash] = useState(-1);
  const t0 = useRef(0);
  const beat = useRef(0);

  useEffect(() => {
    if (phase !== "playing") return;
    t0.current = performance.now();
    beat.current = 0;
    const id = window.setInterval(() => {
      beat.current++;
      setFlash(beat.current % 4);
      window.setTimeout(() => setFlash(-1), 120);
      if (beat.current >= 8) {
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
      void resumeAudio();
      playHit("perfect");
      const expected = t0.current + beat.current * BEAT_MS;
      setHits((h) => [...h, performance.now() - expected]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const finish = (offset: number) => {
    saveOffsetMs(offset);
    nav("/play/bs-s1-02?tier=easy&mode=casual");
  };

  const median =
    hits.length >= 3
      ? [...hits].sort((a, b) => a - b)[Math.floor(hits.length / 2)]!
      : 0;

  return (
    <section className="calibrate">
      <h1>Tap the beat</h1>
      <p className="tagline">Press D F J K when each lane flashes — one step, 8 beats.</p>
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
          <p>Beat {Math.min(beat.current + 1, 8)} / 8 · hits {hits.length}</p>
        </div>
      )}
      {phase === "done" && (
        <div>
          <p>Offset ≈ {Math.round(median)} ms (clamped ±200)</p>
          <button type="button" className="btn primary" onClick={() => finish(Math.round(median))}>
            Save & play Glass Horizon
          </button>
        </div>
      )}
      <button type="button" className="btn linkish" onClick={() => finish(0)}>
        Skip (offset 0)
      </button>
      <Link to="/">Back</Link>
    </section>
  );
}
