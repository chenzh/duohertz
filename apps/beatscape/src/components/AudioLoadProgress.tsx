import type { AudioLoadProgress as Progress } from "../audio/earlyAudio";

/** The bar reflects received bytes only; decoding is a separate, honest stage. */
export function AudioLoadProgress({ progress }: { progress: Progress | null }) {
  if (progress?.phase === "decode") {
    return <p className="audio-load-progress-label" role="status">Download complete · preparing audio…</p>;
  }

  const total = progress?.totalBytes ?? null;
  // Until the stream closes, receiving Content-Length bytes does not prove
  // that the download is usable. Reserve completion for the decode stage.
  const percent = total === null ? null : Math.min(99, Math.floor((progress!.loadedBytes / total) * 100));
  return (
    <div className="audio-load-progress">
      <div
        className={`audio-load-progress-track${percent === null ? " audio-load-progress-indeterminate" : ""}`}
        role="progressbar"
        aria-label="Song download"
        aria-valuemin={percent === null ? undefined : 0}
        aria-valuemax={percent === null ? undefined : 100}
        aria-valuenow={percent === null ? undefined : percent}
      >
        <span style={percent === null ? undefined : { width: `${percent}%` }} />
      </div>
      <p className="audio-load-progress-label" aria-hidden="true">
        {percent === null ? "Downloading song…" : `Downloading song · ${percent}%`}
      </p>
    </div>
  );
}
