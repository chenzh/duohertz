import type { ChartTier, SessionChart } from "../types/chart";

const SESSION_KEY = "neonbeat_sessions_v1";
const MAX_SESSIONS = 10;

type Store = Record<string, SessionChart>;

function loadStore(): Store {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function saveStore(store: Store) {
  const ids = Object.keys(store).sort(
    (a, b) => store[b].createdAt - store[a].createdAt,
  );
  const trimmed: Store = {};
  for (const id of ids.slice(0, MAX_SESSIONS)) trimmed[id] = store[id];
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(trimmed));
}

export function saveSession(chart: SessionChart): void {
  const store = loadStore();
  store[chart.id] = chart;
  saveStore(store);
}

export function getSession(id: string): SessionChart | undefined {
  return loadStore()[id];
}

export function listSessions(): SessionChart[] {
  return Object.values(loadStore()).sort((a, b) => b.createdAt - a.createdAt);
}

export function newSessionId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function serializeSharePayload(chart: SessionChart, tier: ChartTier): string {
  const payload = {
    id: chart.id,
    tier,
    presetId: chart.presetId,
    title: chart.charts[tier].meta.title,
  };
  return btoa(JSON.stringify(payload));
}

export function parseShareParam(
  param: string,
): { id: string; tier: ChartTier; presetId: string } | null {
  try {
    const data = JSON.parse(atob(param)) as {
      id: string;
      tier: ChartTier;
      presetId?: string;
    };
    if (!data.id || !data.tier) return null;
    return { id: data.id, tier: data.tier, presetId: data.presetId ?? "mg-chart-main" };
  } catch {
    return null;
  }
}
