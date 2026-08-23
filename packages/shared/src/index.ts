export const MODES = [
  "vocal_lyrics",
  "vocal_desc",
  "game_bgm",
  "game_theme_vocal",
] as const;

export type Mode = (typeof MODES)[number];

export const JOB_STATUSES = [
  "queued",
  "routing",
  "generating",
  "uploading",
  "completed",
  "failed",
  "cancelled",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const ERROR_CODES = {
  INVALID_MODE: "INVALID_MODE",
  INVALID_PROMPT: "INVALID_PROMPT",
  INVALID_STYLE_TAGS: "INVALID_STYLE_TAGS",
  INVALID_LYRICS: "INVALID_LYRICS",
  INVALID_DURATION: "INVALID_DURATION",
  CONTENT_POLICY: "CONTENT_POLICY",
  UNAUTHORIZED: "UNAUTHORIZED",
  JOB_NOT_FOUND: "JOB_NOT_FOUND",
  JOB_NOT_READY: "JOB_NOT_READY",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  WORKER_UNAVAILABLE: "WORKER_UNAVAILABLE",
  GENERATION_TIMEOUT: "GENERATION_TIMEOUT",
  STORAGE_ERROR: "STORAGE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const MODE_ENGINE_MAP: Record<
  Mode,
  { engine: string; worker: "ace" | "sa3"; defaultVariant: string }
> = {
  vocal_lyrics: { engine: "ace-step-1.5", worker: "ace", defaultVariant: "turbo" },
  vocal_desc: { engine: "ace-step-1.5", worker: "ace", defaultVariant: "turbo" },
  game_bgm: { engine: "stable-audio-3", worker: "sa3", defaultVariant: "small" },
  game_theme_vocal: { engine: "ace-step-1.5", worker: "ace", defaultVariant: "turbo" },
};

export const DURATION_LIMITS: Record<Mode, { min: number; max: number; default: number }> = {
  vocal_lyrics: { min: 30, max: 240, default: 180 },
  vocal_desc: { min: 30, max: 240, default: 180 },
  game_bgm: { min: 15, max: 180, default: 90 },
  game_theme_vocal: { min: 30, max: 240, default: 180 },
};
