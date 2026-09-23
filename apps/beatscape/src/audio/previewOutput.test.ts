import { beforeEach, describe, expect, it, vi } from "vitest";
import { connectPreviewOutput } from "./previewOutput";

const audioRef = vi.hoisted(() => ({ context: null as AudioContext | null, unlock: vi.fn(async () => {}) }));
vi.mock("./context", () => ({ getAudioContext: () => audioRef.context, unlockAudio: audioRef.unlock }));

function fakeOutput() {
  const source = { connect: vi.fn(), disconnect: vi.fn() };
  const gain = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() };
  const destination = {};
  const context = {
    destination,
    createGain: vi.fn(() => gain),
    createMediaElementSource: vi.fn(() => source),
  } as unknown as AudioContext;
  const element = { volume: 0.25, muted: false } as HTMLAudioElement;
  return { context, element, source, gain, destination };
}

beforeEach(() => {
  audioRef.unlock.mockClear();
});

describe("preview output", () => {
  it("uses one Web Audio gain instead of multiplying element and graph volume", async () => {
    const { context, element, source, gain, destination } = fakeOutput();
    audioRef.context = context;
    const output = connectPreviewOutput(element, 0.25);
    expect(context.createMediaElementSource).toHaveBeenCalledWith(element);
    expect(source.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith(destination);
    expect(element.volume).toBe(1);
    expect(gain.gain.value).toBe(0.25);

    output.setVolume(0);
    expect(gain.gain.value).toBe(0);
    expect(element.muted).toBe(true);
    output.setVolume(0.65);
    expect(element.volume).toBe(1);
    expect(element.muted).toBe(false);
    expect(gain.gain.value).toBe(0.65);

    await output.resume();
    expect(audioRef.unlock).toHaveBeenCalledOnce();
    output.disconnect();
    expect(source.disconnect).toHaveBeenCalledOnce();
    expect(gain.disconnect).toHaveBeenCalledOnce();
  });

  it("attenuates through the gain when iOS ignores element.volume writes", () => {
    const { context, element, gain } = fakeOutput();
    audioRef.context = context;
    Object.defineProperty(element, "volume", { get: () => 1, set: () => {} });
    const output = connectPreviewOutput(element, 0.25);
    expect(element.volume).toBe(1);
    expect(gain.gain.value).toBe(0.25);
    output.setVolume(0.4);
    expect(element.volume).toBe(1);
    expect(gain.gain.value).toBe(0.4);
    output.disconnect();
  });
});
