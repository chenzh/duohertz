import { en } from "./en";
import type { Messages } from "./types";
import { zh } from "./zh";

export type { Messages } from "./types";
export type Locale = "zh" | "en";

const messages: Record<Locale, Messages> = { zh, en };

export function useMessages(locale: Locale): Messages {
  return messages[locale];
}
