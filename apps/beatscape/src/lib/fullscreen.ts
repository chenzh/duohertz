export type FullscreenRequestResult = "requested" | "unavailable" | "denied";

type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type WebkitFullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

export const FULLSCREEN_CHANGE_EVENTS = ["fullscreenchange", "webkitfullscreenchange"] as const;

export function canRequestGameFullscreen(target?: HTMLElement | null): boolean {
  const el = target ?? (typeof document === "undefined" ? null : document.documentElement);
  if (!el) return false;
  return typeof el.requestFullscreen === "function"
    || typeof (el as WebkitFullscreenElement).webkitRequestFullscreen === "function";
}

export function gameFullscreenElement(doc?: Document | null): Element | null {
  const target = doc ?? (typeof document === "undefined" ? null : document);
  if (!target) return null;
  return target.fullscreenElement
    ?? (target as WebkitFullscreenDocument).webkitFullscreenElement
    ?? null;
}

/** Leave standard or legacy WebKit fullscreen without blocking recovery UI. */
export async function exitGameFullscreen(doc?: Document | null): Promise<void> {
  const target = doc ?? (typeof document === "undefined" ? null : document);
  if (!target) return;
  try {
    if (typeof target.exitFullscreen === "function") {
      await target.exitFullscreen();
      return;
    }
    const webkitExit = (target as WebkitFullscreenDocument).webkitExitFullscreen;
    if (typeof webkitExit === "function") await webkitExit.call(target);
  } catch {
    // Recovery must remain usable if the browser already left fullscreen.
  }
}

/** Request fullscreen without throwing into the gameplay gesture path. */
export async function requestGameFullscreen(target?: HTMLElement | null): Promise<FullscreenRequestResult> {
  const el = target ?? (typeof document === "undefined" ? null : document.documentElement);
  if (!el) return "unavailable";
  try {
    if (typeof el.requestFullscreen === "function") {
      await el.requestFullscreen();
      return "requested";
    }
    const webkitRequest = (el as WebkitFullscreenElement).webkitRequestFullscreen;
    if (typeof webkitRequest === "function") {
      await webkitRequest.call(el);
      return "requested";
    }
    return "unavailable";
  } catch {
    return "denied";
  }
}
