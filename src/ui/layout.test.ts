import { describe, expect, it } from "vitest";

// Reads style.css from disk. Vitest stubs CSS imports, so read the file directly.
type NodeFs = { readFileSync(path: URL, encoding: "utf8"): string };
const nodeProcess = (globalThis as { process?: { getBuiltinModule?: (id: string) => unknown } }).process;
const fs = nodeProcess?.getBuiltinModule?.("node:fs") as NodeFs | undefined;
if (!fs) throw new Error("This test needs Node's fs module");
const css = fs.readFileSync(new URL("./style.css", import.meta.url), "utf8");

/** The body of the first rule whose selector matches `selector` exactly (whitespace-insensitive). */
function ruleBody(selector: string): string {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*");
  const m = new RegExp(`(^|\\})\\s*${esc}\\s*\\{([^}]*)\\}`, "m").exec(css);
  if (!m) throw new Error(`no rule for ${selector}`);
  return m[2]!;
}

// These are CSS rule checks. They are NOT a layout measurement: the page width at 320, 375 and 1280 px
// must be measured in a real browser (see HANDOFF.md).
describe("overflow rules in style.css (regression guard, not a layout measurement)", () => {
  it("every box uses border-box sizing, so padding and borders stay inside the column", () => {
    expect(ruleBody("*,\n*::before,\n*::after")).toMatch(/box-sizing:\s*border-box/);
  });

  it("the form and each field use a column that can shrink (minmax(0, 1fr))", () => {
    expect(ruleBody(".intake")).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(ruleBody(".field")).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(ruleBody(".field")).toMatch(/min-width:\s*0/);
  });

  it("text inputs, selects and textareas are full width of their column and not wider", () => {
    const body = ruleBody('input:not([type="checkbox"]):not([type="radio"]),\nselect,\ntextarea');
    expect(body).toMatch(/width:\s*100%/);
    expect(body).toMatch(/max-width:\s*100%/);
    expect(body).toMatch(/min-width:\s*0/);
  });

  it("the tabs wrap instead of running off a 320 px screen", () => {
    expect(ruleBody(".tabs")).toMatch(/flex-wrap:\s*wrap/);
  });

  it("the history table scrolls inside its own box", () => {
    expect(ruleBody(".table-wrap")).toMatch(/overflow-x:\s*auto/);
  });

  it("long words wrap on the page", () => {
    expect(ruleBody("body")).toMatch(/overflow-wrap:\s*anywhere/);
  });
});

// S5 rules read from the stylesheets. These are regression guards on the CSS, not a layout measurement.
const tokensCss = fs.readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

/** The text inside the first @media block whose query matches `query`, or "" when there is none. */
function mediaBody(query: string): string {
  const start = css.indexOf(`@media (${query})`);
  if (start < 0) return "";
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return "";
}

describe("S5 layout and motion rules (regression guard, not a layout measurement)", () => {
  it("below 900px the wizard and the dashboard are one column", () => {
    expect(ruleBody(".intake")).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(ruleBody(".bento")).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  it("from 900px the wizard has a step column and a summary column, and the dashboard has three", () => {
    const wide = mediaBody("min-width: 900px");
    expect(wide).toMatch(/\.intake\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*18rem\)/);
    expect(wide).toMatch(/\.bento\s*\{[^}]*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  });

  it("every transition and animation is 150ms or shorter", () => {
    const durations = [...(css + tokensCss).matchAll(/(\d+(?:\.\d+)?)(ms|s)\b/g)].map((m) =>
      m[2] === "s" ? Number(m[1]) * 1000 : Number(m[1]),
    );
    expect(durations.length).toBeGreaterThan(0);
    for (const d of durations) expect(d).toBeLessThanOrEqual(150);
  });

  it("reduced motion turns transitions and animations off", () => {
    const body = mediaBody("prefers-reduced-motion: reduce");
    expect(body).toMatch(/transition:\s*none\s*!important/);
    expect(body).toMatch(/animation:\s*none\s*!important/);
  });

  it("the Outfit font is bundled from the repository, and its licence file is committed", () => {
    expect(css).toContain('font-family: "Outfit"');
    expect(css).toMatch(/url\("\.\/fonts\/outfit-latin-400-normal\.woff2"\)/);
    const licence = fs.readFileSync(new URL("./fonts/LICENSE-Outfit.txt", import.meta.url), "utf8");
    expect(licence).toContain("SIL Open Font License");
  });

  it("the page uses no web font or stylesheet from another host", () => {
    expect(css).not.toMatch(/@import/);
    expect(css).not.toMatch(/url\(\s*["']?https?:/);
  });
});

describe("S5 input styling in the source stylesheet", () => {
  it("text, date, number and textarea fields have a 1px --line border on a --surface background", () => {
    const body = ruleBody('input:not([type="checkbox"]):not([type="radio"]),\nselect,\ntextarea');
    expect(body).toMatch(/border:\s*1px solid var\(--line\)/);
    expect(body).toMatch(/background:\s*var\(--surface\)/);
  });

  it("focus shows a 3px --focus ring on inputs and buttons", () => {
    expect(ruleBody("input:focus-visible,\nselect:focus-visible,\ntextarea:focus-visible,\nbutton:focus-visible,\nlabel:has(input:focus-visible)")).toMatch(
      /outline:\s*3px solid var\(--focus\)/,
    );
  });
});
