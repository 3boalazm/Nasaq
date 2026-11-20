import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { rescope, newFilesFor, directionOf, renderRescopeNote, rescopeZipFiles } from "./rescope";
import { buildRescopeZip } from "./zip";
import { fromYaml, toYaml } from "./projectYaml";
import { filePlan, ENTRY_FILE } from "./plan";
import { sampleProject } from "../testutil/sample";
import { TRACKS, type Size, type Track } from "./types";

const DATE = "2026-11-05";
const APPROVER = "Approver A";

async function zipNames(blob: Blob): Promise<string[]> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return Object.keys(zip.files).filter((n) => !zip.files[n]?.dir).sort();
}

async function zipText(blob: Blob, name: string): Promise<string> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return zip.file(name)!.async("string");
}

/** Expected ZIP file names for a direction, written out per track (no derived lists). */
const L_FILES: Record<Track, string[]> = {
  brand: ["Application_Tests.md", "Brand_Playbook.md", "Brand_Risks.md", "Brand_Roadmap.md", "Handoff.md"],
  uiux: ["UX_Risks.md", "UX_Roadmap.md", "UX_Tests.md", "Handoff.md"],
  dev: ["Handoff.md", "Implementation.md", "Security_issues.md", "Test_scenarios.md"],
};
const ENTRY: Record<Track, string> = { brand: "README.md", uiux: "README.md", dev: "AGENTS.md" };

function expectedZip(track: Track, from: Size, to: Size): string[] {
  const base = [ENTRY[track], "RESCOPE_NOTE.md", "project.yml"];
  const key = `${from}-${to}`;
  const added: Record<string, string[]> = {
    "S-M": ["PLAN.md"],
    "S-L": L_FILES[track],
    "M-L": L_FILES[track],
    "L-M": ["PLAN.md", "PROJECT.md"],
    "L-S": ["PROJECT.md"],
    "M-S": [],
  };
  return [...base, ...added[key]!].sort();
}

const SIX: Array<[Size, Size]> = [
  ["S", "M"],
  ["S", "L"],
  ["M", "L"],
  ["L", "M"],
  ["L", "S"],
  ["M", "S"],
];

describe("M3.1 rescope", () => {
  it.each(SIX)("%s → %s changes size and appends one change record", (from, to) => {
    const p = sampleProject(from);
    const next = rescope(p, to, "Client cut scope", APPROVER, DATE);
    expect(next.size).toBe(to);
    expect(next.sizeHistory.length).toBe(p.sizeHistory.length + 1);
    expect(next.sizeHistory[next.sizeHistory.length - 1]).toEqual({
      date: DATE,
      fromSize: from,
      toSize: to,
      reason: "Client cut scope",
      approvedBy: APPROVER,
      itemsCut: [],
      itemsAdded: [],
    });
  });

  it("refuses the same size", () => {
    expect(() => rescope(sampleProject("M"), "M", "x", APPROVER, DATE)).toThrow(/already size M/);
  });

  it("refuses an empty or blank reason", () => {
    expect(() => rescope(sampleProject("S"), "M", "", APPROVER, DATE)).toThrow(/reason is required/);
    expect(() => rescope(sampleProject("S"), "M", "   ", APPROVER, DATE)).toThrow(/reason is required/);
  });

  it("refuses a missing, empty or blank approver (approvedBy is required for a rescope)", () => {
    for (const bad of ["", "   ", null as unknown as string, undefined as unknown as string]) {
      expect(() => rescope(sampleProject("S"), "M", "x", bad, DATE), JSON.stringify(bad)).toThrow(/approved/);
    }
  });

  it("refuses a date that is not real", () => {
    expect(() => rescope(sampleProject("S"), "M", "x", APPROVER, "2026-02-30")).toThrow(/real date/);
  });

  it("does not change the input project", () => {
    const p = sampleProject("S");
    rescope(p, "M", "x", APPROVER, DATE);
    expect(p.size).toBe("S");
    expect(p.sizeHistory.length).toBe(1);
  });

  it("directionOf: up when the rank grows, down otherwise", () => {
    expect(directionOf("S", "M")).toBe("up");
    expect(directionOf("M", "L")).toBe("up");
    expect(directionOf("S", "L")).toBe("up");
    expect(directionOf("L", "M")).toBe("down");
    expect(directionOf("M", "S")).toBe("down");
    expect(directionOf("L", "S")).toBe("down");
  });
});

