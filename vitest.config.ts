import { defineConfig } from "vitest/config";

// Unit tests under src/. The dist scan has its own config (vitest.dist.config.ts).
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // Let tests read style.css as raw text (used by the contrast check).
    css: { include: [/\.css$/] },
  },
});
