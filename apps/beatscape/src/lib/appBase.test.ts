import { describe, expect, test } from "vitest";
import { appHref, canonicalPathname, normalizeAppBase, routePath } from "./appBase";

describe("application base paths", () => {
  test("keeps a root deployment at the root", () => {
    expect(normalizeAppBase("/")).toBe("");
    expect(appHref("/play/bs-s1-01", normalizeAppBase("/"))).toBe("/play/bs-s1-01");
  });

  test("normalizes the local subpath without changing its routes", () => {
    const base = normalizeAppBase("beatscape/");
    expect(base).toBe("/beatscape");
    expect(appHref("library", base)).toBe("/beatscape/library");
    expect(routePath("/beatscape/play/bs-s1-01/", base)).toBe("/play/bs-s1-01");
  });

  test("root builds accept legacy subpath links but not prefix collisions", () => {
    expect(routePath("/beatscape/play/bs-s1-01", "")).toBe("/play/bs-s1-01");
    expect(routePath("/beatscape-old/play/bs-s1-01", "")).toBe("/beatscape-old/play/bs-s1-01");
  });

  test("canonicalizes legacy deep links without changing local subpath URLs", () => {
    expect(canonicalPathname("/beatscape/track/bs-s1-01", "")).toBe("/track/bs-s1-01");
    expect(canonicalPathname("/beatscape/track/bs-s1-01", "/beatscape")).toBe(
      "/beatscape/track/bs-s1-01",
    );
  });
});
