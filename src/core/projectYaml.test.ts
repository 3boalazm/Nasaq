import { describe, expect, it } from "vitest";
import { fromYaml, toYaml } from "./projectYaml";
import type { Project } from "./types";

const sample: Project = {
  name: "Example Project",
  track: "uiux",
  size: "M",
  startDate: "2026-11-01",
  sizeHistory: [
    {
      date: "2026-11-01",
      fromSize: null,
      toSize: "S",
      reason: "initial sizing",
      approvedBy: null,
      itemsCut: [],
      itemsAdded: ["p1-1", "p1-2"],
    },
    {
      date: "2026-11-10",
      fromSize: "S",
      toSize: "M",
      reason: "second approver added",
      approvedBy: "Approver Name",
      itemsCut: ["p1-2"],
      itemsAdded: [],
    },
  ],
  deadline: "2026-12-15",
  approver: "Approver Name",
  outOfScope: ["Printed materials", "Video"],
  phases: [
    {
      id: "p1",
      name: "Discovery",
      items: [
        { id: "p1-1", title: "Stakeholder interviews", priority: "must", status: "done" },
        { id: "p1-2", title: "Competitor scan", priority: "nice", status: "cut" },
      ],
    },
  ],
};

const validYaml = `
name: Example
track: dev
size: S
startDate: 2026-11-01
sizeHistory: []
deadline: null
approver: null
outOfScope: []
phases: []
`;

const withLine = (from: string, to: string): string => validYaml.replace(from, to);

describe("toYaml / fromYaml", () => {
  it("round-trips a project unchanged", () => {
    expect(fromYaml(toYaml(sample))).toEqual(sample);
  });

  it("round-trips a project with null deadline and approver", () => {
    const p: Project = { ...sample, deadline: null, approver: null, sizeHistory: [], phases: [] };
    expect(fromYaml(toYaml(p))).toEqual(p);
  });

  it("accepts a minimal valid document", () => {
    const p = fromYaml(validYaml);
    expect(p.name).toBe("Example");
    expect(p.track).toBe("dev");
    expect(p.size).toBe("S");
    expect(p.startDate).toBe("2026-11-01");
  });

  it("rejects an unknown track with a clear message", () => {
    const bad = withLine("track: dev", "track: marketing");
    expect(() => fromYaml(bad)).toThrowError(
      'unknown track "marketing" (expected one of: brand, uiux, dev)',
    );
  });

  it("rejects an unknown size with a clear message", () => {
    const bad = withLine("size: S", "size: XL");
    expect(() => fromYaml(bad)).toThrowError('unknown size "XL" (expected one of: S, M, L)');
  });

  it("rejects a missing name with a clear message", () => {
    const bad = withLine("name: Example\n", "");
    expect(() => fromYaml(bad)).toThrowError("name is required");
  });

  it("requires startDate", () => {
    const bad = withLine("startDate: 2026-11-01\n", "");
    expect(() => fromYaml(bad)).toThrowError("startDate is required");
  });

  it("accepts the new item status 'cut'", () => {
    const p = fromYaml(toYaml(sample));
    expect(p.phases[0]?.items[1]?.status).toBe("cut");
  });

  it("rejects an unknown item status", () => {
    const bad = `${validYaml.replace("phases: []", "")}
phases:
  - id: p1
    name: Discovery
    items:
      - id: p1-1
        title: X
        priority: must
        status: blocked
`;
    expect(() => fromYaml(bad)).toThrowError(/phases\[0\]\.items\[0\]\.status/);
  });

  it("parses missing ChangeRecord lists as empty and approvedBy as null", () => {
    const doc = `${validYaml.replace("sizeHistory: []", "")}
sizeHistory:
  - date: 2026-11-01
    fromSize: null
    toSize: S
    reason: initial
`;
    const p = fromYaml(doc);
    expect(p.sizeHistory[0]).toEqual({
      date: "2026-11-01",
      fromSize: null,
      toSize: "S",
      reason: "initial",
      approvedBy: null,
      itemsCut: [],
      itemsAdded: [],
    });
  });

  describe("date validation", () => {
    it("rejects an impossible month in startDate, naming the field", () => {
      const bad = withLine("startDate: 2026-11-01", "startDate: '2026-13-01'");
      expect(() => fromYaml(bad)).toThrowError(/^startDate must be a real date/);
    });

    it("rejects a relative word in startDate, naming the field", () => {
      const bad = withLine("startDate: 2026-11-01", "startDate: tomorrow");
      expect(() => fromYaml(bad)).toThrowError(/^startDate must be a real date/);
    });

    it("rejects an impossible day in deadline, naming the field", () => {
      const bad = `${validYaml.replace("deadline: null", "deadline: '2026-02-30'")}`;
      expect(() => fromYaml(bad)).toThrowError(/^deadline must be a real date/);
    });

    it("rejects an invalid ChangeRecord.date, naming the field", () => {
      const doc = `${validYaml.replace("sizeHistory: []", "")}
sizeHistory:
  - date: tomorrow
    fromSize: null
    toSize: S
    reason: initial
`;
      expect(() => fromYaml(doc)).toThrowError(/sizeHistory\[0\]\.date must be a real date/);
    });

    it("accepts a leap day", () => {
      const p = fromYaml(withLine("startDate: 2026-11-01", "startDate: '2028-02-29'"));
      expect(p.startDate).toBe("2028-02-29");
    });
  });
});
