import { useEffect, useMemo, useState } from "react";
import { PlayField } from "./components/PlayField";
import {
  Calibration,
  CreateStudio,
  Landing,
  Results,
  SongSelect,
} from "./components/Screens";
import { getPreset, PRESETS } from "./presets";
import { buildDemoCharts } from "./chart/autoChart";
import { synthesizeDemoAudio } from "./api/musicsaas";
import { getSession, newSessionId, parseShareParam, saveSession, serializeSharePayload } from "./storage/session";
import { loadSettings, saveSettings } from "./storage/settings";
import type { ChartTier, PlayMode, PlayResult, Screen } from "./types/chart";

function useQuery() {
  return useMemo(() => new URLSearchParams(window.location.search), []);
}

export default function App() {
  const query = useQuery();
  const kiosk = query.get("kiosk") === "1";
  const shareParam = query.get("chart");

  const [screen, setScreen] = useState<Screen>("landing");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [playAudioWav, setPlayAudioWav] = useState<ArrayBuffer | undefined>();
  const [tier, setTier] = useState<ChartTier>("standard");
  const [mode, setMode] = useState<PlayMode>("casual");
  const [casualSpeed, setCasualSpeed] = useState(1);
  const [result, setResult] = useState<PlayResult | null>(null);
  const [readOnly, setReadOnly] = useState(false);

  useEffect(() => {
    if (!shareParam) return;
    const parsed = parseShareParam(shareParam);
    if (!parsed) return;

    async function openShare() {
      let session = getSession(parsed!.id);
      if (!session) {
        const preset = getPreset(parsed!.presetId) ?? getPreset("mg-chart-main")!;
        const ctx = new AudioContext();
        const demo = await synthesizeDemoAudio(preset, ctx);
        saveSession({
          id: parsed!.id,
          createdAt: Date.now(),
          presetId: preset.id,
          presetLabel: preset.label,
          audioBlobUrl: demo.blobUrl,
          charts: buildDemoCharts(preset, demo.blobUrl),
        });
        setPlayAudioWav(demo.wavBytes);
        session = getSession(parsed!.id);
      }
      if (!session) return;
      setSessionId(parsed!.id);
      setTier(parsed!.tier);
      setMode("casual");
      setReadOnly(true);
      setScreen("play");
    }
    void openShare();
  }, [shareParam]);

  useEffect(() => {
    if (!kiosk) return;
    const id = window.setInterval(() => {
      if (screen === "results" || screen === "play") return;
      setScreen("landing");
    }, 60_000);
    return () => clearInterval(id);
  }, [kiosk, screen]);

  const settings = loadSettings();

  function goCreate() {
    if (!settings.calibrationDone && !settings.headphoneDismissed) {
      setScreen("calibration");
      return;
    }
    setScreen("create");
  }

  async function instantDemo() {
    const preset = getPreset("mg-chart-main") ?? PRESETS[0]!;
    const ctx = new AudioContext();
    const demo = await synthesizeDemoAudio(preset, ctx);
    const id = newSessionId();
    saveSession({
      id,
      createdAt: Date.now(),
      presetId: preset.id,
      presetLabel: preset.label,
      audioBlobUrl: demo.blobUrl,
      charts: buildDemoCharts(preset, demo.blobUrl),
    });
    setPlayAudioWav(demo.wavBytes);
    setSessionId(id);
    setTier("standard");
    setMode("casual");
    setScreen("play");
  }

  const session = sessionId ? getSession(sessionId) : undefined;
  const chart = session?.charts[tier];

  const shareUrl =
    session && chart
      ? `${window.location.origin}${window.location.pathname}?chart=${serializeSharePayload(session, tier)}`
      : "";

  return (
    <div className={`app ${kiosk ? "kiosk" : ""}`}>
      {!kiosk && (
        <header className="nav">
          <strong>NeonBeat</strong>
          <span className="tag">browser rhythm · MusicSaas</span>
        </header>
      )}
      <main>
        {screen === "landing" && (
          <Landing onCreate={goCreate} onPlayDemo={() => void instantDemo()} />
        )}
        {screen === "calibration" && (
          <Calibration
            onDone={(offsetMs) => {
              saveSettings({ offsetMs, calibrationDone: true });
              setScreen("create");
            }}
            onSkip={() => {
              saveSettings({ headphoneDismissed: true, calibrationDone: true });
              setScreen("create");
            }}
          />
        )}
        {screen === "create" && (
          <CreateStudio
            onBack={() => setScreen("landing")}
            onGenerated={(id) => {
              setSessionId(id);
              setScreen("select");
            }}
          />
        )}
        {screen === "select" && sessionId && (
          <SongSelect
            sessionId={sessionId}
            onBack={() => setScreen("landing")}
            onPlay={(t, m, s) => {
              setTier(t);
              setMode(m);
              setCasualSpeed(s);
              setResult(null);
              setPlayAudioWav(undefined);
              setScreen("play");
            }}
          />
        )}
        {screen === "play" && session && chart && (
          <PlayField
            chart={chart}
            audioUrl={session.audioBlobUrl}
            audioWavBytes={playAudioWav}
            mode={mode}
            casualSpeed={casualSpeed}
            readOnly={readOnly}
            onFinish={(r) => {
              setResult(r);
              setScreen("results");
            }}
            onFail={(r) => {
              setResult(r);
              setScreen("results");
            }}
          />
        )}
        {screen === "results" && result && session && (
          <Results
            result={result}
            shareUrl={shareUrl}
            audioUrl={session.audioBlobUrl}
            onReplay={() => setScreen("play")}
            onHome={() => setScreen("landing")}
          />
        )}
      </main>
      {!kiosk && (
        <footer className="footer">
          <span>NeonBeat MVP · PRD docs/PRD-WEB-RHYTHM-GAME.md</span>
        </footer>
      )}
    </div>
  );
}
