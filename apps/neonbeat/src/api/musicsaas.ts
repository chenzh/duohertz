import type { Preset } from "../presets";
import { planDemoSong, renderDemoAudio } from "../audio/demoSong";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export type JobStatus =
  | "queued"
  | "routing"
  | "generating"
  | "uploading"
  | "completed"
  | "failed";

export type JobResponse = {
  data: {
    job_id: string;
    status: JobStatus;
    error_message?: string;
    audio_url?: string;
  };
};

function apiUrl(path: string): string {
  if (API_BASE) return `${API_BASE.replace(/\/$/, "")}${path}`;
  return path;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl("/demo/api/v1/health/inference"), {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as {
      data?: { workers?: { ace?: { status: string }; sa3?: { status: string } } };
    };
    const w = body.data?.workers;
    return w?.ace?.status === "ok" && w?.sa3?.status === "ok";
  } catch {
    return false;
  }
}

export function buildJobPayload(preset: Preset, extraPrompt = "") {
  const prompt = [preset.prompt, extraPrompt].filter(Boolean).join(", ");
  if (preset.mode === "game_theme_vocal") {
    return {
      mode: preset.mode,
      style_tags: preset.style_tags,
      lyrics: preset.lyrics,
      prompt: preset.prompt,
      duration_sec: preset.duration_sec,
    };
  }
  return {
    mode: preset.mode,
    prompt,
    duration_sec: preset.duration_sec,
  };
}

export async function createJob(preset: Preset, extraPrompt = ""): Promise<string> {
  const res = await fetch(apiUrl("/demo/api/v1/jobs"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildJobPayload(preset, extraPrompt)),
  });
  if (!res.ok) throw new Error(`Job create failed (${res.status})`);
  const body = (await res.json()) as JobResponse;
  return body.data.job_id;
}

export async function pollJob(
  jobId: string,
  onStatus: (s: JobStatus) => void,
): Promise<string> {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    const res = await fetch(apiUrl(`/demo/api/v1/jobs/${jobId}`));
    if (!res.ok) throw new Error(`Poll failed (${res.status})`);
    const body = (await res.json()) as JobResponse;
    onStatus(body.data.status);
    if (body.data.status === "completed") {
      const audio = body.data.audio_url ?? `/demo/api/v1/jobs/${jobId}/audio`;
      return apiUrl(audio.startsWith("http") ? new URL(audio).pathname : audio);
    }
    if (body.data.status === "failed") {
      throw new Error(body.data.error_message ?? "Generation failed");
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Generation timed out");
}

export async function fetchAudio(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Audio download failed (${res.status})`);
  return res.arrayBuffer();
}

/** Procedural demo WAV — timeline-locked EDM for offline play */
export async function synthesizeDemoAudio(
  preset: Preset,
  ctx: AudioContext,
): Promise<{
  buffer: AudioBuffer;
  blobUrl: string;
  plan: ReturnType<typeof planDemoSong>;
  wavBytes: ArrayBuffer;
}> {
  const plan = planDemoSong(preset);
  const buffer = renderDemoAudio(ctx, plan, preset);
  const wav = audioBufferToWav(buffer);
  const blob = new Blob([wav], { type: "audio/wav" });
  return { buffer, blobUrl: URL.createObjectURL(blob), plan, wavBytes: wav };
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const samples = buffer.length;
  const bytes = 44 + samples * numCh * 2;
  const ab = new ArrayBuffer(bytes);
  const view = new DataView(ab);
  const write = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, bytes - 8, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * numCh * 2, true);
  view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples * numCh * 2, true);
  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i] ?? 0));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return ab;
}
