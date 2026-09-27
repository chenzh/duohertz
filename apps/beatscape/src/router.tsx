import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { discardStaleEarlyAudio } from "./audio/earlyAudio";
import { appHref, normalizeAppBase, routePath } from "./lib/appBase";
import { preloadRoute } from "./routePreload";

const APP_BASE = normalizeAppBase(import.meta.env.BASE_URL);

type RouteDef = { path: string; element: ReactNode };

interface LocationValue {
  path: string;
  search: string;
  params: Record<string, string>;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
  setSearch: (q: URLSearchParams) => void;
  registerBackBlocker: (blocker: (() => void) | null) => void;
  proceedBlockedBack: () => void;
}

const LocationCtx = createContext<LocationValue | null>(null);

function toUrl(to: string): string {
  return appHref(to, APP_BASE);
}

function readLocation(hashRoute?: (hash: string) => string | null): { path: string; search: string } {
  if (import.meta.env.VITE_DUOHERTZ_PREVIEW !== "1"
      && import.meta.env.VITE_DUOHERTZ_RELEASE_SOURCE !== "1") discardStaleEarlyAudio();
  const path = routePath(window.location.pathname, APP_BASE);
  return { path: path === "/" ? hashRoute?.(window.location.hash) ?? path : path,
    search: window.location.search };
}

function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patParts.length; i++) {
    const p = patParts[i]!;
    const v = pathParts[i]!;
    if (p.startsWith(":")) params[p.slice(1)] = decodeURIComponent(v);
    else if (p !== v) return null;
  }
  return params;
}

export function Router({
  routes,
  layout,
  fallback = null,
  hashRoute,
}: {
  routes: RouteDef[];
  layout?: (child: ReactNode, path: string) => ReactNode;
  fallback?: ReactNode;
  hashRoute?: (hash: string) => string | null;
}) {
  const [loc, setLoc] = useState(() => readLocation(hashRoute));
  const previousPathRef = useRef(loc.path);
  const backBlockerRef = useRef<(() => void) | null>(null);
  const restoringBlockedPopRef = useRef(false);
  const proceedAfterRestoreRef = useRef(false);
  const allowNextPopRef = useRef(false);

  const registerBackBlocker = useCallback((blocker: (() => void) | null) => {
    backBlockerRef.current = blocker;
  }, []);

  const proceedBlockedBack = useCallback(() => {
    if (restoringBlockedPopRef.current) {
      proceedAfterRestoreRef.current = true;
      return;
    }
    allowNextPopRef.current = true;
    window.history.back();
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (restoringBlockedPopRef.current) {
        restoringBlockedPopRef.current = false;
        setLoc(readLocation(hashRoute));
        if (proceedAfterRestoreRef.current) {
          proceedAfterRestoreRef.current = false;
          allowNextPopRef.current = true;
          window.setTimeout(() => window.history.back(), 0);
        }
        return;
      }
      if (allowNextPopRef.current) {
        allowNextPopRef.current = false;
        setLoc(readLocation(hashRoute));
        return;
      }
      const blocker = backBlockerRef.current;
      if (blocker) {
        // A same-document back changes the address before popstate. Keep the
        // current route mounted, restore the history entry, then let the game
        // show its own exit panel. Cross-document exits are covered by the
        // active run's beforeunload handler instead.
        restoringBlockedPopRef.current = true;
        blocker();
        window.history.forward();
        return;
      }
      setLoc(readLocation(hashRoute));
    };
    window.addEventListener("popstate", onPop);
    if (hashRoute) window.addEventListener("hashchange", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (hashRoute) window.removeEventListener("hashchange", onPop);
    };
  }, [hashRoute]);

  // Client-side route changes return to the top and announce the new main
  // region through focus. Do not steal focus on the initial document load:
  // keyboard users must be able to Tab into the skip link first.
  useEffect(() => {
    if (previousPathRef.current === loc.path) return;
    previousPathRef.current = loc.path;
    window.scrollTo({ top: 0, left: 0 });
    document.getElementById("main-content")?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.path]);

  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    const href = toUrl(to);
    if (opts?.replace) window.history.replaceState({}, "", href);
    else window.history.pushState({}, "", href);
    setLoc(readLocation(hashRoute));
  }, [hashRoute]);

  const setSearch = useCallback((q: URLSearchParams) => {
    const base = window.location.pathname;
    const qs = q.toString();
    window.history.replaceState({}, "", qs ? `${base}?${qs}` : base);
    setLoc(readLocation(hashRoute));
  }, [hashRoute]);

  for (const r of routes) {
    const params = matchPath(r.path, loc.path);
    if (params !== null) {
      const value: LocationValue = {
        path: loc.path,
        search: loc.search,
        params,
        navigate,
        setSearch,
        registerBackBlocker,
        proceedBlockedBack,
      };
      const body = layout ? layout(r.element, loc.path) : r.element;
      return <LocationCtx.Provider value={value}>{body}</LocationCtx.Provider>;
    }
  }

  const ctx: LocationValue = {
    path: loc.path,
    search: loc.search,
    params: {},
    navigate,
    setSearch,
    registerBackBlocker,
    proceedBlockedBack,
  };
  const body = fallback ? (layout ? layout(fallback, loc.path) : fallback) : null;
  return <LocationCtx.Provider value={ctx}>{body}</LocationCtx.Provider>;
}

