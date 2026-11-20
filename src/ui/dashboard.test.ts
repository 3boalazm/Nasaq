// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { mountStatus, deliverableLimit } from "./status";
import { readProjectYaml } from "../core/readProject";
import { toYaml } from "../core/projectYaml";
import { deliverableCount } from "../core/status";
import { DELIVERABLES_BANDS } from "../core/thresholds";
import { sampleProject } from "../testutil/sample";
import type { Project } from "../core/types";

const TODAY = "2026-11-01";

/** A project as the page reads it from a project.yml file. */
function fromFile(p: Project): Project {
  const result = readProjectYaml(toYaml(p));
  if (!result.ok) throw new Error(result.error);
  return result.project;
}

/** Adds `count` open must items to the first phase. */
function withItems(p: Project, count: number): Project {
  const items = Array.from({ length: count }, (_, i) => ({
    id: `x${i}`,
    title: `Extra ${i}`,
    priority: "must" as const,
    status: "todo" as const,
  }));
  return { ...p, phases: [{ ...p.phases[0]!, items }, ...p.phases.slice(1)] };
}

const card = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;

describe("existing project dashboard renders its cards from a project.yml", () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    document.body.append(root);
  });

  it("the Open items card comes first, then size, deliverables, scope, phases and history", () => {
    mountStatus(root, fromFile(sampleProject("S")), TODAY);
    const order = Array.from(root.querySelectorAll<HTMLElement>(".bento > section")).map((s) => s.id);
    expect(order).toEqual(["card-open", "card-size", "card-deliverables", "card-scope", "card-phases", "card-history"]);
  });

  it("the header shows the project name, the size and the track as pills", () => {
    mountStatus(root, fromFile(sampleProject("S", "brand")), TODAY);
    expect(root.querySelector(".dash-name")?.textContent).toBe("Sample Project");
    const pills = Array.from(root.querySelectorAll(".pill")).map((p) => p.textContent);
    expect(pills).toEqual(["Size S", "Brand identity"]);
  });

  it("the size card shows the size letter, the start date, and the days left from the deadline", () => {
    mountStatus(root, fromFile(sampleProject("S")), TODAY);
    expect(card("card-size").querySelector(".big")?.textContent).toBe("S");
    expect(card("card-size").textContent).toContain("Since 2026-11-01");
    // Deadline 2026-11-10, counted from 2026-11-01: 10 days.
    expect(card("card-size").textContent).toContain("10 days left");
  });

  it("the deliverables card shows the count not cut, and a segmented bar of the S limit from thresholds.ts", () => {
    const p = fromFile(sampleProject("S", "dev", { deliverables: 2 }));
    mountStatus(root, p, TODAY);
    const count = deliverableCount(p);
    expect(card("card-deliverables").querySelector(".big")?.textContent).toBe(String(count));
    expect(deliverableLimit("S")).toBe(DELIVERABLES_BANDS.S.max);
    expect(card("card-deliverables").textContent).toContain(`Limit for S: ${DELIVERABLES_BANDS.S.max}.`);
    const segs = Array.from(card("card-deliverables").querySelectorAll(".segments .seg"));
    expect(segs.length).toBe(DELIVERABLES_BANDS.S.max);
    expect(segs.filter((s) => s.classList.contains("on")).length).toBe(count);
  });

  it("the size L deliverables card has no bar and names the L minimum from thresholds.ts", () => {
    mountStatus(root, fromFile(sampleProject("L")), TODAY);
    expect(card("card-deliverables").querySelector(".segments")).toBeNull();
    expect(card("card-deliverables").textContent).toContain(`${DELIVERABLES_BANDS.L.min} or more is size L`);
  });

  it("the scope card says Within limits and is not amber when no limit is exceeded", () => {
    // Deadline 2026-11-03: 3 days, and 2 deliverables. Both inside the S limits (7 days, 5 deliverables).
    mountStatus(root, fromFile({ ...sampleProject("S"), deadline: "2026-11-03" }), TODAY);
    expect(card("card-scope").textContent).toContain("Within limits");
    expect(card("card-scope").classList.contains("card-alert")).toBe(false);
    expect(document.getElementById("scope-alert")).toBeNull();
  });

  it("the scope card is amber and names the limit when an S project has too many deliverables", () => {
    mountStatus(root, fromFile(withItems(sampleProject("S"), 6)), TODAY);
    expect(card("card-scope").classList.contains("card-alert")).toBe(true);
    const alert = document.getElementById("scope-alert");
    expect(alert?.getAttribute("role")).toBe("alert");
    expect(alert?.textContent).toMatch(/deliverables; the S limit is 5/);
    expect(alert?.textContent).toMatch(/Suggested next size: M/);
  });

  it("the phases card draws one bar per phase, split into done, open and cut", () => {
    const base = sampleProject("S");
    const first = base.phases[0]!;
    const items = [
      { id: "d1", title: "Done one", priority: "must" as const, status: "done" as const },
      { id: "c1", title: "Cut one", priority: "must" as const, status: "cut" as const },
    ];
    const p = fromFile({ ...base, phases: [{ ...first, items }, ...base.phases.slice(1)] });
    mountStatus(root, p, TODAY);
    const rows = Array.from(card("card-phases").querySelectorAll(".phase-row"));
    expect(rows.length).toBe(p.phases.length);
    const firstRow = rows[0]!;
    expect(firstRow.querySelector(".part.done")).not.toBeNull();
    expect(firstRow.querySelector(".part.cut")).not.toBeNull();
    expect(firstRow.querySelector(".phase-name")?.textContent).toBe(first.name);
    // Counts are written out, so the bar is not the only way to read them.
    expect(firstRow.textContent).toContain("1 done");
    expect(firstRow.textContent).toContain("1 cut");
  });

  it("the open items card lists the open items, must first, and shows progress as text and a bar", () => {
    const base = sampleProject("S");
    const first = base.phases[0]!;
    const items = [
      { id: "d1", title: "Done one", priority: "must" as const, status: "done" as const },
      { id: "n1", title: "Nice open", priority: "nice" as const, status: "todo" as const },
    ];
    const p = fromFile({ ...base, phases: [{ ...first, items }, ...base.phases.slice(1)] });
    mountStatus(root, p, TODAY);
    const rows = Array.from(card("card-open").querySelectorAll(".checklist li"));
    const open = p.phases.flatMap((ph) => ph.items.filter((i) => i.status === "todo" || i.status === "doing"));
    expect(rows.length).toBe(open.length);
    // The nice item is listed after every must item.
    const lastLabel = rows[rows.length - 1]!.textContent ?? "";
    expect(lastLabel).toContain("Nice");
    const total = p.phases.reduce((n, ph) => n + ph.items.filter((i) => i.status !== "cut").length, 0);
    expect(card("card-open").textContent).toContain(`1 of ${total} done`);
    const bar = card("card-open").querySelector("progress") as HTMLProgressElement;
    expect(bar.value).toBe(1);
    expect(bar.max).toBe(total);
  });

  it("the history card lists size changes newest first, with items cut and the approver", () => {
    mountStatus(root, fromFile(sampleProject("M")), TODAY);
    const rows = Array.from(card("card-history").querySelectorAll("ol.activity > li"));
    expect(rows.length).toBe(1);
    expect(rows[0]!.textContent).toContain("Initial sizing");
    expect(rows[0]!.textContent).toContain("- → M");
  });

  it("renders no HTML from project text: a name with markup stays text", () => {
    const hostile = { ...sampleProject("S"), name: "<b>x</b>" };
    mountStatus(root, fromFile(hostile), TODAY);
    expect(root.querySelector(".dash-name")?.textContent).toBe("<b>x</b>");
    expect(root.querySelector("b")).toBeNull();
  });
});
