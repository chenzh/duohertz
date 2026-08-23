import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/demo/" : "/",
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      "/demo/api": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
  preview: {
    host: true,
    port: 3000,
  },
}));
