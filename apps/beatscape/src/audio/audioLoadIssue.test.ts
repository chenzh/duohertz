import { describe, expect, it } from "vitest";
import { audioLoadSupportCode } from "./audioLoadIssue";

describe("audio load support code", () => {
  it("keeps a canonical HTTP status without exposing the original message", () => {
    expect(audioLoadSupportCode(new Error("Audio load failed (503)"))).toBe("AUDIO-503");
  });

  it("uses a numeric status attached by a transport", () => {
    expect(audioLoadSupportCode(Object.assign(new Error("private CDN response"), { status: 404 })))
      .toBe("AUDIO-404");
  });

  it("classifies browser transport and decode failures", () => {
    expect(audioLoadSupportCode(new TypeError("Failed to fetch https://private.invalid/audio.m4a")))
      .toBe("AUDIO-NETWORK");
    expect(audioLoadSupportCode(new DOMException("Unable to decode audio data", "EncodingError")))
      .toBe("AUDIO-DECODE");
  });

  it("falls back to one stable code for unknown or sensitive errors", () => {
    expect(audioLoadSupportCode(new Error("token=secret&origin=internal"))).toBe("AUDIO-LOAD");
    expect(audioLoadSupportCode("https://private.invalid/audio.m4a")).toBe("AUDIO-LOAD");
  });
});
