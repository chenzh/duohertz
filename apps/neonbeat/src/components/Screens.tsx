import { useState } from "react";
import { PRESETS } from "../presets";
import { getSession } from "../storage/session";
import type { ChartTier, PlayMode, PlayResult } from "../types/chart";

export function Landing({ onCreate, onPlayDemo }: { onCreate: () => void; onPlayDemo: () => void }) {
  return (
    <section className="landing">
      <div className="beat-grid" aria-hidden>
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className="beat-cell" style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
      <div className="landing-copy">
        <p className="eyebrow">MusicSaas · NeonBeat</p>
        <h1>AI-original rhythm game in your browser</h1>
        <p className="lead">
          Web osu!mania feel. FNF ease. Pick a preset, generate a track, auto-chart, and play — no
          install, no copyrighted uploads.
        </p>
        <div className="cta-row">
          <button type="button" className="btn primary" onClick={onCreate}>
            Create &amp; Play
          </button>
          <button type="button" className="btn ghost" onClick={onPlayDemo}>
            Play Now — D F J K
          </button>
        </div>
        <ul className="value-props">
          <li>4-key lanes · tap + hold</li>
          <li>Casual, Arcade &amp; Practice modes</li>
          <li>Powered by MusicSaas AI BGM</li>
        </ul>
      </div>
    </section>
  );
}

