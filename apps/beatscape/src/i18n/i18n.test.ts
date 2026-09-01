import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, getMessages } from "./index";
import { en } from "./en";
import { zh } from "./zh";
import type { Messages } from "./types";

/** 递归收集对象的所有叶子 key 路径，用于对比两套 locale 的 key 形状是否完全一致。 */
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  const out: string[] = [];
  for (const k of Object.keys(obj as Record<string, unknown>)) {
    out.push(...keyPaths((obj as Record<string, unknown>)[k], prefix ? `${prefix}.${k}` : k));
  }
  return out;
}

describe("i18n parity (P2-10)", () => {
  it("defaults to English locale", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("en and zh have identical key shape (CI guard against dropped translations)", () => {
    const ek = keyPaths(en as Messages).sort();
    const zk = keyPaths(zh as Messages).sort();
    expect(zk).toEqual(ek);
  });

  it("getMessages returns the requested locale", () => {
    expect(getMessages("en")).toBe(en);
    expect(getMessages("zh").ui.pause).toBe("暂停");
  });
});
