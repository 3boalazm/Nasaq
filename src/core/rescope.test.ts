import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { rescope, newFilesFor, directionOf, renderRescopeNote } from "./rescope";
import { buildRescopeZip } from "./zip";
import { fromYaml, toYaml } from "./projectYaml";
import { filePlan } from "./plan";
import { sampleProject } from "../testutil/sample";
import { TRACKS, type Size, type Track } from "./types";

async function zipNames(blob: Blob): Promise<string[]> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return Object.keys(zip.files).filter((n) => !zip.files[n]?.dir).sort();
}

async function zipText(blob: Blob, name: string): Promise<string> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return zip.file(name)!.async("string");
}

describe("M3.1 rescope", () => {
  it.each([
    ["L", "M"],
    ["M", "S"],
    ["S", "M"],
    ["M", "L"],
  ] as const)("%s → %s changes size and appends one change record", (from, to) => {
    const p = sampleProject(from);
    const next = rescope(p, to, "Client cut scope", "Approver A", "2026-11-05");
    expect(next.size).toBe(to);
    expect(next.sizeHistory.length).toBe(p.sizeHistory.length + 1);
    const change = next.sizeHistory[next.sizeHistory.length - 1]!;
    expect(change).toEqual({
      date: "2026-11-05",
      fromSize: from,
      toSize: to,
      reason: "Client cut scope",
      approvedBy: "Approver A",
      itemsCut: [],
      itemsAdded: [],
    });
  });

  it("refuses the same size", () => {
    expect(() => rescope(sampleProject("M"), "M", "x", null, "2026-11-05")).toThrow(/already size M/);
  });

  it("refuses an empty or blank reason", () => {
    expect(() => rescope(sampleProject("S"), "M", "", null, "2026-11-05")).toThrow(/reason is required/);
    expect(() => rescope(sampleProject("S"), "M", "   ", null, "2026-11-05")).toThrow(/reason is required/);
  });

  it("refuses a date that is not real", () => {
    expect(() => rescope(sampleProject("S"), "M", "x", null, "2026-02-30")).toThrow(/real date/);
  });

  it("does not change the input project", () => {
    const p = sampleProject("S");
    rescope(p, "M", "x", null, "2026-11-05");
    expect(p.size).toBe("S");
    expect(p.sizeHistory.length).toBe(1);
  });

  it("directionOf: up when the rank grows, down otherwise", () => {
    expect(directionOf("S", "M")).toBe("up");
    expect(directionOf("M", "L")).toBe("up");
    expect(directionOf("L", "M")).toBe("down");
    expect(directionOf("M", "S")).toBe("down");
  });
});

describe("M3.2 rescope ZIP file list, four directions", () => {
  it("L → M: project.yml and RESCOPE_NOTE.md only", async () => {
    const p = rescope(sampleProject("L", "brand"), "M", "Brief changed", null, "2026-11-05");
    expect(await zipNames(await buildRescopeZip(p, "L"))).toEqual(["RESCOPE_NOTE.md", "project.yml"]);
  });

  it("M → S: project.yml and RESCOPE_NOTE.md only", async () => {
    const p = rescope(sampleProject("M", "uiux"), "S", "Brief changed", null, "2026-11-05");
    expect(await zipNames(await buildRescopeZip(p, "M"))).toEqual(["RESCOPE_NOTE.md", "project.yml"]);
  });

  it("S → M: the new PLAN.md plus project.yml and RESCOPE_NOTE.md; never PROJECT.md or the entry file", async () => {
    const p = rescope(sampleProject("S", "dev"), "M", "Scope grew", null, "2026-11-05");
    expect(await zipNames(await buildRescopeZip(p, "S"))).toEqual(["PLAN.md", "RESCOPE_NOTE.md", "project.yml"]);
  });

  it.each(TRACKS)("M → L (%s): the four L files plus project.yml and RESCOPE_NOTE.md; never PROJECT.md or PLAN.md", async (track: Track) => {
    const p = rescope(sampleProject("M", track), "L", "Scope grew", null, "2026-11-05");
    const names = await zipNames(await buildRescopeZip(p, "M"));
    const lFiles = filePlan(track, "L").filter((f) => f !== filePlan(track, "L")[0]);
    expect(names).toEqual([...lFiles.filter((f) => f !== "project.yml"), "RESCOPE_NOTE.md", "project.yml"].sort());
    expect(names).not.toContain("PROJECT.md");
    expect(names).not.toContain("PLAN.md");
  });

  it("never includes a file the user already has, in any direction", () => {
    const pairs: Array<[Size, Size]> = [["S", "M"], ["M", "L"], ["L", "M"], ["M", "S"]];
    for (const track of TRACKS) {
      for (const [from, to] of pairs) {
        const have = new Set(filePlan(track, from));
        for (const f of newFilesFor(track, from, to)) expect(have.has(f), `${track} ${from}→${to} ${f}`).toBe(false);
      }
    }
  });

  it("RESCOPE_NOTE.md gives the instructions for each direction", async () => {
    const down = rescope(sampleProject("L", "brand"), "M", "Brief changed", null, "2026-11-05");
    const downNote = renderRescopeNote(down, "L");
    expect(downNote).toContain("Frozen on 2026-11-05");
    expect(downNote).toContain("Brand_Risks.md");
    expect(downNote).toContain("Application_Tests.md");
    expect(downNote).toContain("Never dropped");
    expect(downNote).not.toContain("{{");

    const mToS = renderRescopeNote(rescope(sampleProject("M"), "S", "x", null, "2026-11-05"), "M");
    expect(mToS).toContain("Fold the open part of PLAN.md into the checklist in PROJECT.md.");

    const up = renderRescopeNote(rescope(sampleProject("S"), "M", "x", null, "2026-11-05"), "S");
    expect(up).toContain("Do not back-fill history.");
    expect(up).toContain("PLAN.md");
    expect(up).not.toContain("{{");
  });

  it("the ZIP's project.yml carries the new size and the change record", async () => {
    const p = rescope(sampleProject("S"), "M", "Scope grew", "Approver A", "2026-11-05");
    const yml = await zipText(await buildRescopeZip(p, "S"), "project.yml");
    const back = fromYaml(yml);
    expect(back.size).toBe("M");
    expect(back.sizeHistory[back.sizeHistory.length - 1]?.reason).toBe("Scope grew");
  });
});

