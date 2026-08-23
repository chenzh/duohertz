import type { Mode } from "../api";
import type { JobStatus } from "../api";
import { Badge } from "./ui";

const MODE_LABEL: Record<Mode, string> = {
  vocal_lyrics: "人声-歌词",
  vocal_desc: "人声-描述",
  game_bgm: "游戏 BGM",
  game_theme_vocal: "主题曲",
};

export type TaskItem = {
  job_id: string;
  mode: Mode;
  status: JobStatus | string;
  created_at: string;
};

export function TaskCard({
  task,
  active,
  onSelect,
}: {
  task: TaskItem;
  active: boolean;
  onSelect: () => void;
}) {
  const tone =
    task.status === "completed" ? "ok" : task.status === "failed" ? "warn" : "default";

  return (
    <button
      type="button"
      className={`task-card${active ? " active" : ""}`}
      onClick={onSelect}
    >
      <div className="task-card-head">
        <Badge tone={task.mode.startsWith("game") ? "game" : "vocal"}>
          {MODE_LABEL[task.mode]}
        </Badge>
        <Badge tone={tone}>{task.status}</Badge>
      </div>
      <span className="task-card-id">{task.job_id.slice(0, 8)}…</span>
    </button>
  );
}
