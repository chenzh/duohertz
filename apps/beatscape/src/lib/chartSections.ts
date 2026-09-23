import type { ChartSection } from "../types/chart";

/** Player-facing label shared by setup, gameplay, and results recovery. */
export function chartSectionLabel(id: string): string {
  return id
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Section";
}

/** Compact whole-second clock used on chart-section actions. */
export function chartSectionClock(seconds: number): string {
  const whole = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** Ignore malformed optional metadata without blocking a full-track Practice run. */
export function selectableChartSections(sections: ChartSection[] | undefined): ChartSection[] {
  return (sections ?? []).filter((section) =>
    typeof section.id === "string"
    && Boolean(section.id.trim())
    && Number.isFinite(section.t0)
    && Number.isFinite(section.t1)
    && section.t0 >= 0
    && section.t1 > section.t0,
  );
}