export function CreateStudio({
  onBack,
  onGenerated,
}: {
  onBack: () => void;
  onGenerated: (sessionId: string) => void;
}) {
  const [selected, setSelected] = useState(PRESETS[0]!.id);
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState("");

  async function generate(useDemo: boolean) {
    setError("");
    const preset = PRESETS.find((p) => p.id === selected)!;
    if (!preset.playable) {
      setError("Song Select is a menu loop preset — pick a playable chart preset.");
      return;
    }
    setStatus("checking");
    const { checkHealth, createJob, pollJob, fetchAudio, synthesizeDemoAudio } = await import(
      "../api/musicsaas"
    );
    const { buildChartsFromAudio, buildDemoCharts } = await import("../chart/autoChart");
    const { saveSession, newSessionId } = await import("../storage/session");

    let useDemoFinal = useDemo;
    if (!useDemoFinal) {
      const healthy = await checkHealth();
      if (!healthy) {
        setError("MusicSaas workers offline — using offline demo audio.");
        useDemoFinal = true;
      }
    }

    try {
      const ctx = new AudioContext();
      let audioUrl = "";
      let buffer: AudioBuffer;
      const id = newSessionId();

      if (useDemoFinal) {
        setStatus("demo");
        const demo = await synthesizeDemoAudio(preset, ctx);
        audioUrl = demo.blobUrl;
        buffer = demo.buffer;
      } else {
        setStatus("queued");
        const extra = tags.join(", ");
        const jobId = await createJob(preset, extra);
        setStatus("generating");
        const url = await pollJob(jobId, setStatus);
        setStatus("charting");
        const ab = await fetchAudio(url);
        buffer = await ctx.decodeAudioData(ab.slice(0));
        audioUrl = URL.createObjectURL(new Blob([ab], { type: "audio/wav" }));
      }

      const charts = useDemoFinal
        ? buildDemoCharts(preset, audioUrl)
        : await buildChartsFromAudio(buffer, preset, preset.label, audioUrl);

      saveSession({
        id,
        createdAt: Date.now(),
        presetId: preset.id,
        presetLabel: preset.label,
        audioBlobUrl: audioUrl,
        charts,
      });
      setStatus("ready");
      onGenerated(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setStatus("idle");
    }
  }

  return (
    <section className="panel">
      <button type="button" className="btn text" onClick={onBack}>
        ← Back
      </button>
      <h2>Create Studio</h2>
      <p className="hint">Pick a rhythm-game preset. Tags append to the MusicSaas prompt.</p>
      <div className="preset-grid">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`preset-card ${selected === p.id ? "active" : ""}`}
            onClick={() => setSelected(p.id)}
          >
            <div
              className="preset-cover"
              style={{ background: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})` }}
            />
            <strong>{p.label}</strong>
            <span>{p.playable ? `${p.bpm} BPM` : "Menu loop"}</span>
          </button>
        ))}
      </div>
      <div className="tag-row">
        {["clear beat", "160 BPM", "neon", "loop-friendly", "no vocals"].map((t) => (
          <button
            key={t}
            type="button"
            className={`chip ${tags.includes(t) ? "on" : ""}`}
            onClick={() =>
              setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
            }
          >
            {t}
          </button>
        ))}
      </div>
      {status !== "idle" && status !== "ready" && (
        <p className="status-line">Status: {status}</p>
      )}
      {error && <p className="error">{error}</p>}
      <div className="cta-row">
        <button type="button" className="btn primary" onClick={() => generate(false)}>
          Generate via MusicSaas
        </button>
        <button type="button" className="btn ghost" onClick={() => generate(true)}>
          Offline demo
        </button>
      </div>
    </section>
  );
}

export function Calibration({
  onDone,
  onSkip,
}: {
  onDone: (offsetMs: number) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(0);
  const [taps, setTaps] = useState<number[]>([]);
  const beatMs = 500;

  function tap() {
    if (step !== 1) return;
    const t = performance.now();
    const next = [...taps, t];
    setTaps(next);
    if (next.length >= 8) {
      const deltas: number[] = [];
      for (let i = 1; i < next.length; i++) deltas.push(next[i]! - next[i - 1]! - beatMs);
      const median = deltas.sort((a, b) => a - b)[Math.floor(deltas.length / 2)] ?? 0;
      onDone(Math.round(median));
    }
  }

  return (
    <section className="panel cal">
      <h2>Calibration</h2>
      {step === 0 && (
        <>
          <p>Use wired headphones for best accuracy in browser rhythm games.</p>
          <button type="button" className="btn primary" onClick={() => setStep(1)}>
            Continue
          </button>
          <button type="button" className="btn text" onClick={onSkip}>
            Skip
          </button>
        </>
      )}
      {step === 1 && (
        <>
          <p>Tap on each beat ({taps.length}/8)</p>
          <button type="button" className="btn primary metronome" onClick={tap}>
            TAP
          </button>
        </>
      )}
    </section>
  );
}

export function SongSelect({
  sessionId,
  onPlay,
  onBack,
}: {
  sessionId: string;
  onPlay: (tier: ChartTier, mode: PlayMode, speed: number) => void;
  onBack: () => void;
}) {
  const [tier, setTier] = useState<ChartTier>("standard");
  const [mode, setMode] = useState<PlayMode>("casual");
  const [speed, setSpeed] = useState(1);

  const session = getSession(sessionId);

  if (!session) {
    return (
      <section className="panel">
        <p>Session not found.</p>
        <button type="button" className="btn text" onClick={onBack}>
          Back
        </button>
      </section>
    );
  }

  const chart = session.charts[tier];

  return (
    <section className="panel">
      <button type="button" className="btn text" onClick={onBack}>
        ← Back
      </button>
      <h2>{session.presetLabel}</h2>
      <p className="hint">{chart.meta.bpm} BPM · {chart.notes.length} notes · {chart.meta.engine}</p>
      <div className="row">
        <label>
          Chart tier
          <select value={tier} onChange={(e) => setTier(e.target.value as typeof tier)}>
            <option value="easy">Easy</option>
            <option value="standard">Standard</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label>
          Mode
          <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="casual">Casual</option>
            <option value="arcade">Arcade</option>
            <option value="practice">Practice</option>
          </select>
        </label>
        {mode === "casual" && (
          <label>
            Speed
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
              <option value={0.75}>0.75×</option>
              <option value={1}>1.0×</option>
              <option value={1.25}>1.25×</option>
            </select>
          </label>
        )}
      </div>
      <audio controls src={session.audioBlobUrl} className="preview-audio" />
      <button type="button" className="btn primary" onClick={() => onPlay(tier, mode, speed)}>
        Start
      </button>
    </section>
  );
}

export function Results({
  result,
  shareUrl,
  audioUrl,
  onReplay,
  onHome,
}: {
  result: PlayResult;
  shareUrl: string;
  audioUrl: string;
  onReplay: () => void;
  onHome: () => void;
}) {
  return (
    <section className="panel results">
      <h2>{result.failed ? "Failed" : "Results"}</h2>
      <div className="grade">{result.grade}</div>
      {result.fullCombo && <p className="fc">FULL COMBO</p>}
      <ul className="stats">
        <li>Score: {result.score.toLocaleString()}</li>
        <li>Accuracy: {result.accuracy}%</li>
        <li>Max combo: {result.maxCombo}</li>
      </ul>
      <div className="cta-row">
        <button type="button" className="btn primary" onClick={onReplay}>
          Replay
        </button>
        <button type="button" className="btn ghost" onClick={onHome}>
          Home
        </button>
        <a className="btn ghost" href={audioUrl} download="neonbeat.wav">
          Download WAV
        </a>
      </div>
      <p className="hint share">
        Share: <code>{shareUrl}</code>
      </p>
      <p className="license-hint">
        AI-generated audio. SA3 Community License / ACE-Step MIT — see MusicSaas compliance docs.
      </p>
    </section>
  );
}
