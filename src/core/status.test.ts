import { describe, expect, it } from "vitest";
import { status, scopeAlert } from "./status";
import { rescope } from "./rescope";
import { sampleProject } from "../testutil/sample";
import type { Project, Size } from "./types";

/** Project with a given start, deadline, and number of items (all must, todo). */
function withShape(size: Size, start: string, deadline: string | null, items: number): Project {
  const base = sampleProject(size);
  const list = Array.from({ length: items }, (_, i) => ({ id: `x-${i + 1}`, title: `Item ${i + 1}`, priority: "must" as const, status: "todo" as const }));
  return { ...base, startDate: start, deadline, phases: [{ id: "p1", name: "Only", items: list }] };
}

describe("M3.4 status", () => {
  it("shows size, history, current phase, open items and days left (fixed today)", () => {
    const p = sampleProject("M");
    const s = status(p, "2026-11-01");
    expect(s.size).toBe("M");
    expect(s.sizeHistory.length).toBe(1);
    expect(s.currentPhase).toBe(p.phases[0]!.name);
    expect(s.openMust.length + s.openNice.length).toBe(p.phases.flatMap((ph) => ph.items).length);
    // deadline 2026-11-10, today 2026-11-01: inclusive count is 10
    expect(s.daysLeft).toBe(10);
    expect(s.overdue).toBe(false);
  });

  it("days left counts today and the deadline (same inclusive rule as durationDays)", () => {
    const p = withShape("S", "2026-11-01", "2026-11-03", 1);
    expect(status(p, "2026-11-03").daysLeft).toBe(1);
    expect(status(p, "2026-11-02").daysLeft).toBe(2);
  });

  it("overdue when the deadline has passed; days left is 0", () => {
    const s = status(withShape("S", "2026-11-01", "2026-11-03", 1), "2026-11-04");
    expect(s.overdue).toBe(true);
    expect(s.daysLeft).toBe(0);
  });

  it("no deadline: hasDeadline false", () => {
    const s = status(withShape("S", "2026-11-01", null, 1), "2026-11-04");
    expect(s.hasDeadline).toBe(false);
  });

  it("deliverables count excludes cut items", () => {
    const p = withShape("S", "2026-11-01", "2026-11-10", 3);
    const cut = { ...p, phases: [{ ...p.phases[0]!, items: p.phases[0]!.items.map((it, i) => (i === 0 ? { ...it, status: "cut" as const } : it)) }] };
    expect(status(cut, "2026-11-01").deliverables).toBe(2);
  });

  it("open must and nice items are split; done and cut items are not open", () => {
    const p = withShape("S", "2026-11-01", "2026-11-10", 3);
    const items = p.phases[0]!.items.map((it, i) =>
      i === 0 ? { ...it, status: "done" as const } : i === 1 ? { ...it, priority: "nice" as const } : it,
    );
    const s = status({ ...p, phases: [{ ...p.phases[0]!, items }] }, "2026-11-01");
    expect(s.openMust.map((x) => x.id)).toEqual(["x-3"]);
    expect(s.openNice.map((x) => x.id)).toEqual(["x-2"]);
  });

  it("current phase is null when nothing is open", () => {
    const p = withShape("S", "2026-11-01", "2026-11-10", 1);
    const done = { ...p, phases: [{ ...p.phases[0]!, items: [{ ...p.phases[0]!.items[0]!, status: "done" as const }] }] };
    expect(status(done, "2026-11-01").currentPhase).toBeNull();
  });
});

describe("M3.5 scopeAlert", () => {
  // S: deliverables > 5 or duration > 7 (inclusive)
  it.each([
    [5, false],
    [6, true],
  ])("S with %i deliverables: alert %s", (n, alert) => {
    const a = scopeAlert(withShape("S", "2026-11-01", "2026-11-03", n));
    expect(a.alert).toBe(alert);
  });

  it("S duration boundary: 7 days inclusive is fine, 8 is an alert", () => {
    // 2026-11-01 to 2026-11-07 = 7 days inclusive
    expect(scopeAlert(withShape("S", "2026-11-01", "2026-11-07", 1)).alert).toBe(false);
    const a = scopeAlert(withShape("S", "2026-11-01", "2026-11-08", 1));
    expect(a.alert).toBe(true);
    expect(a.duration).toBe(8);
    expect(a.reasons.join(" ")).toMatch(/8 days/);
  });

  // M: deliverables > 15 or duration > 28 (inclusive)
  it.each([
    [15, false],
    [16, true],
  ])("M with %i deliverables: alert %s", (n, alert) => {
    expect(scopeAlert(withShape("M", "2026-11-01", "2026-11-03", n)).alert).toBe(alert);
  });

  it("M duration boundary: 28 inclusive is fine, 29 is an alert", () => {
    expect(scopeAlert(withShape("M", "2026-11-01", "2026-11-28", 1)).alert).toBe(false);
    expect(scopeAlert(withShape("M", "2026-11-01", "2026-11-29", 1)).alert).toBe(true);
  });

  it("alert suggests the next size and never changes the project's size", () => {
    const p = withShape("S", "2026-11-01", "2026-11-03", 6);
    const a = scopeAlert(p);
    expect(a.suggestedSize).toBe("M");
    expect(p.size).toBe("S");
  });

  it("no alert suggestion when there is no alert", () => {
    expect(scopeAlert(withShape("S", "2026-11-01", "2026-11-03", 1)).suggestedSize).toBeNull();
  });

  it("L has no limit to exceed", () => {
    expect(scopeAlert(withShape("L", "2026-11-01", "2027-06-01", 50)).alert).toBe(false);
  });

  it("deliverables in the alert ignore cut items", () => {
    const p = withShape("S", "2026-11-01", "2026-11-03", 6);
    const cut = rescope(
      { ...p, size: "M" },
      "S",
      "x",
      null,
      "2026-11-02",
      { cutItemIds: [p.phases[0]!.items[0]!.id], mustCutReason: "r" },
    );
    expect(scopeAlert(cut).deliverables).toBe(5);
    expect(scopeAlert(cut).alert).toBe(false);
  });
});
