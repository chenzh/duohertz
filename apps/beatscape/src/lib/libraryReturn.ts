const LOCAL_ORIGIN = "https://beatscape.invalid";
export const LIBRARY_RETURN_PARAM = "returnTo";

/** Only the Library route may be restored; external and sibling paths degrade safely. */
export function safeLibraryReturn(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/library";
  try {
    const url = new URL(value, LOCAL_ORIGIN);
    if (url.origin !== LOCAL_ORIGIN || url.pathname !== "/library") return "/library";
    return `/library${url.search}`;
  } catch {
    return "/library";
  }
}

export function libraryHrefForSearch(search: string): string {
  const query = new URLSearchParams(search).toString();
  return query ? `/library?${query}` : "/library";
}

/** Keep default entry URLs clean; only attach a return target when state exists. */
export function withLibraryReturn(href: string, returnTo: string): string {
  const safeReturn = safeLibraryReturn(returnTo);
  if (safeReturn === "/library") return href;

  const url = new URL(href, LOCAL_ORIGIN);
  if (url.origin !== LOCAL_ORIGIN) return href;
  url.searchParams.set(LIBRARY_RETURN_PARAM, safeReturn);
  return `${url.pathname}${url.search}${url.hash}`;
}
