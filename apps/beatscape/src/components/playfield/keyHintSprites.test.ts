import { describe, expect, it } from "vitest";
import { LANE_RGB } from "../../constants/scape";
import { KeyHintSprites, keyHintTextBounds } from "./keyHintSprites";

const ARROWS = ["←", "↓", "↑", "→"];

function harness(labels = ARROWS) {
  const canvases: Array<HTMLCanvasElement & { calls: Array<unknown[]> }> = [];
  let widthFactor = 0.5;
  const makeCanvas = () => {
    const calls: Array<unknown[]> = [];
    const context = {
      font: "", textAlign: "", textBaseline: "", fillStyle: "",
      measureText(text: string) {
        calls.push(["measure", text]);
        const size = Number(this.font.match(/(\d+)px/)![1]);
        const width = text.length * size * widthFactor;
        return { width, actualBoundingBoxLeft: width * 0.55, actualBoundingBoxRight: width * 0.45,
          actualBoundingBoxAscent: size * 0.4, actualBoundingBoxDescent: size * 0.3 } as TextMetrics;
      },
      setTransform: (...args: number[]) => calls.push(["transform", ...args]),
      fillText: (...args: unknown[]) => calls.push(["fill", ...args]),
    };
    const canvas = { width: 0, height: 0, calls, getContext: () => context } as unknown as typeof canvases[number];
    canvases.push(canvas);
    return canvas;
  };
  return { cache: new KeyHintSprites(labels, makeCanvas), canvases,
    setWidthFactor: (next: number) => { widthFactor = next; } };
}

function fontSet(families: Array<[string, FontFaceLoadStatus]>) {
  const faces = families.map(([family, status]) => ({ family, status }) as FontFace);
  const listeners = new Set<(event: FontFaceSetLoadEvent) => void>();
  let resolveReady!: () => void;
  let readyReads = 0;
  const ready = new Promise<void>(resolve => { resolveReady = resolve; });
  const fonts = {
    [Symbol.iterator]: () => faces[Symbol.iterator](),
    addEventListener: (_type: string, listener: (event: FontFaceSetLoadEvent) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: FontFaceSetLoadEvent) => void) => listeners.delete(listener),
    get ready() { readyReads++; return ready; },
  } as unknown as FontFaceSet;
  return { fonts, listeners, resolveReady, get readyReads() { return readyReads; },
    loaded: (family: string) => {
      const event = { fontfaces: [{ family, status: "loaded" }] } as unknown as FontFaceSetLoadEvent;
      for (const listener of listeners) listener(event);
    } };
}

