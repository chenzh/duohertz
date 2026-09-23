const LEGACY_ROOT_BASE = "/beatscape";

/** Vite exposes `/` for a root deployment. Keep that as an empty prefix
 * instead of accidentally falling back to the local `/beatscape/` base. */
export function normalizeAppBase(base: string | undefined): string {
  const raw = (base ?? "/beatscape/").trim();
  if (!raw || raw === "/") return "";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
}

export function appHref(to: string, appBase: string): string {
  const route = to.startsWith("/") ? to : `/${to}`;
  return `${appBase}${route}`;
}

function stripBase(path: string, base: string): string | null {
  if (path === base) return "/";
  if (path.startsWith(`${base}/`)) return path.slice(base.length) || "/";
  return null;
}

/** Root builds still accept old `/beatscape/*` links emitted by earlier
 * candidates, while every newly rendered link uses the canonical root path. */
export function routePath(pathname: string, appBase: string): string {
  const raw = pathname.replace(/\/$/, "") || "/";
  if (appBase) return stripBase(raw, appBase) ?? raw;
  return stripBase(raw, LEGACY_ROOT_BASE) ?? raw;
}

/** Emit one public pathname for canonical/OG metadata even when a root build
 * was opened through a backwards-compatible `/beatscape/*` deep link. */
export function canonicalPathname(pathname: string, appBase: string): string {
  return appHref(routePath(pathname, appBase), appBase);
}
