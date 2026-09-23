import { getAudioContext, unlockAudio } from "./context";

/**
 * Route a user-started preview through the same volume model as gameplay.
 * iOS Safari ignores HTMLMediaElement.volume, while GainNode works for the
 * local M4A preview assets. Creating this graph only on Play keeps library
 * browsing free of audio contexts and media downloads.
 */
export function connectPreviewOutput(element: HTMLAudioElement, volume: number) {
  const context = getAudioContext();
  const gain = context.createGain();
  gain.gain.value = volume;
  const source = context.createMediaElementSource(element);
  source.connect(gain);
  gain.connect(context.destination);
  // Once routed, the graph alone controls loudness. Applying element.volume
  // as well would attenuate twice on desktop but be ignored on iOS.
  element.volume = 1;
  element.muted = volume === 0;

  return {
    setVolume(next: number) {
      element.volume = 1;
      element.muted = next === 0;
      gain.gain.value = next;
    },
    resume: unlockAudio,
    disconnect() {
      source.disconnect();
      gain.disconnect();
    },
  };
}
