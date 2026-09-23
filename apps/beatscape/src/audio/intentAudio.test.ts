import { afterEach, describe, expect, it, vi } from "vitest";
import { DecodedAudioCache } from "./decodedAudioCache";
import { beginIntentAudio, discardIntentAudio, takeIntentAudio } from "./intentAudio";
import type { AudioLoadProgress } from "./earlyAudio";

function browser(saveData = false) {
  vi.stubGlobal("window", { setTimeout: vi.fn(() => 1), clearTimeout: vi.fn() });
  vi.stubGlobal("navigator", { connection: { saveData } });
}

afterEach(() => {
  discardIntentAudio();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("chosen-song intent download", () => {
  it("hands an in-flight stream and its byte progress to the decoded cache without a second fetch", async () => {
    browser();
    let stream!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({ start(controller) { stream = controller; } });
    const fetchAudio = vi.fn(async () => new Response(body, { headers: { "Content-Length": "4" } }));
    vi.stubGlobal("fetch", fetchAudio);

    const intent = beginIntentAudio("/chosen.m4a?v=release");
    expect(intent).not.toBeNull();
    stream.enqueue(new Uint8Array([1, 2]));
    intent!.handoff();
    intent!.release();

    const decodeAudioData = vi.fn(async (_encoded: ArrayBuffer) => ({ length: 2, numberOfChannels: 2 }) as AudioBuffer);
    const progress: AudioLoadProgress[] = [];
    const lease = new DecodedAudioCache().acquire(
      { sampleRate: 48000, decodeAudioData },
      "/chosen.m4a?v=release",
      (update) => progress.push(update),
    );
    await vi.waitFor(() => expect(progress).toContainEqual({ phase: "download", loadedBytes: 2, totalBytes: 4 }));
    stream.enqueue(new Uint8Array([3, 4]));
    stream.close();
    await lease.promise;

    expect(fetchAudio).toHaveBeenCalledTimes(1);
    expect(new Uint8Array(decodeAudioData.mock.calls[0]![0])).toEqual(new Uint8Array([1, 2, 3, 4]));
    expect(progress.at(-1)).toEqual({ phase: "decode" });
    expect(takeIntentAudio("/chosen.m4a?v=release")).toBeNull();
  });

  it("aborts when the player leaves the story and will not serve the abandoned bytes", () => {
    browser();
    const fetchAudio = vi.fn((_url: string, _init?: RequestInit) => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetchAudio);
    const intent = beginIntentAudio("/chosen.m4a?v=release");
    expect(fetchAudio).toHaveBeenCalledTimes(1);
    intent!.release();
    expect(fetchAudio.mock.calls[0]![1]!.signal!.aborted).toBe(true);
    expect(takeIntentAudio("/chosen.m4a?v=release")).toBeNull();
  });

  it("does not automatically spend data when the browser requests data saving", () => {
    browser(true);
    const fetchAudio = vi.fn();
    vi.stubGlobal("fetch", fetchAudio);
    expect(beginIntentAudio("/chosen.m4a?v=release")).toBeNull();
    expect(fetchAudio).not.toHaveBeenCalled();
  });
});
