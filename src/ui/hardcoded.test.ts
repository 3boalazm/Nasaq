import { describe, expect, it } from "vitest";
import { listDir, readText } from "../testutil/files";

// Scans the page's UI modules for English words in string literals. The i18n files are the only
// place where English UI text may live.
const UI_DIR = new URL(".", import.meta.url);

/** Lines that hold class names, ids, attributes or code, not text a person reads. */
const CODE_LINE = /className|classList|setAttribute|getAttribute|dataset|querySelector|htmlFor|\bid:|\bid=|role|type:|accept|name:|value:|hidden|dir:|lang:|\bimport\b|\bexport type\b|\bthrow\b|keys?\(|\.key\b|\bcase\b|key ===|event\.key|font-family|url\(|format\(/;
const LITERAL = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`([^`\n]*)`/g;

/** Class names and short tokens look like `card card-wide` or `f-name`: lowercase words joined by hyphens. */
const CLASS_LIKE = /^[a-z0-9_-]+( [a-z0-9_-]+)*$/;

/** A literal is English UI text when it has 3+ letters and reads as words: a capital or a space. */
function looksLikeEnglish(text: string): boolean {
  if (!/[A-Za-z]{3,}/.test(text)) return false;
  if (CLASS_LIKE.test(text)) return false;
  return /\s/.test(text) || /^[A-Z]/.test(text);
}

interface Hit {
  file: string;
  line: number;
  text: string;
}

function scan(): Hit[] {
  const hits: Hit[] = [];
  for (const file of listDir(UI_DIR)) {
    if (!file.endsWith(".ts") || file.endsWith(".test.ts")) continue;
    const lines = readText(new URL(file, UI_DIR)).split("\n");
    lines.forEach((raw: string, i: number) => {
      // Comments are not UI text.
      const trimmed = raw.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return;
      const line = raw.replace(/\/\/.*$/, "");
      if (CODE_LINE.test(line)) return;
      for (const m of line.matchAll(LITERAL)) {
        // Template literals: drop ${...} code, keep the words around it.
        const text = (m[1] ?? m[2] ?? m[3] ?? "").replace(/\$\{[^}]*\}/g, "").trim();
        if (looksLikeEnglish(text)) hits.push({ file, line: i + 1, text });
      }
    });
  }
  return hits;
}

describe("UI text lives in the i18n files", () => {
  it("no UI module (src/ui/*.ts) has hard-coded English text", () => {
    const hits = scan();
    expect(hits.map((h) => `${h.file}:${h.line} ${JSON.stringify(h.text)}`)).toEqual([]);
  });

  it("the scan finds English when it is there (checks the scanner itself)", () => {
    expect(looksLikeEnglish("Enter a project name.")).toBe(true);
    expect(looksLikeEnglish("Back")).toBe(true);
    expect(looksLikeEnglish("card card-wide")).toBe(false);
    expect(looksLikeEnglish("f-name")).toBe(false);
    expect(looksLikeEnglish("project.yml")).toBe(false);
    expect(looksLikeEnglish("✓")).toBe(false);
  });
});
