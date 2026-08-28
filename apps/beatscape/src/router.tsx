import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type RouteDef = { path: string; element: ReactNode };

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

export function useRouter(base = "/beatscape") {
  const readPath = useCallback(() => {
    const raw = window.location.pathname.replace(/\/$/, "") || "/";
    return raw.startsWith(base) ? raw.slice(base.length) || "/" : raw;
  }, [base]);

  const readSearch = useCallback(() => window.location.search, []);

  const [path, setPath] = useState(readPath);
  const [search, setSearch] = useState(readSearch);

  useEffect(() => {
    const onPop = () => {
      setPath(readPath());
      setSearch(readSearch());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [readPath, readSearch]);

  const navigate = useCallback(
    (to: string) => {
      const dest = to.startsWith("/") ? `${base}${to}` : `${base}/${to}`;
      window.history.pushState({}, "", dest);
      setPath(readPath());
      setSearch(readSearch());
    },
    [base, readPath, readSearch],
  );

  return { path, navigate, search };
}

export function Router({
  base,
  routes,
  fallback = null,
}: {
  base?: string;
  routes: RouteDef[];
  fallback?: ReactNode;
}) {
  const { path } = useRouter(base);
  for (const r of routes) {
    const params = matchPath(r.path, path);
    if (params !== null) {
      return <RouteParamsProvider params={params}>{r.element}</RouteParamsProvider>;
    }
  }
  return <>{fallback}</>;
}

const ParamsCtx = { current: {} as Record<string, string> };

function RouteParamsProvider({ params, children }: { params: Record<string, string>; children: ReactNode }) {
  ParamsCtx.current = params;
  return <>{children}</>;
}

export function useParams() {
  return ParamsCtx.current;
}

export function Link({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "") || "/beatscape";
  const href = to.startsWith("/") ? `${base}${to}` : `${base}/${to}`;
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        window.history.pushState({}, "", href);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }}
    >
      {children}
    </a>
  );
}

export function Navigate({ to }: { to: string }) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "") || "/beatscape";
  useEffect(() => {
    const href = to.startsWith("/") ? `${base}${to}` : `${base}/${to}`;
    window.history.replaceState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [to, base]);
  return null;
}

export function useNavigate() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "") || "/beatscape";
  return (to: string, opts?: { replace?: boolean }) => {
    const href = to.startsWith("/") ? `${base}${to}` : `${base}/${to}`;
    if (opts?.replace) window.history.replaceState({}, "", href);
    else window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
}

export function useSearchParams(): [URLSearchParams, (q: URLSearchParams) => void] {
  const { search } = useRouter();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const setParams = (q: URLSearchParams) => {
    const base = window.location.pathname;
    const qs = q.toString();
    window.history.replaceState({}, "", qs ? `${base}?${qs}` : base);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  return [params, setParams];
}
