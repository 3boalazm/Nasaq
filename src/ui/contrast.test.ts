import { describe, expect, it } from "vitest";

// Read the stylesheet from disk. Vitest stubs CSS imports, and this keeps @types/node out of the project.
type NodeFs = { readFileSync(path: URL, encoding: "utf8"): string };
const nodeProcess = (globalThis as { process?: { getBuiltinModule?: (id: string) => unknown } }).process;
const fs = nodeProcess?.getBuiltinModule?.("node:fs") as NodeFs | undefined;
if (!fs) throw new Error("This test needs Node's fs module");
const css = fs.readFileSync(new URL("./style.css", import.meta.url), "utf8");

/** WCAG 2.x relative luminance and contrast ratio for #rrggbb colours. */
function luminance(color: string): number {
  // Expand #rgb to #rrggbb so "#fff" and "#ffffff" mean the same colour.
  const hex = color.length === 4 ? `#${[...color.slice(1)].map((c) => c + c).join("")}` : color;
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = v.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// Each pair is a text (or control) colour and the background it sits on, as used in style.css.
const TEXT_PAIRS: Array<[string, string, string]> = [
  ["#1d1d1f", "#fafafa", "body text on page"],
  ["#4a4a4f", "#fafafa", "lead and tab text on page"],
  ["#4a4a4f", "#fff", "hint text inside a result box"],
  ["#8a4b00", "#fff", "warning inside a result box"],
  ["#a51d2d", "#fafafa", "error text on page"],
  ["#fff", "#1a5fb4", "primary button text"],
  ["#1a5fb4", "#fafafa", "active tab text"],
  ["#1d1d1f", "#fff", "table and field text"],
  ["#fff", "#6e6e75", "disabled download button text"],
];

// Non-text: the input border must be at least 3:1 against the field.
const NON_TEXT_PAIRS: Array<[string, string, string]> = [["#8a8a90", "#fff", "input border"]];

describe("M4.3 contrast of the colours used in style.css", () => {
  it.each(TEXT_PAIRS)("%s on %s (%s) is at least 4.5:1", (fg, bg) => {
    expect(css.toLowerCase()).toContain(fg);
    expect(css.toLowerCase()).toContain(bg);
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NON_TEXT_PAIRS)("%s on %s (%s) is at least 3:1", (fg, bg) => {
    expect(css.toLowerCase()).toContain(fg);
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3);
  });

  it("the disabled download button keeps 4.5:1 too, so it is readable without relying on the exemption", () => {
    expect(css).toContain(".actions button:disabled");
    expect(contrast("#fff", "#6e6e75")).toBeGreaterThanOrEqual(4.5);
  });
});
