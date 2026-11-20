import { describe, expect, it } from "vitest";
import { createProject, durationDays, parseOutOfScope, validateAnswers, type IntakeAnswers } from "./intake";

const ok: IntakeAnswers = {
  name: "P",
  track: "uiux",
  startDate: "2026-11-20",
  deadline: "2026-11-20",
  approver: "",
  outOfScopeText: "",
  deliverables: 1,
  approvers: 1,
  risk: "easy_undo",
  unknowns: "none",
};

describe("durationDays", () => {
  it("counts both start and deadline days", () => {
    expect(durationDays("2026-11-20", "2026-11-25")).toBe(6);
  });
  it("same day is 1", () => {
    expect(durationDays("2026-11-20", "2026-11-20")).toBe(1);
  });
  it("deadline before start is at least 1", () => {
    expect(durationDays("2026-11-20", "2026-11-10")).toBe(1);
  });
  it("crosses month and leap-day boundaries", () => {
    expect(durationDays("2028-02-28", "2028-03-01")).toBe(3);
  });
});

describe("validateAnswers", () => {
  it("accepts a complete answer set", () => {
    expect(validateAnswers(ok)).toEqual([]);
  });
  it("rejects a blank name, a bad date and a fractional count", () => {
    const errs = validateAnswers({ ...ok, name: "  ", deadline: "2026-02-30", deliverables: 1.5 });
    expect(errs.length).toBe(3);
  });
  it("rejects an unknown track and unknown levels", () => {
    expect(validateAnswers({ ...ok, track: "x", risk: "y", unknowns: "z" }).length).toBe(3);
  });
});

describe("createProject", () => {
  it("builds phases from the S column with must and todo items", () => {
    const p = createProject(ok, "S", "2026-11-20");
    expect(p.phases.length).toBeGreaterThan(0);
    for (const ph of p.phases) {
      for (const it of ph.items) {
        expect(it.priority).toBe("must");
        expect(it.status).toBe("todo");
      }
    }
  });
  it("sets startDate and records initial sizing", () => {
    const p = createProject({ ...ok, startDate: "2026-11-01" }, "S", "2026-11-01");
    expect(p.startDate).toBe("2026-11-01");
    expect(p.sizeHistory[0]).toMatchObject({ fromSize: null, toSize: "S", date: "2026-11-01" });
  });
  it("maps blank approver to null and parses out-of-scope lines", () => {
    const p = createProject({ ...ok, outOfScopeText: " a \n\n b\r\n" }, "S", "2026-11-20");
    expect(p.approver).toBeNull();
    expect(p.outOfScope).toEqual(["a", "b"]);
  });
  it("throws for M and L", () => {
    expect(() => createProject(ok, "M", "2026-11-20")).toThrow(/S2/);
  });
});

describe("parseOutOfScope", () => {
  it("drops empty lines", () => {
    expect(parseOutOfScope("\n\n x \n")).toEqual(["x"]);
  });
});
