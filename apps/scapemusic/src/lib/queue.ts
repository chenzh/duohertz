// Pure playback-queue math — no DOM, no React. Fully unit-tested.

export type RepeatMode = "off" | "all" | "one";

/** Small deterministic PRNG (mulberry32). Same seed → same stream. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a — turn a stable string (e.g. a date) into a PRNG seed. */
export function hashSeed(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Fisher–Yates copy — returns a new shuffled array, input untouched. */
export function shuffled<T>(arr: readonly T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface OrderOptions {
  shuffle: boolean;
  seed: number;
  /** Original index that must end up at play position 0. */
  first?: number;
}

/**
 * Build the play order: a permutation of 0..n-1 (play position → original
 * index). Unshuffled = identity. Shuffled = `first` (when given) up front,
 * the rest Fisher–Yates'd with the seed.
 */
export function buildOrder(n: number, opts: OrderOptions): number[] {
  if (n <= 0) return [];
  if (!opts.shuffle) return Array.from({ length: n }, (_, i) => i);
  const rest: number[] = [];
  for (let i = 0; i < n; i++) if (i !== opts.first) rest.push(i);
  const tail = shuffled(rest, mulberry32(opts.seed));
  return opts.first === undefined ? tail : [opts.first, ...tail];
}

/** Next play position. `null` = stop (end of queue, repeat off). */
export function nextPos(pos: number, len: number, repeat: RepeatMode): number | null {
  if (len <= 0) return null;
  if (pos + 1 < len) return pos + 1;
  return repeat === "off" ? null : 0;
}

/** Previous play position. `null` = already at the start. */
export function prevPos(pos: number, len: number): number | null {
  if (len <= 0) return null;
  return pos - 1 >= 0 ? pos - 1 : null;
}
