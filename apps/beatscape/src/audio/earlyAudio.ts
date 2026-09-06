export type EarlyAudioDownload = {
  controller: AbortController;
  promise: Promise<ArrayBuffer>;
};

declare global {
  interface Window {
    /** One initial deep-link download, injected by the release preparer. */
    __beatscapeEarlyAudio?: {
      take(url: string): EarlyAudioDownload | null;
      discardIfStale(): void;
    };
  }
}

export function takeEarlyAudio(url: string): EarlyAudioDownload | null {
  return typeof window === "undefined" ? null : window.__beatscapeEarlyAudio?.take(url) ?? null;
}

export function discardStaleEarlyAudio(): void {
  window.__beatscapeEarlyAudio?.discardIfStale();
}
