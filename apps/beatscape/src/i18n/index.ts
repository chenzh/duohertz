import { en } from "./en";
import type { Messages } from "./types";
import { zh } from "./zh";

export type { Messages, LeaderboardMessages } from "./types";
export type Locale = "en" | "zh";

export const DEFAULT_LOCALE: Locale = "en";

const messages: Record<Locale, Messages> = { en, zh };

export function getMessages(locale: Locale = DEFAULT_LOCALE): Messages {
  return messages[locale];
}
