import { describe, expect, it, vi } from "vitest";
import {
  canRequestGameFullscreen,
  exitGameFullscreen,
  gameFullscreenElement,
  requestGameFullscreen,
} from "./fullscreen";

describe("fullscreen portability", () => {
  it("prefers the standard request API", async () => {
    const requestFullscreen = vi.fn(async () => {});
    const webkitRequestFullscreen = vi.fn(async () => {});
    const target = { requestFullscreen, webkitRequestFullscreen } as unknown as HTMLElement;
    expect(canRequestGameFullscreen(target)).toBe(true);
    await expect(requestGameFullscreen(target)).resolves.toBe("requested");
    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(webkitRequestFullscreen).not.toHaveBeenCalled();
  });

  it("falls back to the WebKit request API", async () => {
    const webkitRequestFullscreen = vi.fn(async () => {});
    const target = { webkitRequestFullscreen } as unknown as HTMLElement;
    expect(canRequestGameFullscreen(target)).toBe(true);
    await expect(requestGameFullscreen(target)).resolves.toBe("requested");
    expect(webkitRequestFullscreen).toHaveBeenCalledOnce();
  });

  it("reports unsupported and denied requests without throwing", async () => {
    const unsupported = {} as HTMLElement;
    expect(canRequestGameFullscreen(unsupported)).toBe(false);
    await expect(requestGameFullscreen(unsupported)).resolves.toBe("unavailable");

    const denied = {
      requestFullscreen: vi.fn(async () => { throw new Error("denied"); }),
    } as unknown as HTMLElement;
    await expect(requestGameFullscreen(denied)).resolves.toBe("denied");
  });

  it("reads the WebKit active element when the standard property is empty", () => {
    const element = {} as Element;
    const doc = {
      fullscreenElement: null,
      webkitFullscreenElement: element,
    } as unknown as Document;
    expect(gameFullscreenElement(doc)).toBe(element);
  });

  it("exits through the standard API and falls back to WebKit", async () => {
    const exitFullscreen = vi.fn(async () => {});
    const webkitExitFullscreen = vi.fn(async () => {});
    await exitGameFullscreen({ exitFullscreen, webkitExitFullscreen } as unknown as Document);
    expect(exitFullscreen).toHaveBeenCalledOnce();
    expect(webkitExitFullscreen).not.toHaveBeenCalled();

    const webkitOnlyExit = vi.fn(async () => {});
    const webkitOnly = { webkitExitFullscreen: webkitOnlyExit } as unknown as Document;
    await expect(exitGameFullscreen(webkitOnly)).resolves.toBeUndefined();
    expect(webkitOnlyExit).toHaveBeenCalledOnce();
  });
});