describe("M3.3 cut step (move down only)", () => {
  it("cuts a nice item: status cut, id in itemsCut, change record written", () => {
    const p = sampleProject("M", "dev", { deliverables: 2 });
    // give one item a nice priority to cut
    const nice = { ...p, phases: p.phases.map((ph, i) => (i === 0 ? { ...ph, items: ph.items.map((it) => ({ ...it, priority: "nice" as const })) } : ph)) };
    const id = nice.phases[0]!.items[0]!.id;
    const next = rescope(nice, "S", "Client cut scope", null, "2026-11-05", { cutItemIds: [id] });
    expect(next.phases[0]!.items[0]!.status).toBe("cut");
    expect(next.sizeHistory[next.sizeHistory.length - 1]!.itemsCut).toEqual([id]);
  });

  it("refuses to cut when moving up", () => {
    const p = sampleProject("S");
    const id = p.phases[0]!.items[0]!.id;
    expect(() => rescope(p, "M", "x", null, "2026-11-05", { cutItemIds: [id] })).toThrow(/only when moving down/);
  });

  it("cutting a must item needs a typed reason, and the reason goes into the record", () => {
    const p = sampleProject("M");
    const id = p.phases[0]!.items[0]!.id; // must
    expect(() => rescope(p, "S", "x", null, "2026-11-05", { cutItemIds: [id] })).toThrow(/typed reason/);
    expect(() => rescope(p, "S", "x", null, "2026-11-05", { cutItemIds: [id], mustCutReason: "  " })).toThrow(/typed reason/);
    const next = rescope(p, "S", "x", null, "2026-11-05", { cutItemIds: [id], mustCutReason: "Client dropped it" });
    expect(next.sizeHistory[next.sizeHistory.length - 1]!.reason).toContain("Client dropped it");
  });

  it("refuses an unknown or already-cut item", () => {
    const p = sampleProject("M");
    expect(() => rescope(p, "S", "x", null, "2026-11-05", { cutItemIds: ["nope"] })).toThrow(/no item nope/);
    const id = p.phases[0]!.items[0]!.id;
    const cut = rescope(p, "S", "x", null, "2026-11-05", { cutItemIds: [id], mustCutReason: "r" });
    expect(() => rescope(cut, "S", "x", null, "2026-11-05", { cutItemIds: [id] })).toThrow(/not open|already size/);
  });
});

describe("generate → upload → rescope down → upload → rescope up (core run)", () => {
  it("round-trips through project.yml text at each step", async () => {
    const s0 = sampleProject("L", "brand");
    const up1 = fromYaml(toYaml(s0)); // upload of generated project.yml
    const down = rescope(up1, "M", "Brief changed", "Approver A", "2026-11-05");
    const zipDown = await buildRescopeZip(down, "L");
    expect(await zipNames(zipDown)).toEqual(["RESCOPE_NOTE.md", "project.yml"]);

    const up2 = fromYaml(await zipText(zipDown, "project.yml")); // upload of rescoped project.yml
    expect(up2.size).toBe("M");
    const upAgain = rescope(up2, "L", "Scope came back", null, "2026-11-12");
    const zipUp = await buildRescopeZip(upAgain, "M");
    expect(await zipNames(zipUp)).toEqual(
      ["Brand_Roadmap.md", "Brand_Risks.md", "Application_Tests.md", "Handoff.md", "RESCOPE_NOTE.md", "project.yml"].sort(),
    );
    expect(fromYaml(await zipText(zipUp, "project.yml")).sizeHistory.length).toBe(3);
  });
});
