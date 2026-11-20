import { defineConfig } from "vitest/config";

// Runs after `npm run build` (see the postbuild script): scans the built dist/ folder.
export default defineConfig({
  test: {
    include: ["scripts/**/*.test.ts"],
  },
});
