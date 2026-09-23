function normalizedBase(base: string): string {
  const rooted = base.startsWith("/") ? base : `/${base}`;
  return rooted.endsWith("/") ? rooted : `${rooted}/`;
}

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform?: string;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<unknown>;
  userChoice: Promise<InstallChoice>;
};

export type PwaInstallOutcome = InstallChoice["outcome"] | "failed" | "unavailable";

let installPrompt: InstallPromptEvent | null = null;
let installPromptActive = false;
let installCaptureStarted = false;
const installListeners = new Set<() => void>();

function notifyInstallListeners(): void {
  installListeners.forEach((listener) => listener());
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const standaloneNavigator = navigator as Navigator & { standalone?: boolean };
  return standaloneNavigator.standalone === true
    || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

function isInstallPromptEvent(event: Event): event is InstallPromptEvent {
  const candidate = event as Partial<InstallPromptEvent>;
  return typeof candidate.prompt === "function"
    && candidate.userChoice instanceof Promise;
}

/**
 * Capture Chromium's one-shot install opportunity before lazy Results code loads.
 * The product intentionally defers its own promotion until a completed run.
 */
export function startPwaInstallCapture(): void {
  if (installCaptureStarted || typeof window === "undefined") return;
  installCaptureStarted = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    if (isStandaloneDisplay() || !isInstallPromptEvent(event)) return;
    installPrompt = event;
    notifyInstallListeners();
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    notifyInstallListeners();
  });
}

export function subscribePwaInstall(listener: () => void): () => void {
  installListeners.add(listener);
  return () => installListeners.delete(listener);
}

export function getPwaInstallSnapshot(): boolean {
  return installPrompt !== null && !installPromptActive && !isStandaloneDisplay();
}

export function getPwaInstallServerSnapshot(): boolean {
  return false;
}

export async function requestPwaInstall(): Promise<PwaInstallOutcome> {
  const prompt = installPrompt;
  if (!prompt || installPromptActive || isStandaloneDisplay()) return "unavailable";
  installPromptActive = true;
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    return choice.outcome === "accepted" ? "accepted" : "dismissed";
  } catch {
    return "failed";
  } finally {
    if (installPrompt === prompt) installPrompt = null;
    installPromptActive = false;
    notifyInstallListeners();
  }
}

export function pwaAssetUrl(path: string, base = import.meta.env.BASE_URL): string {
  return `${normalizedBase(base)}${path.replace(/^\/+/, "")}`;
}

export async function registerPwaWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!import.meta.env.PROD || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(pwaAssetUrl("sw.js"), {
      scope: normalizedBase(import.meta.env.BASE_URL),
      updateViaCache: "none",
    });
  } catch {
    // The online game remains fully usable when registration is unavailable.
    return null;
  }
}

export function schedulePwaRegistration(): void {
  if (!import.meta.env.PROD || typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const register = () => void registerPwaWorker();
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
