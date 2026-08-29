import type { TrackVibe } from "../types/catalog";

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
