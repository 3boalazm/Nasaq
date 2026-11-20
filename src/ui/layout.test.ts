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
