import {
  DURATION_LIMITS,
  ERROR_CODES,
  MODE_ENGINE_MAP,
  type Mode,
} from "@lamp/shared";
import { AppError } from "../lib/errors.js";
import type { CreateJobInput } from "../schemas/jobs.js";

function nonEmpty(value: string | undefined, code: keyof typeof ERROR_CODES, label: string): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new AppError(ERROR_CODES[code], 400, `${label} is required`);
  if (trimmed.length > 8000) throw new AppError(ERROR_CODES[code], 400, `${label} too long`);
  return trimmed;
}

export function validateCreateJob(body: CreateJobInput) {
  const mode = body.mode as Mode;
  const mapping = MODE_ENGINE_MAP[mode];
  const limits = DURATION_LIMITS[mode];
  const duration = body.duration_sec ?? limits.default;

  if (duration < limits.min || duration > limits.max) {
    throw new AppError(ERROR_CODES.INVALID_DURATION, 400, `duration_sec must be between ${limits.min} and ${limits.max}`);
  }

  let prompt: string | null = null;
  let styleTags: string | null = null;
  let lyrics: string | null = null;

  switch (mode) {
    case "vocal_lyrics":
      styleTags = nonEmpty(body.style_tags, "INVALID_STYLE_TAGS", "style_tags");
      lyrics = nonEmpty(body.lyrics, "INVALID_LYRICS", "lyrics");
      break;
    case "vocal_desc":
      prompt = nonEmpty(body.prompt, "INVALID_PROMPT", "prompt");
      break;
    case "game_bgm":
      prompt = nonEmpty(body.prompt, "INVALID_PROMPT", "prompt");
      break;
    case "game_theme_vocal":
      if (!body.prompt?.trim() && !body.lyrics?.trim()) {
        throw new AppError(ERROR_CODES.INVALID_PROMPT, 400, "prompt or lyrics required for game_theme_vocal");
      }
      prompt = body.prompt?.trim() || null;
      lyrics = body.lyrics?.trim() || null;
      break;
  }

  if (prompt && prompt.length > 2000) {
    throw new AppError(ERROR_CODES.INVALID_PROMPT, 400, "prompt too long");
  }
  if (styleTags && styleTags.length > 500) {
    throw new AppError(ERROR_CODES.INVALID_STYLE_TAGS, 400, "style_tags too long");
  }

  return {
    mode,
    engine: mapping.engine,
    worker: mapping.worker,
    modelVariant: body.model_variant ?? mapping.defaultVariant,
    durationSec: duration,
    prompt,
    styleTags,
    lyrics,
  };
}
