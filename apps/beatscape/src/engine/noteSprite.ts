/** Shared tap-note diamond sprite for canvas playfield + hero preview. */

/** Fraction of lane width used for tap note diameter (capped by NOTE_MAX_PX). */
export const NOTE_LANE_RATIO = 0.8;
export const NOTE_MAX_PX = 60;
/** Extra scale as the note nears the receptor line. */
export const NOTE_PROXIMITY_GROWTH = 0.22;
/** Hold body width as a fraction of tap note width. */
export const HOLD_BODY_RATIO = 0.58;
export const HOLD_STROKE_RATIO = 0.64;
/** Slide tail diamond scale vs tap head. */
export const SLIDE_TAIL_SCALE = 0.95;

export function noteWidthForLane(laneW: number): number {
  return Math.min(laneW * NOTE_LANE_RATIO, NOTE_MAX_PX);
}

export function makeNoteSprite(color: string, px: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = px;
  c.height = px;
  const g = c.getContext("2d")!;
  const cx = px / 2;
  const cy = px / 2;
  const r = px * 0.34;

  const diamond = (radius: number) => {
    g.beginPath();
    g.moveTo(cx, cy - radius);
    g.lineTo(cx + radius, cy);
    g.lineTo(cx, cy + radius);
    g.lineTo(cx - radius, cy);
    g.closePath();
  };

  diamond(r);
  g.fillStyle = color;
  g.fill();
  g.lineJoin = "miter";
  g.lineWidth = Math.max(2, px * 0.06);
  g.strokeStyle = "#000000";
  g.stroke();

  g.save();
  diamond(r * 0.72);
  g.clip();
  g.fillStyle = "rgba(255,255,255,0.4)";
  g.beginPath();
  g.moveTo(cx - r, cy - r * 0.2);
  g.lineTo(cx + r * 0.15, cy - r);
  g.lineTo(cx - r, cy - r);
  g.closePath();
  g.fill();
  g.restore();

  return c;
}
