import { describe, expect, it } from "vitest";
import { createProject, fieldErrors, validateAnswers, INTAKE_FIELDS, type IntakeAnswers } from "./intake";
import { describeItem, describeItems, status } from "./status";
import { rescope, renderRescopeNote } from "./rescope";
import { sampleProject, SAMPLE_ANSWERS } from "../testutil/sample";
import { SIZES, TRACKS, type Project } from "./types";

const DATE = "2026-11-05";
const APPROVER = "Approver A";

/** Sample project whose first item is a nice item, so it can be cut when moving down. */
function niceProject(title = "Workshop"): Project {
  const p = sampleProject("M", "dev", { deliverables: 2 });
  return {
    ...p,
    phases: p.phases.map((ph, i) =>
      i === 0
        ? { ...ph, items: ph.items.map((it, j) => (j === 0 ? { ...it, title, priority: "nice" as const } : it)) }
        : ph,
    ),
  };
}

describe("initial sizing record: itemsAdded is empty in v1", () => {
  it.each(TRACKS.flatMap((t) => SIZES.map((s) => [t, s] as const)))("%s/%s: itemsAdded is []", (track, size) => {
    const p = createProject({ ...SAMPLE_ANSWERS, track }, size, "2026-11-01");
    expect(p.sizeHistory).toHaveLength(1);
    expect(p.sizeHistory[0]!.itemsAdded).toEqual([]);
    expect(p.sizeHistory[0]!.itemsCut).toEqual([]);
    // The items themselves are still there; only the change record is empty.
    expect(p.phases.flatMap((ph) => ph.items).length).toBeGreaterThan(0);
  });
});

describe("field errors", () => {
  const ok: IntakeAnswers = { ...SAMPLE_ANSWERS };

  it("a valid form has no field errors", () => {
    expect(fieldErrors(ok)).toEqual({});
    expect(validateAnswers(ok)).toEqual([]);
  });

  it("each invalid field has its own message, keyed by field", () => {
    const e = fieldErrors({ ...ok, name: " ", deliverables: NaN, risk: "" });
    expect(Object.keys(e).sort()).toEqual(["deliverables", "name", "risk"]);
    expect(e.name).toBe("Enter a project name.");
  });

  it("validateAnswers keeps the old messages, in form order", () => {
    const msgs = validateAnswers({ ...ok, unknowns: "x", name: "" });
    expect(msgs).toEqual(["Enter a project name.", "Choose an unknowns level."]);
  });

  it("INTAKE_FIELDS lists the eight fields in form order", () => {
    expect(INTAKE_FIELDS).toEqual(["name", "track", "startDate", "deadline", "deliverables", "approvers", "risk", "unknowns"]);
  });
});

describe("cut items are written as \"title (id)\"", () => {
  it("describeItem gives title and id, and falls back to the bare id", () => {
    const p = niceProject("Workshop");
    const id = p.phases[0]!.items[0]!.id;
    expect(describeItem(p, id)).toBe(`Workshop (${id})`);
    expect(describeItem(p, "missing-9")).toBe("missing-9");
    expect(describeItems(p, [id, "missing-9"])).toEqual([`Workshop (${id})`, "missing-9"]);
  });

  it("the rescope note lists cut items as title (id), not the bare id", () => {
    const p = niceProject("Workshop");
    const id = p.phases[0]!.items[0]!.id;
    const next = rescope(p, "S", "Client cut scope", APPROVER, DATE, { cutItemIds: [id] });
    const note = renderRescopeNote(next, "M");
    expect(note).toContain(`| Items cut | Workshop (${id}) |`);
    expect(note).toContain(`This change cuts: Workshop (${id}).`);
    expect(note).not.toContain("| Items cut | " + id + " |");
  });

  it("a | in a title does not break the note table", () => {
    const p = niceProject("Kick | off");
    const id = p.phases[0]!.items[0]!.id;
    const next = rescope(p, "S", "Client cut scope", APPROVER, DATE, { cutItemIds: [id] });
    const note = renderRescopeNote(next, "M");
    expect(note).toContain(`| Items cut | Kick \\| off (${id}) |`);
  });

  it("status history rows carry the labels", () => {
    const p = niceProject("Workshop");
    const id = p.phases[0]!.items[0]!.id;
    const next = rescope(p, "S", "Client cut scope", APPROVER, DATE, { cutItemIds: [id] });
    const rows = status(next, "2026-11-06").historyRows;
    expect(rows[0]!.itemsCutLabels).toEqual([]);
    expect(rows[1]!.itemsCutLabels).toEqual([`Workshop (${id})`]);
    expect(rows[1]!.itemsCut).toEqual([id]); // the stored data is still the id
  });
});
