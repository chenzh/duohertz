import { useEffect, useState } from "react";
import {
  audioUrl,
  createJob,
  type Mode,
} from "../api";
import { OfflineBanner, ErrorBanner } from "../components/Banners";
import { AudioPlayer } from "../components/AudioPlayer";
import { FormStepper } from "../components/FormStepper";
import { IntegrationPanel } from "../components/IntegrationPanel";
import { PresetChips } from "../components/PresetChips";
import { GenerationTimeline, PlayerSkeleton } from "../components/Timeline";
import { type TaskItem } from "../components/TaskCard";
import { EngineCompare, LYRIC_TEMPLATES, PROMPT_TAGS, WorkGridCard } from "../components/WorkGrid";
import { Badge, Card } from "../components/ui";
import type { Messages } from "../i18n";
import type { Locale } from "../i18n";
import { useInferenceHealth } from "../hooks/useInferenceHealth";
import { useJobPoll } from "../hooks/useJobPoll";
import { PRESETS, SAMPLES, type Preset, type Scene } from "../presets";
import { publicAsset } from "../lib/assets";
import { buildJobPayload } from "../lib/integrationSnippets";
import { readStoredJson, writeStoredJson } from "../lib/storage";

const MODES: { value: Mode; zh: string; en: string }[] = [
  { value: "vocal_lyrics", zh: "人声-歌词", en: "Vocals from lyrics" },
  { value: "vocal_desc", zh: "人声-描述", en: "Vocals from prompt" },
  { value: "game_bgm", zh: "游戏 BGM", en: "Game BGM" },
  { value: "game_theme_vocal", zh: "主题曲", en: "Game theme song" },
];

const DRAFT_KEY = "demo_form_draft_v3";

type Draft = {
  scene: Scene;
  mode: Mode;
  duration: number;
  prompt: string;
  styleTags: string;
  lyrics: string;
};

const DEFAULT_DRAFT: Draft = {
  scene: "game",
  mode: "game_bgm",
  duration: 60,
  prompt: "dark dungeon ambient, tense, no vocals, instrumental",
  styleTags: "j-pop, female vocal, emotional",
  lyrics: "[Verse]\n星が降る夜に\n[Chorus]\nHello tonight",
};

function isDraft(value: unknown): value is Draft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Draft;
  return (draft.scene === "game" || draft.scene === "vocal")
    && MODES.some((mode) => mode.value === draft.mode)
    && Number.isFinite(draft.duration)
    && typeof draft.prompt === "string"
    && typeof draft.styleTags === "string"
    && typeof draft.lyrics === "string";
}

function isTaskList(value: unknown): value is TaskItem[] {
  return Array.isArray(value) && value.every((item) => item && typeof item === "object"
    && typeof item.job_id === "string"
    && MODES.some((mode) => mode.value === item.mode)
    && typeof item.status === "string"
    && typeof item.created_at === "string");
}

function engineLabel(mode: Mode, t: Messages) {
  return mode === "game_bgm" ? t.engineSa3 : t.engineAce;
}

