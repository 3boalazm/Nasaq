// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { mountStatus } from "./status";
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
  it("the Items cut value lists the title and the id, newest change first", () => {
    const p = niceProject("Workshop");
    const id = p.phases[0]!.items[0]!.id;
    const next = rescope(p, "S", "Client cut scope", APPROVER, "2026-11-05", { cutItemIds: [id] });
    const root = document.createElement("div");
    document.body.append(root);
    mountStatus(root, next, "2026-11-06");
    const rows = Array.from(root.querySelectorAll("ol.activity > li"));
    expect(rows.length).toBe(2);
    // The rescope is the newest record, so it comes first.
    const valueOf = (row: Element, label: string): string | undefined =>
      Array.from(row.querySelectorAll(".act-line"))
        .find((line) => line.querySelector(".k")?.textContent === label)
        ?.querySelector(".v")?.textContent ?? undefined;
    expect(valueOf(rows[0]!, "Items cut")).toBe(`Workshop (${id})`);
    expect(valueOf(rows[0]!, "Approved by")).toBe(APPROVER);
    // The first record (initial sizing) has no cut items.
    expect(valueOf(rows[1]!, "Items cut")).toBe("none");
    root.remove();
  });

  it("the size history list sits inside a box that scrolls sideways, not the page", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const p = niceProject("Workshop");
    mountStatus(root, p, "2026-11-06");
    expect(root.querySelector("div.table-wrap > ol.activity")).not.toBeNull();
    root.remove();
  });
});
