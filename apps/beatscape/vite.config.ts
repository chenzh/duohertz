import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function redirectRootToBeatscape(): Plugin {
  return {
    name: "redirect-root-to-beatscape",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/" || req.url === "") {
          res.writeHead(302, { Location: "/beatscape/" });
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
    host: "127.0.0.1",
    strictPort: true,
    open: "/beatscape/",
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
