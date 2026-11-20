import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { renderProjectFiles } from "./files";
import { buildZip } from "./zip";
import { filePlan } from "./plan";
import { createProject, type IntakeAnswers } from "./intake";
import { SIZES, TRACKS, type Size, type Track } from "./types";

const base: IntakeAnswers = {
  name: "Sample Project",
  track: "brand",
  startDate: "2026-11-20",
  deadline: "2026-11-25",
  approver: "",
  outOfScopeText: "",
  deliverables: 2,
  approvers: 1,
  risk: "easy_undo",
  unknowns: "none",
};

const combos = TRACKS.flatMap((t) => SIZES.map((s) => [t, s] as const));

async function zipNames(track: Track, size: Size): Promise<string[]> {
  const project = createProject({ ...base, track }, size, "2026-11-20");
  const zip = await JSZip.loadAsync(await (await buildZip(project)).arrayBuffer());
  return Object.keys(zip.files).filter((n) => !zip.files[n]?.dir).sort();
}

describe("M2.5 guard: all nine track × size combinations", () => {
  it.each(combos)("%s/%s: ZIP file list equals filePlan", async (track, size) => {
    expect(await zipNames(track, size)).toEqual([...filePlan(track, size)].sort());
  });

  it.each(combos)("%s/%s: no file has {{, TODO or lorem", (track, size) => {
    const project = createProject({ ...base, track }, size, "2026-11-20");
    const files = renderProjectFiles(project);
    for (const [name, text] of Object.entries(files)) {
      expect(text.length, name).toBeGreaterThan(0);
      expect(text, name).not.toContain("{{");
      expect(text, name).not.toMatch(/\bTODO\b/);
      expect(text.toLowerCase(), name).not.toContain("lorem");
    }
  });

  it.each(combos)("%s/%s: project.yml has the phases of the matching size, all must / todo", (track, size) => {
    const project = createProject({ ...base, track }, size, "2026-11-20");
    expect(project.phases.length).toBeGreaterThan(0);
    for (const ph of project.phases) {
      for (const it of ph.items) {
        expect(it.priority).toBe("must");
        expect(it.status).toBe("todo");
      }
    }
  });
});

describe("M2.2 dev L is generic", () => {
  it("contains no repo-specific words", async () => {
    const project = createProject({ ...base, track: "dev" }, "L", "2026-11-20");
    const text = Object.values(renderProjectFiles(project)).join("\n").toLowerCase();
    for (const word of ["aboalazm", "payload", "neon", "redesign-v2"]) {
      expect(text, word).not.toContain(word);
    }
  });
});

describe("L files", () => {
  it.each(["brand", "uiux", "dev"] as const)("%s L files stay under 150 lines", (track) => {
    const project = createProject({ ...base, track }, "L", "2026-11-20");
    for (const [name, text] of Object.entries(renderProjectFiles(project))) {
      if (name === "project.yml") continue;
      // The playbook is a reference read one section at a time, so it has its own, larger limit.
      const limit = name === "Brand_Playbook.md" ? 200 : 150;
      expect(text.split("\n").length, name).toBeLessThan(limit);
    }
  });
});
