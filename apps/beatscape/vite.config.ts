import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

function previewBase(): string {
  try {
    const html = readFileSync(new URL("./dist/index.html", import.meta.url), "utf8");
    const entry = html.match(/\bsrc=["'](\/[^"']*assets\/[^"']+\.js(?:\?[^"']*)?)["']/i)?.[1];
    const assetsIndex = entry?.indexOf("/assets/") ?? -1;
    if (entry && assetsIndex >= 0) {
      return assetsIndex === 0 ? "/" : `${entry.slice(0, assetsIndex)}/`;
    }
  } catch {
    // Vite reports the missing dist directory with its normal preview error.
  }
  return "/";
}

function redirectRootToBeatscape(): Plugin {
  return {
    name: "redirect-root-to-beatscape",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (url === "/" || url === "") {
          res.writeHead(302, { Location: "/beatscape/" });
          res.end();
          return;
        }
        if (url === "/beatscape" || url.startsWith("/beatscape?")) {
          const qs = url.includes("?") ? url.slice(url.indexOf("?")) : "";
          res.writeHead(302, { Location: `/beatscape/${qs}` });
          res.end();
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ isPreview }) => ({
  plugins: [react(), redirectRootToBeatscape()],
  // Preview the artifact that actually exists: local builds use /beatscape/,
  // while the Cloudflare release is rooted at /. This keeps manual QA and the
  // browser suite on the exact same output without a hidden environment flag.
  base: process.env.VITE_BASE ?? (isPreview ? previewBase() : "/beatscape/"),
  server: {
    port: 5175,
    host: true,
    strictPort: true,
    open: "/beatscape/",
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
}));
