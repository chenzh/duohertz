import type { Mode } from "../api";
import type { Messages } from "../i18n";
import type { TaskItem } from "./TaskCard";
import { Badge } from "./ui";

const GRADIENTS: Record<string, [string, string]> = {
  game_bgm: ["#7c3aed", "#2563eb"],
  vocal_lyrics: ["#db2777", "#f97316"],
  vocal_desc: ["#f59e0b", "#ef4444"],
  game_theme_vocal: ["#6366f1", "#db2777"],
};

export function WorkGridCard({
  task,
  active,
  onSelect,
  t,
}: {
  task: TaskItem;
  active: boolean;
  onSelect: () => void;
  t: Messages;
}) {
  const grad = GRADIENTS[task.mode] ?? ["#4b5563", "#1f2937"];
  const engine = task.mode === "game_bgm" ? t.engineSa3 : t.engineAce;
  return (
    <button
      type="button"
      className={`work-grid-card${active ? " active" : ""}`}
      onClick={onSelect}
      data-testid="work-grid-card"
    >
      <div
        className="work-cover"
        style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}
      />
      <div className="work-meta">
        <Badge tone={task.mode === "game_bgm" ? "game" : "vocal"}>{engine}</Badge>
        <span className="work-mode">{task.mode}</span>
        <span className={`work-status status-${task.status}`}>{task.status}</span>
      </div>
    </button>
  );
}

export function EngineCompare({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="engine-compare glass" data-testid="engine-compare">
      <h3>{locale === "zh" ? "双引擎对比" : "Engine comparison"}</h3>
      <div className="compare-row">
        <div>
          <strong>ACE-Step 1.5</strong>
          <audio controls src="/demo/showcase/vocal-jpop.wav" preload="none" />
        </div>
        <div>
          <strong>Stable Audio 3</strong>
          <audio controls src="/demo/showcase/bgm-dungeon.wav" preload="none" />
        </div>
      </div>
    </div>
  );
}

export const PROMPT_TAGS = [
  "ambient",
  "orchestral",
  "no vocals",
  "tense",
  "peaceful",
  "epic",
] as const;

export const LYRIC_TEMPLATES = {
  verseChorus: "[Verse]\n\n[Chorus]\n",
} as const;

export type { Mode };
