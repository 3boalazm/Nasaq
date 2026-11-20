import { describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import JSZip from "jszip";
import { projectSlug, zipFileName, renderProjectFiles } from "./files";
import { readProjectYaml, TOO_LARGE_MESSAGE } from "./readProject";
import { toYaml } from "./projectYaml";
import { buildZip } from "./zip";
import { filePlan } from "./plan";
import { MAX_PROJECT_YAML_BYTES } from "./thresholds";
import { sampleProject } from "../testutil/sample";
import { TRACKS, SIZES } from "./types";

const SAFE_ZIP_NAME = /^[a-z0-9][a-z0-9-]*\.zip$/;

describe("M4.1 project name becomes a safe file name", () => {
  it.each([
    ["../../etc/passwd", "etc-passwd"],
    ["a/b\\c", "a-b-c"],
    ["Nasaq مشروع 2026", "nasaq-2026"],
    ["<b>x</b>", "b-x-b"],
    ["Café Résumé", "cafe-resume"],
  ])("%j becomes %j", (name, slug) => {
    expect(projectSlug(name)).toBe(slug);
  });

  it.each(["مشروع", "   ", "", "...", "../", "///", "%%%"])("%j has no usable letters, so it falls back to project", (name) => {
    expect(projectSlug(name)).toBe("project");
    expect(zipFileName({ ...sampleProject("S"), name })).toBe("project.zip");
  });

  it("Windows device names get a prefix", () => {
    expect(projectSlug("CON")).toBe("project-con");
    expect(projectSlug("com1")).toBe("project-com1");
  });

  it("long names are capped and never end with a dash", () => {
    const slug = projectSlug("a".repeat(200) + " b");
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("the ZIP name is always safe for hostile or non-Latin names", () => {
    const names = ["../../x", "a/b", "مشروع", "C:\\temp\\evil", "<img src=x onerror=alert(1)>", "con", "x".repeat(300)];
    for (const name of names) {
      const file = zipFileName({ ...sampleProject("S"), name });
      expect(file, name).toMatch(SAFE_ZIP_NAME);
    }
  });

  it("ZIP entry names are fixed and never come from the project name", async () => {
    const hostile = { ...sampleProject("L", "dev"), name: "../../evil/مشروع" };
    const zip = await JSZip.loadAsync(await (await buildZip(hostile)).arrayBuffer());
    const entries = Object.keys(zip.files);
    expect(entries.sort()).toEqual([...filePlan("dev", "L")].sort());
    for (const e of entries) expect(e, e).toMatch(/^[A-Za-z_]+\.(md|yml)$/);
    // The name is still shown as text inside the files.
    expect(renderProjectFiles(hostile)["AGENTS.md"]).toContain("../../evil/مشروع");
  });
});

describe("M4.1 project.yml reading never crashes", () => {
  const hostile = [
    "name: [unclosed",
    "a: b: c",
    "- a\n- b",
    "42",
    "null",
    "just some text",
    "name: x\nname: y",
    "a: &a [*a, *a]",
    "---\n---\n",
    "\u0000\u0001\u0002",
    "{",
    "name: 'unterminated",
  ];

  it.each(hostile)("%j gives a message, not a throw", (text) => {
    const r = readProjectYaml(text);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
  });

  it("a file that is only a list says it must be a mapping", () => {
    const r = readProjectYaml("- a\n- b");
    expect(r).toEqual({ ok: false, error: "project.yml must contain a mapping at the top level" });
  });

  it("a file over 1 MB is refused before parsing, counting bytes not characters", () => {
    // 600,000 Arabic letters are 1.2 MB in UTF-8 but only 600,000 characters.
    const big = "name: " + "م".repeat(600_000);
    expect(big.length).toBeLessThan(MAX_PROJECT_YAML_BYTES);
    expect(readProjectYaml(big)).toEqual({ ok: false, error: TOO_LARGE_MESSAGE });
  });

  it("a file of exactly the limit is not refused for size", () => {
    const text = "x".repeat(MAX_PROJECT_YAML_BYTES);
    const r = readProjectYaml(text);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).not.toBe(TOO_LARGE_MESSAGE);
  });

  it("the size message says what the limit is", () => {
    expect(TOO_LARGE_MESSAGE).toMatch(/larger than 1 MB/);
  });

  it("a generated project.yml for every track and size is still accepted", () => {
    for (const t of TRACKS) for (const s of SIZES) {
      const r = readProjectYaml(toYaml(sampleProject(s, t)));
      expect(r.ok, `${t}/${s}`).toBe(true);
    }
  });
});

describe("M4.1 unknown fields are a clear error at every level", () => {
  function edited(mutate: (doc: Record<string, unknown>) => void): string {
    const doc = parse(toYaml(sampleProject("M", "dev"))) as Record<string, unknown>;
    mutate(doc);
    return stringify(doc);
  }

  it("top level", () => {
    const r = readProjectYaml(edited((d) => (d["colour"] = "red")));
    expect(r).toEqual({
      ok: false,
      error: 'unknown field "colour" in project.yml (top level). Remove it or fix the spelling.',
    });
  });

  it("inside a phase item", () => {
    const r = readProjectYaml(
      edited((d) => {
        const items = (d["phases"] as Array<{ items: Array<Record<string, unknown>> }>)[0]!.items;
        items[0]!["owner"] = "someone";
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/unknown field "owner" in project\.yml \(phases\[0\]\.items\[0\]\)/);
  });

  it("inside a phase", () => {
    const r = readProjectYaml(edited((d) => ((d["phases"] as Array<Record<string, unknown>>)[0]!["due"] = "2026-12-01")));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/unknown field "due" .*phases\[0\]/);
  });

  it("inside a size history record", () => {
    const r = readProjectYaml(
      edited((d) => {
        d["sizeHistory"] = [
          { date: "2026-11-02", fromSize: "S", toSize: "M", reason: "x", approvedBy: "A", itemsCut: [], itemsAdded: [], note: "y" },
        ];
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/unknown field "note" .*sizeHistory\[0\]/);
  });
});
