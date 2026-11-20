import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
  },
  preview: {
    host: "0.0.0.0",
    // Sandbox preview links are served from *.e2b.app; allow that host for `npm run preview`.
    allowedHosts: [".e2b.app"],
  },
});
