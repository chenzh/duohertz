import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const APP_BASE = (import.meta.env.BASE_URL || "/beatscape/").replace(/\/$/, "") || "/beatscape";

type RouteDef = { path: string; element: ReactNode };

interface LocationValue {
  path: string;
  search: string;
  params: Record<string, string>;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
  setSearch: (q: URLSearchParams) => void;
}

const LocationCtx = createContext<LocationValue | null>(null);

function toUrl(to: string): string {
  return to.startsWith("/") ? `${APP_BASE}${to}` : `${APP_BASE}/${to}`;
}

function readLocation(): { path: string; search: string } {
  const raw = window.location.pathname.replace(/\/$/, "") || "/";
  const path = raw.startsWith(APP_BASE) ? raw.slice(APP_BASE.length) || "/" : raw;
  return { path, search: window.location.search };
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
}: {
  routes: RouteDef[];
  layout?: (child: ReactNode) => ReactNode;
  fallback?: ReactNode;
}) {
  const [loc, setLoc] = useState(readLocation);

  useEffect(() => {
    const onPop = () => setLoc(readLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // 路由切换：滚回顶部并把焦点交给主内容区，让键盘/读屏用户感知"进入了新页面"。
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    const main = document.querySelector<HTMLElement>(".site-main");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.path]);

  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    const href = toUrl(to);
    if (opts?.replace) window.history.replaceState({}, "", href);
    else window.history.pushState({}, "", href);
    setLoc(readLocation());
  }, []);

  const setSearch = useCallback((q: URLSearchParams) => {
    const base = window.location.pathname;
    const qs = q.toString();
    window.history.replaceState({}, "", qs ? `${base}?${qs}` : base);
    setLoc(readLocation());
  }, []);

  for (const r of routes) {
    const params = matchPath(r.path, loc.path);
    if (params !== null) {
      const value: LocationValue = { path: loc.path, search: loc.search, params, navigate, setSearch };
      const body = layout ? layout(r.element) : r.element;
      return <LocationCtx.Provider value={value}>{body}</LocationCtx.Provider>;
    }
  }

  const ctx: LocationValue = {
    path: loc.path,
    search: loc.search,
    params: {},
    navigate,
    setSearch,
  };
  const body = fallback ? (layout ? layout(fallback) : fallback) : null;
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

export function useSearchParams(): [URLSearchParams, (q: URLSearchParams) => void] {
  const { search, setSearch } = useLocation();
  return [new URLSearchParams(search), setSearch];
}

export function Link({
  to,
  children,
  className,
  onClick,
  title,
  "aria-label": ariaLabel,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  "aria-label"?: string;
}) {
  const { navigate } = useLocation();
  return (
    <a
      href={toUrl(to)}
      className={className}
      title={title}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export { APP_BASE };
