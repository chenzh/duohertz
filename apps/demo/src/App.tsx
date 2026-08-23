import { useEffect, useMemo, useState } from "react";
import {
  audioUrl,
  createJob,
  fetchDemoMeta,
  type Mode,
} from "./api";
import { OfflineBanner, ErrorBanner } from "./components/Banners";
import { AudioPlayer } from "./components/AudioPlayer";
import { IntegrationPanel } from "./components/IntegrationPanel";
import { PresetChips } from "./components/PresetChips";
import { GenerationTimeline, PlayerSkeleton } from "./components/Timeline";
import { TaskCard, type TaskItem } from "./components/TaskCard";
import { Badge, Card } from "./components/ui";
import { useInferenceHealth } from "./hooks/useInferenceHealth";
import { useJobPoll } from "./hooks/useJobPoll";
import { type Locale, useMessages } from "./i18n";
import { PRESETS, SAMPLES, type Preset, type Scene } from "./presets";

const MODES: { value: Mode; label: string }[] = [
  { value: "vocal_lyrics", label: "人声-歌词" },
  { value: "vocal_desc", label: "人声-描述" },
  { value: "game_bgm", label: "游戏 BGM" },
  { value: "game_theme_vocal", label: "主题曲" },
];

function engineLabel(mode: Mode, t: ReturnType<typeof useMessages>) {
  return mode === "game_bgm" ? t.engineSa3 : t.engineAce;
}

