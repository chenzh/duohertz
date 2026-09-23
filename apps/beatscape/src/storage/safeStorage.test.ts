import { afterEach, describe, expect, it, vi } from "vitest";
import { writeItem } from "./safeStorage";

afterEach(() => vi.unstubAllGlobals());

describe("safe storage writes", () => {
  it("reports a successful write", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });

    expect(writeItem("beat", "saved")).toBe(true);
    expect(setItem).toHaveBeenCalledWith("beat", "saved");
  });

  it("reports denied and unavailable storage instead of claiming success", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => { throw new DOMException("denied", "SecurityError"); },
    });
    expect(writeItem("beat", "lost")).toBe(false);

    vi.stubGlobal("localStorage", undefined);
    expect(writeItem("beat", "lost")).toBe(false);
  });
});
