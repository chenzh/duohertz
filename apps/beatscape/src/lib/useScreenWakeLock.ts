import { useEffect } from "react";

type ScreenWakeLockSentinel = EventTarget & {
  readonly released: boolean;
  release(): Promise<void>;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request(type: "screen"): Promise<ScreenWakeLockSentinel>;
  };
};

/**
 * Keep an active run visible without turning Wake Lock support into a gameplay
 * requirement. Browsers may reject or revoke the request at any time; every
 * path degrades to normal power-management behavior without surfacing an error.
 */
export function useScreenWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    let disposed = false;
    let requesting = false;
    let sentinel: ScreenWakeLockSentinel | null = null;

    const acquire = async () => {
      if (disposed || requesting || sentinel || document.visibilityState !== "visible") return;
      const wakeLock = (navigator as NavigatorWithWakeLock).wakeLock;
      if (!wakeLock?.request) return;

      requesting = true;
      try {
        const next = await wakeLock.request("screen");
        if (disposed || document.visibilityState !== "visible") {
          if (!next.released) await next.release();
          return;
        }
        sentinel = next;
        next.addEventListener("release", () => {
          if (sentinel === next) sentinel = null;
        }, { once: true });
      } catch {
        // Unsupported, denied, low-power, and system revocations are all safe.
      } finally {
        requesting = false;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !sentinel) void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      const current = sentinel;
      sentinel = null;
      if (current && !current.released) void current.release().catch(() => undefined);
    };
  }, [active]);
}
