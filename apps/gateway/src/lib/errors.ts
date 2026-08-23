import type { ErrorCode } from "@lamp/shared";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  details: Record<string, unknown> = {},
) {
  return { error: { code, message, details } };
}
