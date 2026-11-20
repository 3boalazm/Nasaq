import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { findUrls, listFiles, scanDir } from "./url-scan";

// M4.2: the built page makes no requests to other origins. This test scans dist/ after `npm run build`.
// Only license text (block comments) may contain URLs. The two entries below are URLs that bundled
// dependencies keep in code strings (error hints); each must match exactly once, or the test fails.
const KNOWN_DEPENDENCY_TEXT: Array<{ url: string; where: string }> = [
  {
    url: "https://rolldown.rs/in-depth/bundling-cjs#require-external-modules",
    where: "bundler helper: error text when a CommonJS require() cannot be resolved",
  },
  {
    url: "https://stuk.github.io/jszip/documentation/howto/read_zip.html",
    where: "jszip: error hint text when a ZIP cannot be read",
  },
];

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");

describe("scan logic", () => {
  it("finds a URL in code", () => {
    const hits = findUrls("a.js", "const x = 'https://example.com/a';");
    expect(hits).toEqual([{ file: "a.js", url: "https://example.com/a", inComment: false }]);
  });

  it("marks a URL inside a block comment as comment text", () => {
    const hits = findUrls("a.js", "/*! License: https://license.example */ var y = 1;");
    expect(hits.map((h) => h.inComment)).toEqual([true]);
  });

  it("does not hide a code URL that follows a comment", () => {
    const hits = findUrls("a.js", "/* https://ok.example */ fetch('http://bad.example');");
    expect(hits.map((h) => [h.url, h.inComment])).toEqual([
      ["https://ok.example", true],
      ["http://bad.example", false],
    ]);
  });

  it("treats // line comments as code, not as an exemption", () => {
    const hits = findUrls("a.js", "// see https://line.example\n");
    expect(hits[0]?.inComment).toBe(false);
  });
});

describe("M4.2 built dist/ has no URLs outside license comments", () => {
  it("dist/ exists (run npm run build first)", () => {
    expect(existsSync(join(dist, "index.html")), "dist/index.html is missing: run npm run build").toBe(true);
    expect(listFiles(dist).length).toBeGreaterThan(0);
  });

  it("every http:// and https:// in dist/ is a comment or a known dependency string", () => {
    const hits = scanDir(dist).filter((h) => !h.inComment);
    const unexpected = hits.filter((h) => !KNOWN_DEPENDENCY_TEXT.some((k) => k.url === h.url));
    expect(unexpected, unexpected.map((h) => `${h.file}: ${h.url}`).join("\n")).toEqual([]);
  });

  it.each(KNOWN_DEPENDENCY_TEXT)("$url appears exactly once, in code ($where)", ({ url }) => {
    const count = scanDir(dist).filter((h) => !h.inComment && h.url === url).length;
    expect(count).toBe(1);
  });
});
