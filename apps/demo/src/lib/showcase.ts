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

export async function fetchShowcase(): Promise<ShowcaseData> {
  if (cache) return cache;
  const res = await fetch("/demo/showcase/showcase.json");
  if (!res.ok) throw new Error("showcase load failed");
  cache = (await res.json()) as ShowcaseData;
  return cache;
}
