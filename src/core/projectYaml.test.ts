import { describe, expect, it } from "vitest";
import { fromYaml, toYaml } from "./projectYaml";
import type { Project } from "./types";

const sample: Project = {
  name: "Example Project",
  track: "uiux",
  size: "M",
  sizeHistory: [
    { date: "2026-11-01", fromSize: null, toSize: "S", reason: "initial sizing" },
    { date: "2026-11-10", fromSize: "S", toSize: "M", reason: "second approver added" },
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
        { id: "p1-2", title: "Competitor scan", priority: "nice", status: "todo" },
      ],
    },
  ],
};

const validYaml = `
name: Example
track: dev
size: S
sizeHistory: []
deadline: null
approver: null
outOfScope: []
phases: []
`;

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
  });

  it("rejects an unknown track with a clear message", () => {
    const bad = validYaml.replace("track: dev", "track: marketing");
    expect(() => fromYaml(bad)).toThrowError(
      'unknown track "marketing" (expected one of: brand, uiux, dev)',
    );
  });

  it("rejects an unknown size with a clear message", () => {
    const bad = validYaml.replace("size: S", "size: XL");
    expect(() => fromYaml(bad)).toThrowError(
      'unknown size "XL" (expected one of: S, M, L)',
    );
  });

  it("rejects a missing name with a clear message", () => {
    const bad = validYaml.replace("name: Example\n", "");
    expect(() => fromYaml(bad)).toThrowError("name is required");
  });
});