describe("M3.2 rescope ZIP: file list for all six directions, all tracks", () => {
  it.each(TRACKS.flatMap((t) => SIX.map(([f, to]) => [t, f, to] as const)))(
    "%s %s → %s: exact ZIP file list",
    async (track: Track, from: Size, to: Size) => {
      const p = rescope(sampleProject(from, track), to, "Scope change", APPROVER, DATE);
      expect(await zipNames(await buildRescopeZip(p, from))).toEqual(expectedZip(track, from, to));
    },
  );

  it.each(TRACKS.flatMap((t) => SIX.map(([f, to]) => [t, f, to] as const)))(
    "%s %s → %s: no file the user already has, except the regenerated entry file and project.yml",
    (track: Track, from: Size, to: Size) => {
      const p = rescope(sampleProject(from, track), to, "Scope change", APPROVER, DATE);
      const have = new Set(filePlan(track, from));
      const replaced = new Set([ENTRY_FILE[track], "project.yml"]);
      for (const name of Object.keys(rescopeZipFiles(p, from))) {
        if (replaced.has(name) || name === "RESCOPE_NOTE.md") continue;
        expect(have.has(name), name).toBe(false);
      }
    },
  );

  it("newFilesFor matches the rule for every direction (brand)", () => {
    expect(newFilesFor("brand", "S", "M")).toEqual(["PLAN.md"]);
    expect(newFilesFor("brand", "L", "M")).toEqual(["PROJECT.md", "PLAN.md"]);
    expect(newFilesFor("brand", "L", "S")).toEqual(["PROJECT.md"]);
    expect(newFilesFor("brand", "M", "S")).toEqual([]);
    // plan order, not alphabetical
    const brandL = ["Brand_Roadmap.md", "Brand_Risks.md", "Application_Tests.md", "Handoff.md", "Brand_Playbook.md"];
    expect(newFilesFor("brand", "S", "L")).toEqual(brandL);
    expect(newFilesFor("brand", "M", "L")).toEqual(brandL);
  });

  it("the regenerated entry file states the new size", async () => {
    const p = rescope(sampleProject("L", "dev"), "S", "Scope change", APPROVER, DATE);
    const agents = await zipText(await buildRescopeZip(p, "L"), "AGENTS.md");
    expect(agents).toContain("Size: S.");
  });

  it("the ZIP's project.yml carries the new size and the change record", async () => {
    const p = rescope(sampleProject("S"), "M", "Scope grew", APPROVER, DATE);
    const back = fromYaml(await zipText(await buildRescopeZip(p, "S"), "project.yml"));
    expect(back.size).toBe("M");
    expect(back.sizeHistory[back.sizeHistory.length - 1]).toMatchObject({ approvedBy: APPROVER, reason: "Scope grew" });
  });
});

describe("RESCOPE_NOTE.md instructions for each direction", () => {
  it("L → M and L → S: freeze the risk and test files; carry open items into the new PROJECT.md baseline", () => {
    const toM = renderRescopeNote(rescope(sampleProject("L", "brand"), "M", "x", APPROVER, DATE), "L");
    expect(toM).toContain("Frozen on 2026-11-05");
    expect(toM).toContain("Brand_Risks.md");
    expect(toM).toContain("Application_Tests.md");
    expect(toM).toContain("Baseline checklist of the new PROJECT.md");
    const toS = renderRescopeNote(rescope(sampleProject("L", "uiux"), "S", "x", APPROVER, DATE), "L");
    expect(toS).toContain("UX_Risks.md");
    expect(toS).toContain("Baseline checklist of the new PROJECT.md");
    expect(toS).not.toContain("Fold the open part of PLAN.md");
  });

  it("M → S: fold PLAN.md into the PROJECT.md checklist", () => {
    const note = renderRescopeNote(rescope(sampleProject("M"), "S", "x", APPROVER, DATE), "M");
    expect(note).toContain("Fold the open part of PLAN.md into the checklist in PROJECT.md.");
  });

  it("S → M, S → L, M → L: going up, add the new files; do not back-fill; one-paragraph baseline", () => {
    for (const [from, to] of [["S", "M"], ["S", "L"], ["M", "L"]] as const) {
      const note = renderRescopeNote(rescope(sampleProject(from), to, "x", APPROVER, DATE), from);
      expect(note).toContain("Do not back-fill history.");
      expect(note).toContain("one-paragraph baseline");
    }
  });

  it("the file table says which files to replace and which are new", () => {
    const note = renderRescopeNote(rescope(sampleProject("L", "dev"), "M", "x", APPROVER, DATE), "L");
    expect(note).toContain("`project.yml`: replace your current file");
    expect(note).toContain("`AGENTS.md`: replace your current file");
    expect(note).toContain("`PROJECT.md`: new.");
    expect(note).toContain("`PLAN.md`: new.");
    expect(note).not.toContain("{{");
  });

  it("the change record shows the approver", () => {
    const note = renderRescopeNote(rescope(sampleProject("S"), "M", "x", "Jane Approver", DATE), "S");
    expect(note).toContain("| Approved by | Jane Approver |");
  });
});

