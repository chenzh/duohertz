// Single shared AudioContext for the whole app. Music playback and SFX share
// one clock so judgments stay sample-aligned with the song.

let _ctx: AudioContext | null = null;

type AudioContextCtor = typeof AudioContext;

export function getAudioContext(): AudioContext {
  if (!_ctx) {
    const Ctor: AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: AudioContextCtor }).webkitAudioContext;
    _ctx = new Ctor();
  }
  return _ctx;
}

export async function unlockAudio(): Promise<void> {
  const c = getAudioContext();
  const state = String(c.state);
  if (state === "closed") throw new Error("Audio context is closed");
  // Safari can expose the non-standard `interrupted` state after calls,
  // Bluetooth route changes, or another app taking audio focus. Treat every
  // non-running recoverable state like `suspended` instead of silently
  // scheduling music on a clock that cannot advance.
  if (state !== "running") await c.resume();
  if (String(c.state) !== "running") throw new Error("Audio context did not resume");
}
