import { existsSync, readdirSync, readFileSync } from "node:fs";
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

// S5 (review fix): the built CSS must define every design token it uses. A missing import of
// tokens.css once left the page with no colours, and no test failed. These checks read the built CSS.
function builtCss(): string {
  const assets = join(dist, "assets");
  if (!existsSync(assets)) return "";
  return readdirSync(assets)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(join(assets, f), "utf8"))
    .join("\n");
}

/** Names defined as custom properties (`--name:`) in the built CSS. */
function definedTokens(css: string): Set<string> {
  return new Set(Array.from(css.matchAll(/(?:^|[;{}\s])--([a-z0-9-]+)\s*:/g), (m) => m[1]!));
}

/** The body of the first rule whose selector matches `selector`, or "" when none does. */
function ruleBodyMatching(css: string, selector: RegExp): string {
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selector.test(m[1]!.trim())) return m[2]!;
  }
  return "";
}

describe("S5 built CSS has its design tokens and input styles", () => {
  it("dist/ has a CSS file (run npm run build first)", () => {
    expect(builtCss().length, "no CSS in dist/assets").toBeGreaterThan(0);
  });

  it("every var(--name) used in the built CSS is defined in the built CSS", () => {
    const css = builtCss();
    const defined = definedTokens(css);
    const used = new Set(Array.from(css.matchAll(/var\(--([a-z0-9-]+)/g), (m) => m[1]!));
    expect(used.size).toBeGreaterThan(0);
    const missing = [...used].filter((name) => !defined.has(name));
    expect(missing, `undefined tokens: ${missing.join(", ")}`).toEqual([]);
  });

  it("the built CSS defines --page, --surface, --ink and --accent", () => {
    const defined = definedTokens(builtCss());
    for (const name of ["page", "surface", "ink", "accent"]) {
      expect(defined.has(name), `--${name}`).toBe(true);
    }
  });

  it("text, date, number and textarea fields have a 1px --line border on --surface", () => {
    const body = ruleBodyMatching(builtCss(), /input:not\(\[type=["']?checkbox/);
    expect(body, "no input rule in the built CSS").not.toBe("");
    expect(body).toMatch(/border:\s*1px solid var\(--line\)/);
    expect(body).toMatch(/background:\s*var\(--surface\)/);
    expect(builtCss()).toMatch(/textarea/);
  });

  it("every control has a visible focus ring in --focus", () => {
    const body = ruleBodyMatching(builtCss(), /input:focus-visible/);
    expect(body).toMatch(/outline:\s*3px solid var\(--focus\)/);
  });

  it("the file input button is styled as a pill, and the native input is not hidden", () => {
    const css = builtCss();
    expect(css).toMatch(/::file-selector-button/);
    expect(ruleBodyMatching(css, /input\[type=["']?file/)).not.toMatch(/display:\s*none/);
  });
});
