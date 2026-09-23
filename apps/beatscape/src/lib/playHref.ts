import type { ChartTier, PlayMode } from "../types/chart";

const CHART_TIERS: readonly ChartTier[] = ["easy", "standard", "hard"];
const PLAY_MODES: readonly PlayMode[] = ["casual", "arcade", "practice"];

export function chartTierFromParam(value: string | null | undefined): ChartTier | null {
  return CHART_TIERS.find((tier) => tier === value) ?? null;
}

export function playModeFromParam(value: string | null | undefined): PlayMode | null {
  return PLAY_MODES.find((mode) => mode === value) ?? null;
}

/** Canonical /play deep link — one place so home, library and story agree. */
export function playHref(trackId: string, tier: ChartTier = "easy", mode: PlayMode = "casual"): string {
  return `/play/${trackId}?tier=${tier}&mode=${mode}`;
}

/** Track configuration deep link used when a known run returns to setup. */
export function trackSetupHref(
  trackId: string,
  tier: ChartTier,
  mode: PlayMode,
  practiceRange?: { seek?: number; until?: number },
): string {
  const params = new URLSearchParams({ tier, mode });
  const seek = practiceRange?.seek;
  const until = practiceRange?.until;
  if (
    mode === "practice"
    && seek !== undefined
    && until !== undefined
    && Number.isFinite(seek)
    && Number.isFinite(until)
    && seek >= 0
    && until > seek
  ) {
    params.set("seek", String(seek));
    params.set("until", String(until));
  }
  return `/track/${trackId}?${params.toString()}`;
}
