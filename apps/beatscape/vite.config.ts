import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

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

export default defineConfig({
  plugins: [react(), redirectRootToBeatscape()],
  base: process.env.VITE_BASE ?? "/beatscape/",
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
});