describe("key hint sprites", () => {
  it("preserves centered middle-baseline overhangs and long labels instead of clipping to the keycap", () => {
    expect(keyHintTextBounds({ width: 80, actualBoundingBoxLeft: 43, actualBoundingBoxRight: 39,
      actualBoundingBoxAscent: -1, actualBoundingBoxDescent: 12 } as TextMetrics, 14))
      .toEqual({ x: -44, y: 0, width: 84, height: 13 });
    expect(keyHintTextBounds({ width: 80 } as TextMetrics, 14))
      .toEqual({ x: -41, y: -15, width: 82, height: 30 });
    const { cache } = harness(["NumpadAdd", "Space", "[", ";"]);
    cache.prepare(2);
    expect(cache.get(0, true)!.width).toBeGreaterThan(46);
  });

  it("prepares exactly four idle/held labels with unchanged sizes, lane colors and baseline", () => {
    const { cache, canvases } = harness();
    cache.prepare(2);
    expect(canvases).toHaveLength(8);
    for (let lane = 0; lane < 4; lane++) {
      for (const held of [false, true]) {
        const sprite = cache.get(lane, held)!;
        const canvas = canvases[lane * 2 + Number(held)]!;
        expect(sprite.canvas).toBe(canvas);
        expect(canvas.getContext("2d")).toMatchObject({ textAlign: "center", textBaseline: "middle",
          font: `700 ${held ? 16 : 14}px 'IBM Plex Sans', sans-serif`,
          fillStyle: held ? "#12100F" : `rgb(${LANE_RGB[lane]!.join(",")})` });
        expect(canvas.calls.filter(call => call[0] === "fill")).toEqual([["fill", ARROWS[lane], 0, 0]]);
        expect(canvas.calls).toContainEqual(["transform", 2, 0, 0, 2, -sprite.x * 2, -sprite.y * 2]);
        expect(sprite.width * 2).toBe(canvas.width);
        expect(sprite.height * 2).toBe(canvas.height);
      }
    }
  });

  it("reuses every prepared frame, replaces all eight at a new DPR and releases their surfaces", () => {
    const { cache, canvases } = harness();
    expect(cache.estimatedBytes).toBe(0);
    cache.prepare(1);
    const original = cache.get(0, false)!;
    for (let frame = 0; frame < 100; frame++) {
      cache.prepare(1);
      expect(cache.get(0, false)).toBe(original);
    }
    expect(canvases).toHaveLength(8);
    cache.prepare(2);
    expect(canvases).toHaveLength(16);
    expect(canvases.slice(0, 8).every(canvas => canvas.width === 0 && canvas.height === 0)).toBe(true);
    expect(cache.get(0, false)).not.toBe(original);
    expect(cache.estimatedBytes).toBe(canvases.slice(8).reduce((bytes, canvas) => bytes + canvas.width * canvas.height * 4, 0));
    cache.dispose();
    expect(cache.estimatedBytes).toBe(0);
    expect(canvases.every(canvas => canvas.width === 0 && canvas.height === 0)).toBe(true);
    cache.prepare(2);
    expect(canvases).toHaveLength(16);
    expect(cache.get(0, false)).toBeUndefined();
  });

  it("keeps each player's actual labels separate and snapshots the renderer's bindings", () => {
    const labels = [...ARROWS];
    const first = harness(labels);
    const second = harness(["A", "S", "W", "D"]);
    labels[0] = "changed later";
    first.cache.prepare(1);
    second.cache.prepare(1);
    expect(first.canvases[0]!.calls).toContainEqual(["fill", "←", 0, 0]);
    expect(second.canvases[0]!.calls).toContainEqual(["fill", "A", 0, 0]);
    first.cache.dispose();
    expect(second.cache.estimatedBytes).toBeGreaterThan(0);
    expect(second.canvases).toHaveLength(8);
  });

  it("re-measures loaded IBM Plex Sans once, ignoring unrelated font events and the same ready completion", async () => {
    const { cache, canvases, setWidthFactor } = harness();
    const fonts = fontSet([["'IBM Plex Sans'", "loading"], ["Anton", "loading"]]);
    cache.prepare(2);
    const fallback = cache.get(0, false)!;
    cache.observeFonts(fonts.fonts);
    fonts.loaded("Anton");
    expect(cache.get(0, false)).toBe(fallback);
    setWidthFactor(0.8);
    fonts.loaded('"IBM Plex Sans"');
    const loaded = cache.get(0, false)!;
    expect(loaded.width).toBeGreaterThan(fallback.width);
    expect(fallback.canvas.width).toBe(0);
    expect(canvases).toHaveLength(16);
    fonts.resolveReady();
    await Promise.resolve();
    expect(canvases).toHaveLength(16);
    expect(cache.get(0, false)).toBe(loaded);
    expect(fonts.readyReads).toBe(1);
  });

  it("refreshes an already pending font through ready without waiting for another load event", async () => {
    const { cache, canvases } = harness();
    const fonts = fontSet([["IBM Plex Sans", "loading"]]);
    cache.prepare(1);
    const fallback = cache.get(0, false);
    cache.observeFonts(fonts.fonts);
    fonts.resolveReady();
    await Promise.resolve();
    expect(cache.get(0, false)).not.toBe(fallback);
    expect(canvases).toHaveLength(16);
    const unrelated = fontSet([["Anton", "loading"]]);
    cache.observeFonts(unrelated.fonts);
    expect(fonts.listeners.size).toBe(0);
    expect(unrelated.readyReads).toBe(0);
  });

  it("detaches font listeners and cannot resurrect disposed images from a pending ready promise", async () => {
    const { cache, canvases } = harness();
    const fonts = fontSet([["IBM Plex Sans", "loading"]]);
    cache.prepare(2);
    cache.observeFonts(fonts.fonts);
    expect(fonts.listeners.size).toBe(1);
    cache.dispose();
    expect(fonts.listeners.size).toBe(0);
    fonts.loaded("IBM Plex Sans");
    fonts.resolveReady();
    await Promise.resolve();
    expect(canvases).toHaveLength(8);
    expect(cache.estimatedBytes).toBe(0);
    cache.observeFonts(fonts.fonts);
    expect(fonts.listeners.size).toBe(0);
  });
});
