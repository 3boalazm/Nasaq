// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { alertMessage, mountStatus, statusLines } from "./status";
import { scopeAlert, status } from "../core/status";
import { sampleProject } from "../testutil/sample";

describe("status UI", () => {
  it("statusLines: fixed today gives the expected days left and phase", () => {
    const p = sampleProject("S");
    const lines = Object.fromEntries(statusLines(status(p, "2026-11-01")));
    expect(lines["Size"]).toBe("S");
    expect(lines["Days left"]).toBe("10 days (counting today and the deadline)");
    expect(lines["Current phase"]).toBe(p.phases[0]!.name);
    expect(lines["Size changes"]).toBe("1");
  });

  it("statusLines: overdue and no-deadline wording", () => {
    const p = sampleProject("S");
    expect(Object.fromEntries(statusLines(status(p, "2026-12-01")))["Days left"]).toBe("overdue");
    expect(Object.fromEntries(statusLines(status({ ...p, deadline: null }, "2026-11-01")))["Days left"]).toBe(
      "no deadline set",
    );
  });

  it("alertMessage: null when no alert; names the reason and the suggestion when alerting", () => {
    // deadline 2026-11-03: 3 days inclusive, 2 deliverables: within the S limits
    const p = { ...sampleProject("S", "dev", { deliverables: 2 }), deadline: "2026-11-03" };
    expect(alertMessage(scopeAlert(p))).toBeNull();
    const big = { ...p, phases: [{ ...p.phases[0]!, items: Array.from({ length: 6 }, (_, i) => ({ id: `i${i}`, title: `t${i}`, priority: "must" as const, status: "todo" as const })) }] };
    const msg = alertMessage(scopeAlert(big));
    expect(msg).toMatch(/6 deliverables; the S limit is 5/);
    expect(msg).toMatch(/Suggested next size: M/);
    expect(msg).toMatch(/Nothing has changed/);
  });

  it("mountStatus renders the card and the alert with role=alert", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const p = sampleProject("S");
    const big = { ...p, phases: [{ ...p.phases[0]!, items: Array.from({ length: 6 }, (_, i) => ({ id: `i${i}`, title: `t${i}`, priority: "must" as const, status: "todo" as const })) }] };
    mountStatus(root, big, "2026-11-01");
    expect(root.querySelector(".dash-name")?.textContent).toBe("Sample Project");
    const alert = root.querySelector("#scope-alert");
    expect(alert?.getAttribute("role")).toBe("alert");
    expect(root.querySelector("ol.activity > li")?.textContent).toContain("Initial sizing");
    root.remove();
  });
});
