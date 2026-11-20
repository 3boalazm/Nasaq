import { describe, expect, it } from "vitest";

// Read the stylesheets from disk. Vitest stubs CSS imports, and this keeps @types/node out of the project.
type NodeFs = { readFileSync(path: URL, encoding: "utf8"): string };
const nodeProcess = (globalThis as { process?: { getBuiltinModule?: (id: string) => unknown } }).process;
const fs = nodeProcess?.getBuiltinModule?.("node:fs") as NodeFs | undefined;
if (!fs) throw new Error("This test needs Node's fs module");
const css = fs.readFileSync(new URL("./style.css", import.meta.url), "utf8");
const tokensCss = fs.readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

/** Token name -> value, read from tokens.css (the one file that defines colours, radii and shadows). */
const tokens = new Map<string, string>();
for (const m of tokensCss.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
  tokens.set(m[1]!, m[2]!.trim().toLowerCase());
}

/** WCAG 2.x relative luminance and contrast ratio for #rgb or #rrggbb colours. */
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

const colour = (name: string): string => {
  const value = tokens.get(name);
  if (!value || !value.startsWith("#")) throw new Error(`token --${name} is not a colour in tokens.css`);
  return value;
};

// Each pair is a text (or control) token and the background token it sits on, as used in style.css.
const TEXT_PAIRS: Array<[string, string, string]> = [
  ["ink", "page", "body text on the page"],
  ["ink", "surface", "body text on a white card"],
  ["ink-2", "surface", "secondary text on a card"],
  ["ink-2", "page", "lead text on the page"],
  ["ink-3", "surface", "hint text on a card"],
  ["ink-3", "page", "hint text on the page"],
  ["error", "surface", "error text on a card"],
  ["error", "page", "error text on the page"],
  ["on-accent", "accent", "primary button and selected card text"],
  ["accent-text", "accent-tint", "tip chip and done stage text"],
  ["accent", "accent-tint", "done stage text on its tint"],
  ["ink", "accent-light", "progress-chip text"],
  ["ink", "tint-brand", "brand track card text"],
  ["ink", "tint-uiux", "UI/UX track card text"],
  ["ink", "tint-dev", "development track card text"],
  ["ink-2", "tint-brand", "secondary text on the brand tint"],
  ["ink-2", "tint-uiux", "secondary text on the UI/UX tint"],
  ["ink-2", "tint-dev", "secondary text on the development tint"],
  ["alert-ink", "alert-bg", "amber alert text"],
  ["alert-ink", "surface", "over-limit text on a card"],
  ["ink", "cut", "cut segment and disabled button text"],
];

// Non-text: focus rings and the input border must be at least 3:1 against what they sit on.
const NON_TEXT_PAIRS: Array<[string, string, string]> = [
  ["line", "surface", "input border on a card"],
  ["focus", "page", "focus ring on the page"],
  ["focus", "surface", "focus ring on a card"],
];

describe("M4.3 contrast of the colour tokens", () => {
  it.each(TEXT_PAIRS)("%s on %s (%s) is at least 4.5:1", (fg, bg) => {
    expect(contrast(colour(fg), colour(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NON_TEXT_PAIRS)("%s on %s (%s) is at least 3:1", (fg, bg) => {
    expect(contrast(colour(fg), colour(bg))).toBeGreaterThanOrEqual(3);
  });

  it("the selected card keeps its text at 4.5:1 with the dark accent in both states", () => {
    expect(contrast(colour("on-accent"), colour("accent"))).toBeGreaterThanOrEqual(4.5);
  });
});

describe("S5 colour rule: tokens.css is the only place colours are defined", () => {
  it("style.css uses no raw hex colour and no rgb()/hsl() values", () => {
    // A hex colour is # followed by 3 or 6 hex digits and no letters after them (so #app or #up-file do not match).
    const raw = css.match(/#[0-9a-fA-F]{3,6}(?![0-9a-zA-Z_-])|\brgba?\(|\bhsla?\(/g) ?? [];
    expect(raw).toEqual([]);
  });

  it("every token used by style.css is defined in tokens.css", () => {
    const used = new Set(Array.from(css.matchAll(/var\(--([a-z0-9-]+)\)/g), (m) => m[1]!));
    for (const name of used) expect(tokens.has(name), `--${name}`).toBe(true);
  });

  it("the page uses the S5 radius and pill values", () => {
    expect(tokens.size).toBeGreaterThan(20);
    expect(tokensCss).toContain("--radius-card: 20px");
    expect(tokensCss).toContain("--radius-pill: 999px");
  });
});
