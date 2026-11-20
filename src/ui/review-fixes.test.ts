// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { mountStatus } from "./status";
import { status, scopeAlert } from "../core/status";
import { rescope } from "../core/rescope";
import { sampleProject } from "../testutil/sample";
import type { Project } from "../core/types";

const APPROVER = "Approver A";

function niceProject(title: string): Project {
  const p = sampleProject("M", "dev", { deliverables: 2 });
  return {
    ...p,
    phases: p.phases.map((ph, i) =>
      i === 0 ? { ...ph, items: ph.items.map((it, j) => (j === 0 ? { ...it, title, priority: "nice" as const } : it)) } : ph,
    ),
  };
}

describe("status size history shows cut items as title (id)", () => {
  it("the Items cut column lists the title and the id", () => {
    const p = niceProject("Workshop");
    const id = p.phases[0]!.items[0]!.id;
    const next = rescope(p, "S", "Client cut scope", APPROVER, "2026-11-05", { cutItemIds: [id] });
    const root = document.createElement("div");
    document.body.append(root);
    mountStatus(root, status(next, "2026-11-06"), scopeAlert(next));
    const headers = Array.from(root.querySelectorAll("table.history thead th")).map((th) => th.textContent);
    expect(headers).toEqual(["Date", "From → to", "Reason", "Items cut", "Approved by"]);
    const cells = Array.from(root.querySelectorAll("table.history tbody tr"))[1]!.querySelectorAll("td");
    expect(cells[3]!.textContent).toBe(`Workshop (${id})`);
    expect(cells[4]!.textContent).toBe(APPROVER);
    // The first record (initial sizing) has no cut items.
    const first = Array.from(root.querySelectorAll("table.history tbody tr"))[0]!.querySelectorAll("td");
    expect(first[3]!.textContent).toBe("none");
    root.remove();
  });

  it("the history table sits inside a box that scrolls sideways, not the page", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const p = niceProject("Workshop");
    mountStatus(root, status(p, "2026-11-06"), scopeAlert(p));
    expect(root.querySelector("div.table-wrap > table.history")).not.toBeNull();
    root.remove();
  });
});
