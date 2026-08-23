import type { JobStatus } from "../api";
import type { Messages } from "../i18n";
import { cn } from "./ui";

const STEPS: JobStatus[] = ["queued", "routing", "generating", "uploading", "completed"];

const LABEL_KEY: Record<JobStatus, keyof Messages> = {
  queued: "timelineQueued",
  routing: "timelineRouting",
  generating: "timelineGenerating",
  uploading: "timelineUploading",
  completed: "timelineCompleted",
  failed: "timelineFailed",
};

function stepIndex(status: JobStatus | null | undefined): number {
  if (!status || status === "failed") return -1;
  const idx = STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export function GenerationTimeline({
  status,
  failed,
  t,
}: {
  status: JobStatus | null | undefined;
  failed?: boolean;
  t: Messages;
}) {
  const active = failed ? -1 : stepIndex(status);

  return (
    <ol className="timeline" aria-label="generation progress">
      {STEPS.map((step, i) => {
        const done = active > i || (status === "completed" && step === "completed");
        const current = active === i && status !== "completed";
        return (
          <li key={step} className={cn("timeline-step", done && "done", current && "current")}>
            <span className="timeline-dot" />
            <span>{t[LABEL_KEY[step]]}</span>
          </li>
        );
      })}
      {failed && (
        <li className="timeline-step failed current">
          <span className="timeline-dot" />
          <span>{t.timelineFailed}</span>
        </li>
      )}
    </ol>
  );
}

export function PlayerSkeleton({ hint }: { hint: string }) {
  return (
    <div className="player-skeleton" aria-busy="true">
      <div className="skeleton-wave" />
      <p className="hint pulse">{hint}</p>
    </div>
  );
}
