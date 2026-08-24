import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function redirectRootToNeonbeat(): Plugin {
  return {
    name: "redirect-root-to-neonbeat",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/" || req.url === "") {
          res.writeHead(302, { Location: "/neonbeat/" });
          res.end();
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), redirectRootToNeonbeat()],
  base: process.env.VITE_BASE ?? "/neonbeat/",
  server: {
    port: 5174,
    host: "127.0.0.1",
    strictPort: true,
    open: "/neonbeat/",
    proxy: {
      "/demo": { target: "http://127.0.0.1:8080", changeOrigin: true },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
