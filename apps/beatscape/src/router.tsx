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
}: {
  routes: RouteDef[];
  layout?: (child: ReactNode) => ReactNode;
}) {
  const [loc, setLoc] = useState(readLocation);

  useEffect(() => {
    const onPop = () => setLoc(readLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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

  const fallback: LocationValue = {
    path: loc.path,
    search: loc.search,
    params: {},
    navigate,
    setSearch,
  };
  const fallbackBody =
    layout && routes.find((r) => r.path === "/")?.element
      ? layout(routes.find((r) => r.path === "/")!.element!)
      : routes.find((r) => r.path === "/")?.element ?? null;
  return <LocationCtx.Provider value={fallback}>{fallbackBody}</LocationCtx.Provider>;
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

export function Link({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  const { navigate } = useLocation();
  return (
    <a
      href={toUrl(to)}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export function Navigate({ to }: { to: string }) {
  const { navigate } = useLocation();
  useEffect(() => {
    navigate(to, { replace: true });
  }, [to, navigate]);
  return null;
}

export { APP_BASE };
