import { LANE_RGB } from "../../constants/scape";

const IDLE_SIZE = 14;
const HELD_SIZE = 16;

export type KeyHintSprite = {
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Center/middle baseline bounds, with one CSS pixel for antialiasing. */
export function keyHintTextBounds(metrics: TextMetrics, fontSize: number) {
  const value = (measured: number, fallback: number) => Number.isFinite(measured) ? measured : fallback;
  const left = value(metrics.actualBoundingBoxLeft, metrics.width / 2);
  const right = value(metrics.actualBoundingBoxRight, metrics.width / 2);
  const ascent = value(metrics.actualBoundingBoxAscent, fontSize);
  const descent = value(metrics.actualBoundingBoxDescent, fontSize);
  return { x: -left - 1, y: -ascent - 1,
    width: Math.max(1, left + right + 2), height: Math.max(1, ascent + descent + 2) };
}

/** Eight renderer-local images: four actual bindings, each idle and held. */
export class KeyHintSprites {
  private readonly labels: string[];
  private readonly entries: KeyHintSprite[] = [];
  private dpr = 0;
  private disposed = false;
  private fontVersion = 0;
  private stopObservingFonts?: () => void;

  constructor(labels: readonly string[], private readonly makeCanvas = () => document.createElement("canvas")) {
    this.labels = Array.from({ length: 4 }, (_, lane) => labels[lane] ?? "");
  }

  /** Uncompressed RGBA surface estimate; excludes browser texture overhead. */
  get estimatedBytes(): number {
    return this.entries.reduce((bytes, sprite) => bytes + sprite.canvas.width * sprite.canvas.height * 4, 0);
  }

  /** Prepares both sizes before gameplay; dimensions alone do not invalidate text. */
  prepare(dpr: number): void {
    if (this.disposed || (this.dpr === dpr && this.entries.length === 8)) return;
    this.clear();
    this.dpr = dpr;
    for (let lane = 0; lane < 4; lane++) {
      this.entries.push(this.rasterize(lane, false), this.rasterize(lane, true));
    }
  }

  get(lane: number, held: boolean): KeyHintSprite | undefined {
    return this.entries[lane * 2 + Number(held)];
  }

  /** Refresh fallback glyphs when this font finishes, without unrelated rebuilds. */
  observeFonts(fonts: FontFaceSet): void {
    if (this.disposed) return;
    this.stopObservingFonts?.();
    this.fontVersion++;
    const isHintFont = (font: FontFace) => font.family.replace(/["']/g, "").trim().toLowerCase() === "ibm plex sans";
    const refresh = () => {
      if (this.disposed) return;
      this.fontVersion++;
      this.clear();
      if (this.dpr > 0) this.prepare(this.dpr);
    };
    const onLoaded = (event: FontFaceSetLoadEvent) => {
      if (event.fontfaces.some(isHintFont)) refresh();
    };
    fonts.addEventListener("loadingdone", onLoaded);
    this.stopObservingFonts = () => fonts.removeEventListener("loadingdone", onLoaded);
    // A loadingdone callback already rebuilds these images. Avoid rebuilding
    // twice when that same pending FontFaceSet.ready promise resolves.
    if ([...fonts].some(font => isHintFont(font) && font.status === "loading")) {
      const pendingVersion = this.fontVersion;
      void fonts.ready.then(() => {
        if (this.fontVersion === pendingVersion) refresh();
      });
    }
  }

  dispose(): void {
    this.disposed = true;
    this.stopObservingFonts?.();
    this.stopObservingFonts = undefined;
    this.clear();
  }

  private rasterize(lane: number, held: boolean): KeyHintSprite {
    const canvas = this.makeCanvas();
    const context = canvas.getContext("2d")!;
    const fontSize = held ? HELD_SIZE : IDLE_SIZE;
    const font = `700 ${fontSize}px 'IBM Plex Sans', sans-serif`;
    context.font = font;
    context.textAlign = "center";
    context.textBaseline = "middle";
    const text = this.labels[lane]!;
    const bounds = keyHintTextBounds(context.measureText(text), fontSize);
    canvas.width = Math.ceil(bounds.width * this.dpr);
    canvas.height = Math.ceil(bounds.height * this.dpr);
    context.setTransform(this.dpr, 0, 0, this.dpr, -bounds.x * this.dpr, -bounds.y * this.dpr);
    context.font = font;
    context.textAlign = "center";
    context.textBaseline = "middle";
    const [r, g, b] = LANE_RGB[lane]!;
    context.fillStyle = held ? "#12100F" : `rgb(${r},${g},${b})`;
    context.fillText(text, 0, 0);
    return { canvas, x: bounds.x, y: bounds.y,
      width: canvas.width / this.dpr, height: canvas.height / this.dpr };
  }

  private clear(): void {
    for (const sprite of this.entries) sprite.canvas.width = sprite.canvas.height = 0;
    this.entries.length = 0;
  }
}
