import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { validateSiteUrl } from "./scripts/release.mjs";

export default defineConfig(({ command, mode, isPreview }) => {
  const portal = mode === "portal";
  // Match the release verifier exactly: explicit process environment only.
  const demoUrl = process.env.PORTAL_DEMO_URL ?? "";
  const siteUrl = portal ? validateSiteUrl(process.env.PORTAL_SITE_URL) : "";
  const controlledDemo = portal && demoUrl ? validateSiteUrl(demoUrl, { publicOnly: true, allowPath: true }) : "";
  return {
  base: portal || (command !== "build" && !isPreview) ? "/" : "/demo/",
  publicDir: portal ? false : "public",
  build: { outDir: portal ? "dist-portal" : "dist" },
  define: { __PORTAL__: portal, __PORTAL_DEMO_URL__: JSON.stringify(controlledDemo) },
  plugins: [react(), {
    name: "portal-static-artifacts",
    transformIndexHtml(html) {
      if (!portal) return html;
      return html.replaceAll("MusicSaas Demo", "MusicSaas · Music, play & create")
        .replaceAll("/demo/brand/logo.svg", "/brand/logo.svg")
        .replace('content="/brand/logo.svg"', `content="${siteUrl}/brand/og.png"`)
        .replace("本地双引擎音乐生成 API 演示", "音乐生成 API、BeatScape 节奏游戏与 Scape Music 在线听歌")
        .replace("</head>", `<link rel="canonical" href="${siteUrl}/" /><meta property="og:url" content="${siteUrl}/" /><meta property="og:type" content="website" /><meta name="twitter:card" content="summary_large_image" /></head>`);
    },
    closeBundle() {
      if (!portal || command !== "build") return;
      for (const dir of ["brand", "samples"]) {
        mkdirSync(resolve("dist-portal", dir), { recursive: true });
        cpSync(resolve("public", dir), resolve("dist-portal", dir), { recursive: true });
      }
    },
  }],
  server: {
    host: true,
    port: 3000,
    proxy: {
      "/demo/api": { target: "http://localhost:8080", changeOrigin: true },
      "/demo/meta": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
  preview: {
    host: true,
    port: 3000,
  },
};
});
