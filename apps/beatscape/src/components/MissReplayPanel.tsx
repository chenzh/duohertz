import type { ChartSection } from "../types/chart";
import type { MissEvent } from "../types/chart";

type Props = {
  missEvents: MissEvent[];
  sections?: ChartSection[];
};

function sectionAt(sections: ChartSection[] | undefined, tMs: number): string | null {
  if (!sections?.length) return null;
  const tSec = tMs / 1000;
  for (const s of sections) {
    if (tSec >= s.t0 && tSec < s.t1) return s.id;
  }
  return null;
}

export function MissReplayPanel({ missEvents, sections }: Props) {
  if (!missEvents.length) {
    return (
      <details className="miss-replay" open>
        <summary>Replay — Miss timeline</summary>
        <p className="miss-replay-empty">No misses — clean run.</p>
      </details>
    );
  }

  const bySection = new Map<string, number>();
  for (const m of missEvents) {
    const sid = sectionAt(sections, m.tMs) ?? "unknown";
    bySection.set(sid, (bySection.get(sid) ?? 0) + 1);
  }

  return (
    <details className="miss-replay" open>
      <summary>Replay — {missEvents.length} miss{missEvents.length === 1 ? "" : "es"}</summary>
      {bySection.size > 0 && (
        <div className="miss-section-stats">
          {[...bySection.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([id, n]) => (
              <span key={id} className="miss-section-chip">
                {id}: {n}
              </span>
            ))}
        </div>
      )}
      <ol className="miss-timeline">
        {missEvents.map((m, i) => (
          <li key={`${m.tMs}-${m.lane}-${i}`}>
            <span className="miss-time">{(m.tMs / 1000).toFixed(2)}s</span>
            <span className="miss-lane">Lane {m.lane + 1}</span>
            {sectionAt(sections, m.tMs) && (
              <span className="miss-section">{sectionAt(sections, m.tMs)}</span>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}
