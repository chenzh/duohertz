import type { TrackVibe } from "../types/catalog";
import { VIBE_LABELS } from "../catalog/trackVibe";

type Props = {
  vibe: TrackVibe;
  className?: string;
};

export function VibeBadge({ vibe, className = "" }: Props) {
  return (
    <span className={`vibe-badge vibe-${vibe} ${className}`.trim()} title={VIBE_LABELS[vibe]}>
      {VIBE_LABELS[vibe]}
    </span>
  );
}
