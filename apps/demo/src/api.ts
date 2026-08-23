const BASE = "/demo/api/v1";

export type Mode = "vocal_lyrics" | "vocal_desc" | "game_bgm" | "game_theme_vocal";

export type JobStatus =
  | "queued"
  | "routing"
  | "generating"
  | "uploading"
  | "completed"
  | "failed";

export type Job = {
  job_id: string;
  status: JobStatus;
  mode: Mode;
  engine: string;
  duration_sec?: number;
  error?: { code: string; message: string } | null;
  audio?: { mime: string; download_url: string };
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  }
  return body.data as T;
}

export async function fetchHealth() {
  return api<{ status: string }>("/health");
}

export async function fetchInferenceHealth() {
  return api<{
    gateway: string;
    workers: { ace: { status: string }; sa3: { status: string } };
  }>("/health/inference");
}

export async function createJob(payload: Record<string, unknown>) {
  return api<{ job_id: string; status: string }>("/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getJob(jobId: string) {
  return api<Job>(`/jobs/${jobId}`);
}

export function audioUrl(jobId: string) {
  return `${BASE}/jobs/${jobId}/audio`;
}
