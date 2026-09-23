export type AudioLoadSupportCode =
  | `AUDIO-${number}`
  | "AUDIO-CANCELLED"
  | "AUDIO-DECODE"
  | "AUDIO-LOAD"
  | "AUDIO-NETWORK";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "";
}

function statusFromError(error: unknown): number | null {
  const direct = (error as { status?: unknown } | null)?.status;
  if (typeof direct === "number" && Number.isInteger(direct) && direct >= 100 && direct <= 599) {
    return direct;
  }
  const match = errorMessage(error).match(/^Audio load failed \((\d{3})\)$/);
  const status = match ? Number(match[1]) : NaN;
  return status >= 100 && status <= 599 ? status : null;
}

/**
 * Converts browser- and transport-specific failures into a short value that is
 * safe to show players and useful in a support report. Never return the raw
 * message: it may contain a signed media URL or engine-specific details.
 */
export function audioLoadSupportCode(error: unknown): AudioLoadSupportCode {
  const status = statusFromError(error);
  if (status !== null) return `AUDIO-${status}`;

  const name = error instanceof Error ? error.name : "";
  const message = errorMessage(error);
  if (name === "AbortError") return "AUDIO-CANCELLED";
  if (name === "EncodingError" || /\b(decod|unsupported media|audio data|media format)/i.test(message)) {
    return "AUDIO-DECODE";
  }
  if (error instanceof TypeError || /\b(failed to fetch|network|offline|connection)\b/i.test(message)) {
    return "AUDIO-NETWORK";
  }
  return "AUDIO-LOAD";
}