function useLocation(): LocationValue {
  const ctx = useContext(LocationCtx);
  if (!ctx) throw new Error("Router components must be used inside <Router>");
  return ctx;
}

export function useParams(): Record<string, string> {
  return useLocation().params;
}

export function useNavigate(): (to: string, opts?: { replace?: boolean }) => void {
  return useLocation().navigate;
}

export function useRouter(): { path: string; navigate: LocationValue["navigate"]; search: string } {
  const { path, navigate, search } = useLocation();
  return { path, navigate, search };
}

/**
 * Keep an active run from being discarded by same-document browser history.
 * Tab close, reload, and cross-document Back use the browser's native prompt.
 */
export function useBackNavigationBlocker(enabled: boolean, onBlocked: () => void): () => void {
  const { registerBackBlocker, proceedBlockedBack } = useLocation();
  const onBlockedRef = useRef(onBlocked);
  onBlockedRef.current = onBlocked;

  useEffect(() => {
    if (!enabled) return;
    const blocker = () => onBlockedRef.current();
    registerBackBlocker(blocker);
    return () => registerBackBlocker(null);
  }, [enabled, registerBackBlocker]);

  useEffect(() => {
    if (!enabled) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enabled]);

  return proceedBlockedBack;
}

export function useSearchParams(): [URLSearchParams, (q: URLSearchParams) => void] {
  const { search, setSearch } = useLocation();
  return [new URLSearchParams(search), setSearch];
}

type LinkProps = {
  to: string;
  children: ReactNode;
} & Pick<
  ComponentPropsWithoutRef<"a">,
  "className" | "style" | "onClick" | "title" | "aria-label" | "aria-current" | "target" | "rel" | "download"
>;

export function Link({
  to,
  children,
  className,
  style,
  onClick,
  title,
  "aria-label": ariaLabel,
  "aria-current": ariaCurrent,
  target,
  rel,
  download,
}: LinkProps) {
  const { navigate } = useLocation();
  const warmDestination = () => preloadRoute(to);
  return (
    <a
      href={toUrl(to)}
      className={className}
      style={style}
      title={title}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      target={target}
      rel={rel}
      download={download}
      onFocus={warmDestination}
      onPointerEnter={warmDestination}
      onPointerDown={warmDestination}
      onClick={(e) => {
        onClick?.(e);
        // Internal links must still behave like links. Only an unmodified
        // primary-button click belongs to the client router; Ctrl/Cmd/Shift/
        // Alt click, middle click, downloads, and explicit targets stay native.
        if (
          e.defaultPrevented
          || e.button !== 0
          || e.metaKey
          || e.ctrlKey
          || e.shiftKey
          || e.altKey
          || (e.currentTarget.target && e.currentTarget.target !== "_self")
          || e.currentTarget.hasAttribute("download")
        ) return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export { APP_BASE };
