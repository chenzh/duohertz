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

function isolateDuohertzV2Preview(): Plugin {
  return {
    name: "isolate-duohertz-v2-preview",
    apply: "serve",
    transformIndexHtml: {
      order: "pre",
      handler(html, context) {
        // Keep the legacy catalog preload in production release HTML. Only
        // development v2 routes omit it, so they do not fetch v1 data at all.
        if (!context.originalUrl?.startsWith("/beatscape/lab/duohertz/v2/")) return;
        return html.replace(/<link\s+rel="preload"\s+as="fetch"\s+href="[^"]*catalog\.json"\s*\/>/, "");
      },
    },
  };
}

function duohertzStandaloneHtml(): Plugin {
  return {
    name: "duohertz-standalone-html",
    apply: "build",
    transformIndexHtml: {
      order: "pre",
      handler() {
        // Both standalone artifacts start noindex and without legacy public
        // files. Only a separately signed release packager may promote one.
        return readFileSync(new URL("./duohertz-index.html", import.meta.url), "utf8");
      },
    },
  };
}

export default defineConfig(({ isPreview }) => {
  const duohertzPreview = process.env.VITE_DUOHERTZ_PREVIEW === "1";
  const duohertzSource = process.env.VITE_DUOHERTZ_RELEASE_SOURCE === "1";
  if (duohertzPreview && duohertzSource) {
    throw new Error("Choose either duohertz preview or release source build");
  }
  const duohertzStandalone = duohertzPreview || duohertzSource;
  return {
    plugins: duohertzStandalone
      ? [react(), duohertzStandaloneHtml()]
      : [react(), redirectRootToBeatscape(), isolateDuohertzV2Preview()],
    // Keep both new-brand builds isolated and noindex. The source variant has
    // production UI behavior but still lacks approved content and site signoff.
    publicDir: duohertzStandalone ? false : undefined,
    build: duohertzStandalone ? { outDir: duohertzPreview ? "dist-duohertz" : "dist-duohertz-source" } : undefined,
    base: duohertzStandalone ? "/" : process.env.VITE_BASE ?? (isPreview ? previewBase() : "/beatscape/"),
    server: {
      port: 5175,
      host: true,
      strictPort: true,
      open: duohertzStandalone ? "/" : "/beatscape/",
    },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  };
});
