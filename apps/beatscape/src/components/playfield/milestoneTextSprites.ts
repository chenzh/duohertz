export const MILESTONE_MAX_SCALE = 1.4;
export const MILESTONE_FONT = "400 48px Anton, 'Sora', sans-serif";
const OUTLINE_WIDTH = 10;
const MAX_ENTRIES = 8;

export type MilestoneTextSprite = {
  stroke: HTMLCanvasElement;
  fill: HTMLCanvasElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rasterScale: number;
};

/** Bounds around the centered text baseline, including round-stroke and AA. */
export function milestoneTextBounds(metrics: TextMetrics) {
  const value = (measured: number, fallback: number) => Number.isFinite(measured) ? measured : fallback;
  const left = value(metrics.actualBoundingBoxLeft, metrics.width / 2);
  const right = value(metrics.actualBoundingBoxRight, metrics.width / 2);
  const ascent = value(metrics.actualBoundingBoxAscent, 48);
  const descent = value(metrics.actualBoundingBoxDescent, 12);
  const padding = OUTLINE_WIDTH / 2 + 1;
  return { x: -left - padding, y: -ascent - padding,
    width: Math.max(1, left + right + 2 * padding), height: Math.max(1, ascent + descent + 2 * padding) };
}

/**
 * Bounded renderer-local cache. Stroke and fill remain separate so applying
 * the original alpha to each draw preserves their two-stage compositing.
 */
export class MilestoneTextSprites {
  private readonly entries = new Map<string, MilestoneTextSprite>();

  constructor(private readonly makeCanvas = () => document.createElement("canvas")) {}

  /** Uncompressed RGBA surface estimate; excludes browser texture overhead. */
  get estimatedBytes(): number {
    let bytes = 0;
    for (const sprite of this.entries.values()) {
      bytes += (sprite.stroke.width * sprite.stroke.height + sprite.fill.width * sprite.fill.height) * 4;
    }
    return bytes;
  }

  get(text: string, dpr: number, baseline: CanvasTextBaseline = "alphabetic"): MilestoneTextSprite {
    const key = `${dpr}:${baseline}:${text}`;
    const cached = this.entries.get(key);
    if (cached) return cached;
    const rasterScale = Math.max(1, dpr) * MILESTONE_MAX_SCALE;
    const stroke = this.makeCanvas();
    const fill = this.makeCanvas();
    const strokeContext = stroke.getContext("2d")!;
    strokeContext.font = MILESTONE_FONT;
    strokeContext.textAlign = "center";
    strokeContext.textBaseline = baseline;
    const bounds = milestoneTextBounds(strokeContext.measureText(text));
    const width = Math.ceil(bounds.width * rasterScale);
    const height = Math.ceil(bounds.height * rasterScale);
    for (const canvas of [stroke, fill]) {
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d")!;
      context.setTransform(rasterScale, 0, 0, rasterScale, -bounds.x * rasterScale, -bounds.y * rasterScale);
      context.font = MILESTONE_FONT;
      context.textAlign = "center";
      context.textBaseline = baseline;
      context.lineJoin = "round";
      context.lineWidth = OUTLINE_WIDTH;
    }
    strokeContext.strokeStyle = "#000000";
    strokeContext.strokeText(text, 0, 0);
    const fillContext = fill.getContext("2d")!;
    fillContext.fillStyle = "#FFB020";
    fillContext.fillText(text, 0, 0);
    const sprite = { stroke, fill, x: bounds.x, y: bounds.y,
      width: width / rasterScale, height: height / rasterScale, rasterScale };
    if (this.entries.size >= MAX_ENTRIES) {
      const oldest = this.entries.entries().next().value!;
      this.release(oldest[1]);
      this.entries.delete(oldest[0]);
    }
    this.entries.set(key, sprite);
    return sprite;
  }

  clear(): void {
    for (const sprite of this.entries.values()) this.release(sprite);
    this.entries.clear();
  }

  private release(sprite: MilestoneTextSprite) {
    sprite.stroke.width = sprite.stroke.height = 0;
    sprite.fill.width = sprite.fill.height = 0;
  }
}
