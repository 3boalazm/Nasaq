import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { buildZip } from "./zip";
import { filePlan } from "./plan";
import { createProject, type IntakeAnswers } from "./intake";
import { zipFileName } from "./files";
import { TRACKS, type Size, type Track } from "./types";

const base: IntakeAnswers = {
  name: "Acme Relaunch 2026!",
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

async function names(blob: Blob): Promise<string[]> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return Object.keys(zip.files).filter((n) => !zip.files[n]?.dir).sort();
}

describe("buildZip", () => {
  it.each(TRACKS)("%s S: ZIP names equal filePlan", async (track: Track) => {
    const project = createProject({ ...base, track }, "S", "2026-11-20");
    const blob = await buildZip(project);
    expect(await names(blob)).toEqual([...filePlan(track, "S" as Size)].sort());
  });

  it("every file in the ZIP is non-empty and has no leftover placeholders", async () => {
    const project = createProject(base, "S", "2026-11-20");
    const zip = await JSZip.loadAsync(await (await buildZip(project)).arrayBuffer());
    for (const name of Object.keys(zip.files)) {
      const text = await zip.files[name]!.async("string");
      expect(text.length, name).toBeGreaterThan(0);
      expect(text, name).not.toContain("{{");
    }
  });

  it("file name is {project-slug}.zip", () => {
    const project = createProject(base, "S", "2026-11-20");
    expect(zipFileName(project)).toBe("acme-relaunch-2026.zip");
  });

  it("M and L build a ZIP with their own file lists", async () => {
    for (const size of ["M", "L"] as const) {
      const project = createProject(base, size, "2026-11-20");
      const zip = await JSZip.loadAsync(await (await buildZip(project)).arrayBuffer());
      expect(Object.keys(zip.files).filter((n) => !zip.files[n]?.dir).sort()).toEqual([...filePlan("brand", size)].sort());
    }
  });
});