describe("M3.3 cut step (move down only)", () => {
  it("cuts a nice item: status cut, id in itemsCut, change record written", () => {
    const p = sampleProject("M", "dev", { deliverables: 2 });
    const nice = { ...p, phases: p.phases.map((ph, i) => (i === 0 ? { ...ph, items: ph.items.map((it) => ({ ...it, priority: "nice" as const })) } : ph)) };
    const id = nice.phases[0]!.items[0]!.id;
    const next = rescope(nice, "S", "Client cut scope", APPROVER, DATE, { cutItemIds: [id] });
    expect(next.phases[0]!.items[0]!.status).toBe("cut");
    expect(next.sizeHistory[next.sizeHistory.length - 1]!.itemsCut).toEqual([id]);
  });

  it("refuses to cut when moving up", () => {
    const p = sampleProject("S");
    const id = p.phases[0]!.items[0]!.id;
    expect(() => rescope(p, "M", "x", APPROVER, DATE, { cutItemIds: [id] })).toThrow(/only when moving down/);
  });

  it("cutting a must item needs a typed reason, and the reason goes into the record", () => {
    const p = sampleProject("M");
    const id = p.phases[0]!.items[0]!.id; // must
    expect(() => rescope(p, "S", "x", APPROVER, DATE, { cutItemIds: [id] })).toThrow(/typed reason/);
    expect(() => rescope(p, "S", "x", APPROVER, DATE, { cutItemIds: [id], mustCutReason: "  " })).toThrow(/typed reason/);
    const next = rescope(p, "S", "x", APPROVER, DATE, { cutItemIds: [id], mustCutReason: "Client dropped it" });
    expect(next.sizeHistory[next.sizeHistory.length - 1]!.reason).toContain("Client dropped it");
  });

  it("refuses an unknown or already-cut item", () => {
    const p = sampleProject("M");
    expect(() => rescope(p, "S", "x", APPROVER, DATE, { cutItemIds: ["nope"] })).toThrow(/no item nope/);
    const id = p.phases[0]!.items[0]!.id;
    const cut = rescope(p, "S", "x", APPROVER, DATE, { cutItemIds: [id], mustCutReason: "r" });
    expect(() => rescope(cut, "S", "x", APPROVER, DATE, { cutItemIds: [id] })).toThrow(/not open|already size/);
  });
});

describe("generate → upload → rescope down → upload → rescope up (core run)", () => {
  it("round-trips through project.yml text at each step", async () => {
    const s0 = sampleProject("L", "brand");
    const up1 = fromYaml(toYaml(s0)); // upload of generated project.yml
    const down = rescope(up1, "M", "Brief changed", APPROVER, DATE);
    const zipDown = await buildRescopeZip(down, "L");
    expect(await zipNames(zipDown)).toEqual(expectedZip("brand", "L", "M"));

    const up2 = fromYaml(await zipText(zipDown, "project.yml")); // upload of rescoped project.yml
    expect(up2.size).toBe("M");
    const upAgain = rescope(up2, "L", "Scope came back", APPROVER, "2026-11-12");
    const zipUp = await buildRescopeZip(upAgain, "M");
    expect(await zipNames(zipUp)).toEqual(expectedZip("brand", "M", "L"));
    expect(fromYaml(await zipText(zipUp, "project.yml")).sizeHistory.length).toBe(3);
  });
});
