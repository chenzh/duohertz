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
  if (c.state === "suspended") {
    await c.resume();
  }
}
