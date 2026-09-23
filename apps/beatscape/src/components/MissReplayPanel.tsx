import { Link } from "../router";
import { withLibraryReturn } from "../lib/libraryReturn";
import { chartSectionClock, chartSectionLabel } from "../lib/chartSections";
import { MISS_DRILL_REPETITIONS } from "../lib/practiceDrill";
import type { ChartSection, ChartTier, MissEvent } from "../types/chart";

type Props = {
  missEvents: MissEvent[];
  totalMisses?: number;
  sections?: ChartSection[];
  durationMs?: number;
  trackId: string;
  tier: ChartTier;
  libraryReturnHref?: string;
};

function sectionAt(sections: ChartSection[] | undefined, tMs: number): string | null {
  if (!sections?.length) return null;
  const tSec = tMs / 1000;
  for (const s of sections) {
    if (tSec >= s.t0 && tSec < s.t1) return s.id;
  }
  return null;
}

function MissLaneMap({ missEvents, durationMs }: { missEvents: MissEvent[]; durationMs: number }) {
  const span = Math.max(durationMs, ...missEvents.map((m) => m.tMs), 1);
  const lanes = [0, 1, 2, 3] as const;
  return (
    <div className="miss-lane-map" aria-hidden>
      <div className="miss-lane-map-axis">
        <span>0s</span>
        <span>{(span / 1000).toFixed(0)}s</span>
      </div>
      {lanes.map((lane) => (
        <div key={lane} className="miss-lane-row">
          <span className="miss-lane-label">L{lane + 1}</span>
          <div className="miss-lane-track">
            {missEvents
              .filter((m) => m.lane === lane)
              .map((m, i) => (
                <span
                  key={`${m.tMs}-${i}`}
                  className="miss-dot"
                  style={{ left: `${(m.tMs / span) * 100}%` }}
                  title={`${(m.tMs / 1000).toFixed(2)}s`}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MissReplayPanel({
  missEvents,
  totalMisses,
  sections,
  durationMs = 0,
  trackId,
  tier,
  libraryReturnHref = "/library",
}: Props) {
  const reportedMisses = Number.isFinite(totalMisses)
    ? Math.max(0, Math.trunc(totalMisses ?? 0))
    : 0;
  const missCount = Math.max(reportedMisses, missEvents.length);
  if (!missEvents.length) {
    return (
      <details id="miss-review" className="miss-replay">
        <summary>
          {missCount > 0
            ? `Miss review — ${missCount} miss${missCount === 1 ? "" : "es"}`
            : "Miss review — clean run"}
        </summary>
        <p className="miss-replay-empty">
          {missCount > 0
            ? "Detailed miss positions aren't available for this run."
            : "No misses — clean run."}
        </p>
      </details>
    );
  }

  const bySection = new Map<string, number>();
  for (const m of missEvents) {
    const sid = sectionAt(sections, m.tMs) ?? "unknown";
    bySection.set(sid, (bySection.get(sid) ?? 0) + 1);
  }

  return (
    <details id="miss-review" className="miss-replay">
      <summary>Miss review — {missCount} miss{missCount === 1 ? "" : "es"}</summary>
      {missCount > missEvents.length && (
        <p className="miss-replay-empty">
          Showing {missEvents.length} recorded position{missEvents.length === 1 ? "" : "s"}; details for the other {missCount - missEvents.length} {missCount - missEvents.length === 1 ? "miss are" : "misses are"} unavailable.
        </p>
      )}
      <MissLaneMap missEvents={missEvents} durationMs={durationMs} />
      {bySection.size > 0 && (
        <div className="miss-section-stats" aria-label="Practice missed sections">
          {[...bySection.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([id, n]) => {
              const section = sections?.find((item) => item.id === id);
              if (!section) {
                return (
                  <span key={id} className="miss-section-chip">
                    Unknown section · {n}
                  </span>
                );
              }
              const href = withLibraryReturn(
                `/play/${encodeURIComponent(trackId)}?tier=${tier}&mode=practice&seek=${section.t0}&until=${section.t1}&reps=${MISS_DRILL_REPETITIONS}`,
                libraryReturnHref,
              );
              return (
                <Link
                  key={id}
                  className="miss-section-retry"
                  to={href}
                  aria-label={`Drill ${chartSectionLabel(id)} ${MISS_DRILL_REPETITIONS} times from ${chartSectionClock(section.t0)}, ${n} misses`}
                >
                  <span>
                    <strong>{chartSectionLabel(id)}</strong>
                    <small>{n} miss{n === 1 ? "" : "es"} · {chartSectionClock(section.t0)}–{chartSectionClock(section.t1)}</small>
                  </span>
                  <span className="miss-section-retry-action">Drill ×{MISS_DRILL_REPETITIONS} →</span>
                </Link>
              );
            })}
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
