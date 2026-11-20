import { describe, expect, it } from "vitest";
import { exists, readText, sizeOf } from "../testutil/files";

const css = readText(new URL("./style.css", import.meta.url));
const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");

describe("style.css uses logical properties only", () => {
  it("has no physical left/right property", () => {
    const physical = [
      /\b(?:margin|padding|border|inset)-(?:left|right)\b/,
      /\bborder-(?:top|bottom)-(?:left|right)-radius\b/,
      /(^|[;{\s])(?:left|right)\s*:/m,
      /\btext-align\s*:\s*(?:left|right)\b/,
      /\bfloat\s*:\s*(?:left|right)\b/,
    ];
    for (const rx of physical) {
      expect(withoutComments.match(rx)?.[0] ?? null, rx.source).toBeNull();
    }
  });

  it("uses inline-start / inline-end where the old left and right were", () => {
    expect(withoutComments).toMatch(/padding-inline-start/);
    expect(withoutComments).toMatch(/margin-inline-end/);
  });
});

describe("Arabic font and text", () => {
  it("Arabic font comes first in the stack, Outfit for Latin after it", () => {
    const root = withoutComments.match(/:root\s*\{[^}]*font-family:\s*([^;]+);/);
    expect(root?.[1]).toMatch(/^"IBM Plex Sans Arabic",\s*"Outfit"/);
  });

  it("the Arabic font files and their licence are committed", () => {
    const fonts = new URL("./fonts/", import.meta.url);
    for (const w of [400, 600, 700]) {
      const file = new URL(`ibm-plex-sans-arabic-arabic-${w}-normal.woff2`, fonts);
      expect(exists(file), file.pathname).toBe(true);
      expect(sizeOf(file)).toBeGreaterThan(1000);
    }
    const licence = readText(new URL("LICENSE-IBMPlexSansArabic.txt", fonts));
    expect(licence).toContain("SIL Open Font License");
    expect(licence).toContain("IBM Corp");
  });

  it("Arabic body text uses line-height 1.7 and no letter-spacing", () => {
    expect(withoutComments).toMatch(/:root:lang\(ar\)\s*\{[^}]*line-height:\s*1\.7/);
    expect(withoutComments).toMatch(/:lang\(ar\),\s*:lang\(ar\)\s*\*\s*\{[^}]*letter-spacing:\s*0/);
  });

  it("the stylesheet loads no font or resource from the network", () => {
    expect(css).not.toMatch(/url\(\s*["']?https?:/);
    expect(css).not.toMatch(/@import/);
  });
});
