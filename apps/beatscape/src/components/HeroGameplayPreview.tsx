import { LANE_COLORS } from "../constants/scape";

const LANES = [0, 1, 2, 3] as const;

/** Looping CSS lane preview — no video asset required for Reddit landing. */
export function HeroGameplayPreview() {
  return (
    <div className="hero-gameplay-preview" aria-hidden>
      <div className="hero-gameplay-inner">
        <div className="hero-gameplay-lanes">
          {LANES.map((i) => (
            <div key={i} className="hero-gameplay-lane" style={{ ["--lane-color" as string]: LANE_COLORS[i] }}>
              <span className="hero-note hero-note-a" />
              <span className="hero-note hero-note-b" />
            </div>
          ))}
        </div>
        <div className="hero-gameplay-receptor" />
        <p className="hero-gameplay-caption">PERFECT</p>
      </div>
    </div>
  );
}
