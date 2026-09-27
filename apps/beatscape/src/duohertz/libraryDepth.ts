export const DUOHERTZ_LIBRARY_BATCH_SIZE = 15;

/** URL-backed reveal depth for the fixed 105-track duohertz catalog. */
export function libraryShownCount(raw: string | null): number {
  if (!raw || !/^\d+$/.test(raw)) return DUOHERTZ_LIBRARY_BATCH_SIZE;
  const count = Number(raw);
  return Number.isSafeInteger(count)
    && count >= DUOHERTZ_LIBRARY_BATCH_SIZE
    && count <= 105
    && count % DUOHERTZ_LIBRARY_BATCH_SIZE === 0
    ? count : DUOHERTZ_LIBRARY_BATCH_SIZE;
}