export function App() {
  const demoMode = useMemo(
    () => new URLSearchParams(window.location.search).get("demo") === "1",
    [],
  );
  const devMode = useMemo(
    () => new URLSearchParams(window.location.search).get("dev") === "1",
    [],
  );
  const [locale, setLocale] = useState<Locale>(
    () => (localStorage.getItem("demo_locale") as Locale) || "zh",
  );
  const t = useMessages(locale);

  const [scene, setScene] = useState<Scene>("game");
  const [mode, setMode] = useState<Mode>("game_bgm");
  const [duration, setDuration] = useState(60);
  const [prompt, setPrompt] = useState("dark dungeon ambient, tense, no vocals, instrumental");
  const [styleTags, setStyleTags] = useState("j-pop, female vocal, emotional");
  const [lyrics, setLyrics] = useState("[Verse]\n星が降る夜に\n[Chorus]\nHello tonight");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [demoUrl, setDemoUrl] = useState(() => window.location.origin + "/demo/");
  const [apiDocsUrl, setApiDocsUrl] = useState(
    "https://github.com/chenzh/MusicSaas/blob/main/docs/DATA_API.md",
  );
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem("demo_tasks_v2") ?? "[]");
    } catch {
      return [];
    }
  });

  const health = useInferenceHealth();
  const { job, error: pollError, timedOut, pollLog } = useJobPoll(activeJobId);

  useEffect(() => {
    void fetchDemoMeta()
      .then((meta) => {
        setDemoUrl(meta.demo_url);
        if (meta.api_docs_url) setApiDocsUrl(meta.api_docs_url);
      })
      .catch(() => undefined);
  }, []);

  const scenePresets = PRESETS.filter((p) => p.scene === scene);
  const workersDown = health.gateway === "ok" && !health.workersOk;
  const isGenerating =
    !!activeJobId &&
    job?.status &&
    !["completed", "failed"].includes(job.status);

  const showLyrics = mode === "vocal_lyrics" || mode === "game_theme_vocal";
  const showPrompt = mode !== "vocal_lyrics";
  const showStyle = mode === "vocal_lyrics";

  useEffect(() => {
    localStorage.setItem("demo_locale", locale);
  }, [locale]);

  useEffect(() => {
    sessionStorage.setItem("demo_tasks_v2", JSON.stringify(tasks.slice(0, 20)));
  }, [tasks]);

  useEffect(() => {
    if (!job?.job_id) return;
    setTasks((prev) => {
      const next = prev.map((item) =>
        item.job_id === job.job_id ? { ...item, status: job.status } : item,
      );
      return next;
    });
  }, [job?.job_id, job?.status]);

  useEffect(() => {
    void fetch("/demo/meta")
      .then((r) => r.json())
      .then((b) => {
        if (b?.data?.demo_url) setDemoUrl(b.data.demo_url);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!demoMode || scenePresets.length === 0) return;
    applyPreset(scenePresets[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]);

  function applyPreset(preset: Preset) {
    setScene(preset.scene);
    setMode(preset.mode);
    setDuration(preset.duration_sec);
    if (preset.prompt) setPrompt(preset.prompt);
    if (preset.style_tags) setStyleTags(preset.style_tags);
    if (preset.lyrics) setLyrics(preset.lyrics);
    setSubmitError(null);
  }

  function onSceneChange(next: Scene) {
    setScene(next);
    const first = PRESETS.find((p) => p.scene === next);
    if (first) applyPreset(first);
  }

  async function onSubmit() {
    if (workersDown) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const body: Record<string, unknown> = { mode, duration_sec: duration };
      if (showPrompt) body.prompt = prompt;
      if (showStyle) body.style_tags = styleTags;
      if (showLyrics) body.lyrics = lyrics;
      const created = await createJob(body);
      setActiveJobId(created.job_id);
      setTasks((list) =>
        [
          {
            job_id: created.job_id,
            mode,
            status: created.status,
            created_at: new Date().toISOString(),
          },
          ...list,
        ].slice(0, 20),
      );
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  const statusText = (() => {
    if (!activeJobId) return t.statusIdle;
    if (timedOut) return t.statusTimeout;
    if (pollError) return pollError;
    if (isGenerating) return mode === "game_bgm" ? t.bgmMlxHint : t.mlxHint;
    return job?.status ?? "queued";
  })();

  const formSnapshot = { mode, duration_sec: duration, prompt, style_tags: styleTags, lyrics };

  return (
    <div className={`app scene-${scene}${demoMode ? " demo-mode" : ""}`}>
      <header className="site-header">
        <div className="brand">
          <span className="logo">♪</span>
          <div>
            <h1>{t.product} Demo</h1>
            <p className="subtitle">{t.subtitle}</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="health">
            <span>
              {t.healthGateway}{" "}
              <span className={health.gateway === "ok" ? "dot-ok" : "dot-down"}>●</span>
            </span>
            <span>
              {t.healthAce}{" "}
              <span className={health.ace === "ok" ? "dot-ok" : "dot-down"}>●</span>
            </span>
            <span>
              {t.healthSa3}{" "}
              <span className={health.sa3 === "ok" ? "dot-ok" : "dot-down"}>●</span>
            </span>
          </div>
          <select
            className="locale-select"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            aria-label="language"
          >
            <option value="zh">中文</option>
            <option value="en">EN</option>
          </select>
        </div>
      </header>

      <section className="hero">
        <p>{t.hero}</p>
        <div className="scene-tabs">
          <button
            type="button"
            className={scene === "game" ? "active" : ""}
            onClick={() => onSceneChange("game")}
          >
            {t.sceneGame}
          </button>
          <button
            type="button"
            className={scene === "vocal" ? "active" : ""}
            onClick={() => onSceneChange("vocal")}
          >
            {t.sceneVocal}
          </button>
        </div>
      </section>

      {workersDown && <OfflineBanner message={t.workerOffline} />}

      <div className="main-grid">
        <div className="col-create">
          <Card>
            <h2>{t.presets}</h2>
            <PresetChips presets={scenePresets} locale={locale} onSelect={applyPreset} />

            <label>
              {t.mode}
              <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.duration}
              <input
                type="number"
                min={5}
                max={240}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </label>
            {showStyle && (
              <label>
                {t.style}
                <input value={styleTags} onChange={(e) => setStyleTags(e.target.value)} />
              </label>
            )}
            {showPrompt && (
              <label>
                {t.prompt}
                <textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                {mode === "game_bgm" && <p className="hint">{t.bgmHint}</p>}
              </label>
            )}
            {showLyrics && (
              <label>
                {t.lyrics}
                <textarea rows={5} value={lyrics} onChange={(e) => setLyrics(e.target.value)} />
              </label>
            )}
            {submitError && (
              <ErrorBanner message={submitError} onRetry={() => void onSubmit()} t={t} />
            )}
            <button
              className="btn-primary"
              disabled={submitting || workersDown || isGenerating}
              onClick={() => void onSubmit()}
            >
              {submitting || isGenerating ? t.generating : t.generate}
            </button>
          </Card>

          <Card>
            <h2>{t.recentWorks}</h2>
            <div className="task-grid">
              {tasks.map((task) => (
                <TaskCard
                  key={task.job_id}
                  task={task}
                  active={task.job_id === activeJobId}
                  onSelect={() => setActiveJobId(task.job_id)}
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="col-output">
          <Card className="output-card">
            <div className="output-head">
              <Badge tone={scene === "game" ? "game" : "vocal"}>{engineLabel(mode, t)}</Badge>
              {health.lmModel && <Badge>{health.lmModel}</Badge>}
            </div>

            <GenerationTimeline
              status={job?.status}
              failed={job?.status === "failed"}
              t={t}
            />
            <p className="status-text">{statusText}</p>

            {isGenerating && <PlayerSkeleton hint={t.mlxHint} />}

            {pollError && job?.status === "failed" && (
              <ErrorBanner
                message={job.error?.message ?? pollError}
                code={job.error?.code}
                onRetry={() => void onSubmit()}
                t={t}
              />
            )}

            {job?.status === "completed" && activeJobId && (
              <AudioPlayer
                src={audioUrl(activeJobId)}
                engine={job.engine || engineLabel(mode, t)}
                durationSec={job.duration_sec}
                latencyMs={job.latency_ms}
                jobId={activeJobId}
                demoMode={demoMode}
                t={t}
              />
            )}

            {!activeJobId && !isGenerating && (
              <p className="hint output-idle">{t.statusIdle}</p>
            )}
          </Card>

          <IntegrationPanel
            form={formSnapshot}
            jobId={activeJobId}
            t={t}
            devMode={devMode}
            pollLog={pollLog}
            apiDocsUrl={apiDocsUrl}
          />

          {workersDown && (
            <Card>
              <h2>{t.samples}</h2>
              <p className="hint">{t.sampleFallback}</p>
              <div className="sample-list">
                {SAMPLES.map((s) => (
                  <div key={s.id} className="sample-item">
                    <Badge>{s.engine}</Badge>
                    <span>{locale === "zh" ? s.labelZh : s.labelEn}</span>
                    <audio controls src={s.url} preload="none" />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <footer className="site-footer">
        <p>{t.footerCompliance}</p>
        <p>
          {t.footerAce} · {t.footerSa3}
        </p>
        <p>
          {t.demoUrl}: <a href={demoUrl}>{demoUrl}</a>
        </p>
      </footer>
    </div>
  );
}