export function PlaygroundSection({
  locale,
  t,
  demoMode,
  devMode,
  presentMode,
  deepLinkJobId,
  apiDocsUrl,
}: {
  locale: Locale;
  t: Messages;
  demoMode: boolean;
  devMode: boolean;
  presentMode: boolean;
  deepLinkJobId: string | null;
  apiDocsUrl: string;
}) {
  const [initialDraft] = useState(() => readStoredJson(DRAFT_KEY, DEFAULT_DRAFT, isDraft));
  const [scene, setScene] = useState<Scene>(initialDraft.scene);
  const [mode, setMode] = useState<Mode>(initialDraft.mode);
  const [duration, setDuration] = useState(initialDraft.duration);
  const [prompt, setPrompt] = useState(initialDraft.prompt);
  const [styleTags, setStyleTags] = useState(initialDraft.styleTags);
  const [lyrics, setLyrics] = useState(initialDraft.lyrics);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [advanced, setAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(deepLinkJobId);
  const [elapsed, setElapsed] = useState(0);
  const [tasks, setTasks] = useState<TaskItem[]>(() =>
    readStoredJson("demo_tasks_v2", [], isTaskList, "session").slice(0, 20));

  const health = useInferenceHealth();
  const { job, error: pollError, timedOut, pollLog, refresh: refreshJob } = useJobPoll(activeJobId);
  const scenePresets = PRESETS.filter((preset) => preset.scene === scene);
  const workersDown = health.gateway !== "ok" || !health.workersOk;
  const isGenerating = !!activeJobId && !timedOut && job?.status !== "completed" && job?.status !== "failed";

  useEffect(() => {
    const draft: Draft = { scene, mode, duration, prompt, styleTags, lyrics };
    writeStoredJson(DRAFT_KEY, draft);
  }, [scene, mode, duration, prompt, styleTags, lyrics]);

  useEffect(() => {
    writeStoredJson("demo_tasks_v2", tasks.slice(0, 20), "session");
  }, [tasks]);

  useEffect(() => {
    if (!job?.job_id) return;
    setTasks((prev) => {
      if (prev.some((item) => item.job_id === job.job_id)) {
        return prev.map((item) => item.job_id === job.job_id ? { ...item, status: job.status } : item);
      }
      return [{ job_id: job.job_id, mode: job.mode, status: job.status, created_at: new Date().toISOString() }, ...prev].slice(0, 20);
    });
    if (job.status === "completed") console.info("demo_job_completed", job.job_id);
  }, [job?.job_id, job?.status]);

  useEffect(() => {
    if (deepLinkJobId) setActiveJobId(deepLinkJobId);
  }, [deepLinkJobId]);

  useEffect(() => {
    if (!demoMode || scenePresets.length === 0) return;
    applyPreset(scenePresets[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]);

  useEffect(() => {
    if (!isGenerating) return;
    const t0 = Date.now();
    setElapsed(0);
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, [activeJobId, isGenerating]);

  const showLyrics = mode === "vocal_lyrics" || mode === "game_theme_vocal";
  const showPrompt = mode !== "vocal_lyrics";
  const showStyle = mode === "vocal_lyrics";
  const minDuration = mode === "game_bgm" ? 15 : 30;
  const maxDuration = mode === "game_bgm" ? 180 : 240;

  function applyPreset(preset: Preset) {
    setScene(preset.scene);
    setMode(preset.mode);
    setDuration(preset.duration_sec);
    if (preset.prompt) setPrompt(preset.prompt);
    if (preset.style_tags) setStyleTags(preset.style_tags);
    if (preset.lyrics) setLyrics(preset.lyrics);
    setSubmitError(null);
    setStep(2);
  }

  function onSceneChange(next: Scene) {
    setScene(next);
    const first = PRESETS.find((p) => p.scene === next);
    if (first) applyPreset(first);
    else setStep(1);
  }

  async function onSubmit() {
    if (workersDown || submitting || isGenerating) return;
    if (!Number.isInteger(duration) || duration < minDuration || duration > maxDuration) {
      setSubmitError(locale === "zh"
        ? `请输入 ${minDuration}–${maxDuration} 秒之间的整数时长。`
        : `Enter a whole number between ${minDuration} and ${maxDuration} seconds.`);
      return;
    }
    const missingInput = mode === "vocal_lyrics"
      ? !styleTags.trim() || !lyrics.trim()
      : mode === "game_theme_vocal"
        ? !prompt.trim() && !lyrics.trim()
        : !prompt.trim();
    if (missingInput) {
      setSubmitError(locale === "zh" ? "请填写当前模式所需的描述、风格或歌词。" : "Add the prompt, style or lyrics required for this mode.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const body = buildJobPayload({ mode, duration_sec: duration, prompt, style_tags: styleTags, lyrics });
      const created = await createJob(body);
      setActiveJobId(created.job_id);
      setElapsed(0);
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
    if (!activeJobId) return t.statusIdleEmpty;
    if (timedOut) return t.statusTimeout;
    if (pollError) return pollError;
    if (isGenerating) {
      const base = mode === "game_bgm" ? t.bgmMlxHint : t.mlxHint;
      return `${base} · ${t.waited} ${elapsed}s`;
    }
    return job?.status ?? "queued";
  })();

  const formSnapshot = { mode, duration_sec: duration, prompt, style_tags: styleTags, lyrics };
  const showFormFields = advanced || step >= 2;

  return (
    <section
      id="playground"
      className={`section playground-section scene-${scene}${demoMode ? " demo-mode" : ""}${presentMode ? " present-embed" : ""}`}
      data-testid="playground-section"
    >
      <h2>{t.playgroundTitle}</h2>
      <p className="section-lead">{t.playgroundLead}</p>

      <div className="scene-tabs">
        <button type="button" className={scene === "game" ? "active" : ""} onClick={() => onSceneChange("game")}>
          {t.sceneGame}
        </button>
        <button type="button" className={scene === "vocal" ? "active" : ""} onClick={() => onSceneChange("vocal")}>
          {t.sceneVocal}
        </button>
      </div>

      {workersDown && <OfflineBanner message={t.workerOffline} />}

      <div className="main-grid">
        <div className="col-create">
          <Card>
            <FormStepper step={step} setStep={setStep} t={t} advanced={advanced} setAdvanced={setAdvanced} />

            {(step === 1 || advanced) && (
              <>
                <h3>{t.presets}</h3>
                <PresetChips presets={scenePresets} locale={locale} onSelect={applyPreset} />
              </>
            )}

            {showFormFields && (
              <>
                <label>
                  {t.mode}
                  <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                    {MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m[locale]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t.duration}
                  <input
                    type="number"
                    min={minDuration}
                    max={maxDuration}
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
                    <div className="tag-chips">
                      {PROMPT_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className="tag-chip"
                          onClick={() => setPrompt((p) => (p ? `${p}, ${tag}` : tag))}
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                    {mode === "game_bgm" && <p className="hint">{t.bgmHint}</p>}
                  </label>
                )}
                {showLyrics && (
                  <label>
                    {t.lyrics}
                    <textarea rows={5} value={lyrics} onChange={(e) => setLyrics(e.target.value)} />
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setLyrics((l) => l + LYRIC_TEMPLATES.verseChorus)}
                    >
                      {t.insertLyricTemplate}
                    </button>
                  </label>
                )}
              </>
            )}

            {submitError && <ErrorBanner message={submitError} onRetry={() => void onSubmit()} t={t} />}

            {(step === 3 || advanced) && (
              <button
                className="btn-primary"
                data-testid="generate-btn"
                disabled={submitting || workersDown || isGenerating}
                onClick={() => void onSubmit()}
              >
                {submitting || isGenerating ? t.generating : t.generate}
              </button>
            )}
            {step < 3 && !advanced && (
              <button type="button" className="btn-secondary" onClick={() => setStep((step + 1) as 1 | 2 | 3)}>
                {t.stepNext}
              </button>
            )}
          </Card>

          <Card>
            <h2>{t.recentWorks}</h2>
            <div className="work-grid">
              {tasks.map((task) => (
                <WorkGridCard
                  key={task.job_id}
                  task={task}
                  active={task.job_id === activeJobId}
                  onSelect={() => setActiveJobId(task.job_id)}
                  t={t}
                />
              ))}
            </div>
          </Card>

          <EngineCompare locale={locale} />
        </div>

        <div className="col-output">
          <Card className="output-card">
            <div className="output-head">
              <Badge tone={(job?.mode ?? mode) === "game_bgm" ? "game" : "vocal"}>{engineLabel(job?.mode ?? mode, t)}</Badge>
              {health.lmModel && <Badge>{health.lmModel}</Badge>}
            </div>

            <GenerationTimeline status={job?.status} failed={job?.status === "failed"} t={t} />
            <p className="status-text">{statusText}</p>

            {timedOut && (
              <button type="button" className="btn-secondary" onClick={refreshJob}>
                {locale === "zh" ? "刷新任务状态" : "Refresh task status"}
              </button>
            )}

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
                presentMode={presentMode}
                t={t}
              />
            )}

            {!activeJobId && !isGenerating && (
              <div className="output-empty" data-testid="output-empty">
                <div className="output-empty-art" />
                <p className="hint">{t.statusIdleEmpty}</p>
              </div>
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
                    <audio controls src={publicAsset(s.url)} preload="none" />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
