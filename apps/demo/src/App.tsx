import { useEffect, useMemo, useState } from "react";
import {
  audioUrl,
  createJob,
  fetchHealth,
  fetchInferenceHealth,
  type Mode,
} from "./api";
import { useJobPoll } from "./hooks/useJobPoll";

type TaskItem = { job_id: string; mode: Mode; status: string };

const MODES: { value: Mode; label: string }[] = [
  { value: "vocal_lyrics", label: "人声-歌词" },
  { value: "vocal_desc", label: "人声-描述" },
  { value: "game_bgm", label: "游戏 BGM（无人声）" },
  { value: "game_theme_vocal", label: "游戏主题曲（人声）" },
];

export function App() {
  const [mode, setMode] = useState<Mode>("game_bgm");
  const [duration, setDuration] = useState(90);
  const [prompt, setPrompt] = useState("dark dungeon ambient, tense");
  const [styleTags, setStyleTags] = useState("j-pop, female vocal, emotional");
  const [lyrics, setLyrics] = useState("[Verse]\nTest line one\n[Chorus]\nTest chorus");
  const [submitting, setSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem("demo_tasks") ?? "[]");
    } catch {
      return [];
    }
  });
  const [health, setHealth] = useState({ gateway: "?", ace: "?", sa3: "?" });

  const { job, error, timedOut } = useJobPoll(activeJobId);

  useEffect(() => {
    void (async () => {
      try {
        await fetchHealth();
        const inf = await fetchInferenceHealth();
        setHealth({
          gateway: "ok",
          ace: inf.workers.ace.status,
          sa3: inf.workers.sa3.status,
        });
      } catch {
        setHealth({ gateway: "down", ace: "?", sa3: "?" });
      }
    })();
  }, [job?.status]);

  useEffect(() => {
    sessionStorage.setItem("demo_tasks", JSON.stringify(tasks.slice(0, 10)));
  }, [tasks]);

  const showLyrics = mode === "vocal_lyrics" || mode === "game_theme_vocal";
  const showPrompt = mode !== "vocal_lyrics";
  const showStyle = mode === "vocal_lyrics";

  const statusText = useMemo(() => {
    if (!activeJobId) return "提交任务后开始生成";
    if (timedOut) return "生成时间较长，请稍后在任务列表查看";
    if (error) return error;
    return job?.status ?? "queued";
  }, [activeJobId, job?.status, error, timedOut]);

  async function onSubmit() {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { mode, duration_sec: duration };
      if (showPrompt) body.prompt = prompt;
      if (showStyle) body.style_tags = styleTags;
      if (showLyrics) body.lyrics = lyrics;
      const created = await createJob(body);
      setActiveJobId(created.job_id);
      setTasks((t) => [{ job_id: created.job_id, mode, status: created.status }, ...t].slice(0, 10));
    } catch (e) {
      alert(e instanceof Error ? e.message : "submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app">
      <h1>Local AI Music API · Demo</h1>
      <div className="health">
        <span>Gateway: <span className={health.gateway === "ok" ? "dot-ok" : "dot-down"}>●</span></span>
        <span>ACE: <span className={health.ace === "ok" ? "dot-ok" : "dot-down"}>●</span></span>
        <span>SA3: <span className={health.sa3 === "ok" ? "dot-ok" : "dot-down"}>●</span></span>
      </div>

      <div className="card">
        <label>
          任务类型
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </label>
        <label>
          时长 (秒)
          <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </label>
        {showStyle && (
          <label>
            风格标签
            <input value={styleTags} onChange={(e) => setStyleTags(e.target.value)} />
          </label>
        )}
        {showPrompt && (
          <label>
            描述 / Prompt
            <textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            {mode === "game_bgm" && <p className="hint">BGM 模式：无人声纯音乐</p>}
          </label>
        )}
        {showLyrics && (
          <label>
            歌词
            <textarea rows={5} value={lyrics} onChange={(e) => setLyrics(e.target.value)} />
          </label>
        )}
        <button disabled={submitting} onClick={onSubmit}>
          {submitting ? "正在提交…" : "生成"}
        </button>
      </div>

      <div className="card">
        <p>状态: {statusText}</p>
        {job?.status === "completed" && activeJobId && (
          <>
            <audio controls src={audioUrl(activeJobId)} />
            <p>
              <a href={audioUrl(activeJobId)} download={`${activeJobId}.wav`}>下载 WAV</a>
              {" · job_id: "}{activeJobId}
            </p>
          </>
        )}
        {!activeJobId && <p className="hint">提交任务后开始生成</p>}
      </div>

      <div className="card">
        <h2>最近任务（本页会话，最多 10 条）</h2>
        <ul className="task-list">
          {tasks.map((t) => (
            <li key={t.job_id}>
              <button type="button" onClick={() => setActiveJobId(t.job_id)}>
                {t.mode} — {t.job_id.slice(0, 8)}… ({t.status})
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
