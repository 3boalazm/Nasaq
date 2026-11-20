// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cutListOrder, mountRescope } from "./rescope";
import type { SaveFn } from "./dom";
import { sampleProject } from "../testutil/sample";
import type { Project } from "../core/types";

function setVal(id: string, value: string): void {
  (document.getElementById(id) as HTMLInputElement | HTMLSelectElement).value = value;
}
/** The checked new-size card. */
const sizeVal = (): string => (document.querySelector('input[name="rs-size"]:checked') as HTMLInputElement | null)?.value ?? "";
/** Chooses a new-size card: check its radio and fire change, as a click does. */
function pickSize(value: string): void {
  const radio = document.getElementById(`rs-size-${value}`) as HTMLInputElement;
  radio.checked = true;
  radio.dispatchEvent(new Event("change", { bubbles: true }));
}
function check(id: string, on = true): void {
  const box = document.getElementById(id) as HTMLInputElement;
  box.checked = on;
  box.dispatchEvent(new Event("change", { bubbles: true }));
}
const btn = (): HTMLButtonElement => document.getElementById("rs-download") as HTMLButtonElement;
const errors = (): string => document.getElementById("rs-errors")?.textContent ?? "";

/** Project with one must and one nice item open in a phase. */
function mixed(size: "M" | "S" = "M"): Project {
  const p = sampleProject(size);
  const items = [
    { id: "a-must", title: "Must thing", priority: "must" as const, status: "todo" as const },
    { id: "b-nice", title: "Nice thing", priority: "nice" as const, status: "todo" as const },
  ];
  return { ...p, phases: [{ id: "p1", name: "Build", items }] };
}

describe("rescope UI", () => {
  let root: HTMLElement;
  let save: ReturnType<typeof vi.fn<SaveFn>>;
  let onRescoped: ReturnType<typeof vi.fn<(p: Project) => void>>;

  beforeEach(() => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    document.body.append(root);
    save = vi.fn<SaveFn>();
    onRescoped = vi.fn<(p: Project) => void>();
  });

  it("cut list: nice items first, then must", () => {
    const order = cutListOrder(mixed()).map((o) => o.id);
    expect(order).toEqual(["b-nice", "a-must"]);
  });

  it("cut step is shown for a move down and hidden for a move up", () => {
    mountRescope(root, mixed("M"), { save, today: "2026-11-01", onRescoped });
    // default new size for M is S (first option other than M)
    expect(sizeVal()).toBe("S");
    expect(root.querySelector<HTMLElement>(".cut-step")?.hidden).toBe(false);
    pickSize("L");
    expect(root.querySelector<HTMLElement>(".cut-step")?.hidden).toBe(true);
  });

  it("cutting a must item shows the warning and the typed-reason field", () => {
    mountRescope(root, mixed("M"), { save, today: "2026-11-01", onRescoped });
    const warning = document.getElementById("rs-must-warning")!;
    const reason = document.getElementById("rs-must-reason")!.parentElement!;
    expect(warning.hidden).toBe(true);
    check("cut-a-must");
    expect(warning.hidden).toBe(false);
    expect(warning.getAttribute("role")).toBe("alert");
    expect(reason.hidden).toBe(false);
  });

  it("download without an approver shows an error and does not save", async () => {
    mountRescope(root, mixed("M"), { save, today: "2026-11-01", onRescoped });
    setVal("rs-reason", "Client cut scope");
    btn().click();
    await vi.waitFor(() => expect(errors()).toMatch(/approved/));
    expect(save).not.toHaveBeenCalled();
    expect(onRescoped).not.toHaveBeenCalled();
  });

  it("download with no reason shows an error and does not save", async () => {
    mountRescope(root, mixed("M"), { save, today: "2026-11-01", onRescoped });
    btn().click();
    await vi.waitFor(() => expect(errors()).toMatch(/reason is required/));
    expect(save).not.toHaveBeenCalled();
    expect(onRescoped).not.toHaveBeenCalled();
  });

  it("cutting a must without a typed reason is refused", async () => {
    mountRescope(root, mixed("M"), { save, today: "2026-11-01", onRescoped });
    setVal("rs-reason", "Client cut scope");
    setVal("rs-approved", "Approver A");
    check("cut-a-must");
    btn().click();
    await vi.waitFor(() => expect(errors()).toMatch(/typed reason/));
    expect(save).not.toHaveBeenCalled();
  });

  it("a valid move down with a nice cut saves a rescope ZIP and reports the new project", async () => {
    mountRescope(root, mixed("M"), { save, today: "2026-11-01", onRescoped });
    setVal("rs-reason", "Client cut scope");
    setVal("rs-approved", "Approver A");
    setVal("rs-date", "2026-11-05");
    check("cut-b-nice");
    btn().click();
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    const [blob, filename] = save.mock.calls[0] as [Blob, string];
    expect(filename).toBe("sample-project-rescope-S.zip");
    expect(blob.size).toBeGreaterThan(0);
    const next = onRescoped.mock.calls[0]![0] as Project;
    expect(next.size).toBe("S");
    expect(next.phases[0]!.items.find((i) => i.id === "b-nice")?.status).toBe("cut");
    expect(next.sizeHistory[next.sizeHistory.length - 1]).toMatchObject({ date: "2026-11-05", fromSize: "M", toSize: "S", approvedBy: "Approver A", itemsCut: ["b-nice"] });
  });

  it("a move up needs no cut and saves the new files ZIP name", async () => {
    mountRescope(root, sampleProject("S"), { save, today: "2026-11-01", onRescoped });
    pickSize("M");
    setVal("rs-reason", "Scope grew");
    setVal("rs-approved", "Approver A");
    btn().click();
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect((save.mock.calls[0] as [Blob, string])[1]).toBe("sample-project-rescope-M.zip");
    expect((onRescoped.mock.calls[0]![0] as Project).size).toBe("M");
  });
});
