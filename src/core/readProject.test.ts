import { describe, expect, it } from "vitest";
import { readProjectYaml } from "./readProject";
import { toYaml } from "./projectYaml";
import { sampleProject } from "../testutil/sample";

describe("readProjectYaml (upload)", () => {
  it("reads a generated project.yml", () => {
    const r = readProjectYaml(toYaml(sampleProject("M")));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.project.size).toBe("M");
  });

  it("empty file: a message, not a throw", () => {
    expect(readProjectYaml("  \n")).toEqual({ ok: false, error: "The file is empty." });
  });

  it("invalid YAML: a message that names the problem", () => {
    const r = readProjectYaml("name: [unclosed");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/not valid YAML/);
  });

  it("valid YAML but not a project: a message that names the field", () => {
    const r = readProjectYaml("name: x\ntrack: nope\nsize: S\nstartDate: 2026-11-01\n");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/track/);
  });
});
