/** Resolve a bundled static asset for the gateway demo or the public portal. */
export function publicAsset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/?demo\//, "").replace(/^\//, "")}`;
}
