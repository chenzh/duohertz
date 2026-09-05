import { publicAsset } from "./assets";

export type ShowcaseItem = {
  id: string;
  scene: "game" | "vocal";
  mode: string;
  url: string;
  titleZh: string;
  titleEn: string;
  engine: string;
  gradient: [string, string];
  compare?: "ace" | "sa3";
};

export type ShowcaseData = {
  version: number;
  hero: {
    id: string;
    url: string;
    titleZh: string;
    titleEn: string;
    engine: string;
    durationSec: number;
  };
  items: ShowcaseItem[];
};

let cache: ShowcaseData | null = null;
let pending: Promise<ShowcaseData> | null = null;

function isItem(value: unknown): value is ShowcaseItem {
  if (!value || typeof value !== "object") return false;
  const item = value as ShowcaseItem;
  return typeof item.id === "string" && typeof item.url === "string"
    && typeof item.titleZh === "string" && typeof item.titleEn === "string"
    && typeof item.engine === "string" && (item.scene === "game" || item.scene === "vocal")
    && Array.isArray(item.gradient) && item.gradient.length === 2
    && item.gradient.every((color) => typeof color === "string");
}

export function fetchShowcase(): Promise<ShowcaseData> {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;
  pending = (async () => {
    const res = await fetch(publicAsset("showcase/showcase.json"));
    if (!res.ok) throw new Error("showcase load failed");
    const data = await res.json() as ShowcaseData;
    if (!data || typeof data.hero?.url !== "string" || !Array.isArray(data.items) || !data.items.every(isItem)) {
      throw new Error("invalid showcase data");
    }
    cache = {
      ...data,
      hero: { ...data.hero, url: publicAsset(data.hero.url) },
      items: data.items.map((item) => ({ ...item, url: publicAsset(item.url) })),
    };
    return cache;
  })().finally(() => { pending = null; });
  return pending;
}

export function pauseOtherAudio(current: HTMLAudioElement) {
  document.querySelectorAll("audio").forEach((audio) => {
    if (audio !== current && !audio.paused) audio.pause();
  });
}
