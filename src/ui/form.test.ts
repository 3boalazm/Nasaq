// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountIntakeForm, readAnswers, type SaveFn } from "./form";

const setVal = (id: string, value: string): void => {
  const node = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  node.value = value;
  node.dispatchEvent(new Event("input", { bubbles: true }));
};

const fill = (over: Partial<Record<string, string>> = {}): void => {
  const values: Record<string, string> = {
    "f-name": "Acme Relaunch",
    "f-track": "brand",
    "f-start": "2026-11-20",
    "f-deadline": "2026-11-25",
    "f-deliverables": "2",
    "f-approvers": "1",
    "f-risk": "easy_undo",
    "f-unknowns": "none",
    ...over,
  };
  for (const [id, v] of Object.entries(values)) setVal(id, v);
};

const btn = (): HTMLButtonElement => document.getElementById("f-download") as HTMLButtonElement;
const sizeSel = (): HTMLSelectElement => document.getElementById("f-size") as HTMLSelectElement;
const text = (id: string): string => document.getElementById(id)?.textContent ?? "";

describe("intake form", () => {
  let root: HTMLElement;
  let save: ReturnType<typeof vi.fn<SaveFn>>;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    root = document.getElementById("app") as HTMLElement;
    save = vi.fn<SaveFn>();
    mountIntakeForm(root, save);
  });

  it("starts with start date set to today and download disabled", () => {
    const now = new Date();
    const pad = (n: number): string => String(n).padStart(2, "0");
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    expect((document.getElementById("f-start") as HTMLInputElement).value).toBe(today);
    expect(btn().disabled).toBe(true);
  });

  it("shows a suggested size with the deciding answers and a duration", () => {
    fill();
    expect(text("f-duration")).toBe("Duration: 6 days, counting start and deadline.");
    expect(text("f-suggestion")).toMatch(/^Suggested size: S\. Decided by: /);
    expect(sizeSel().value).toBe("S");
    expect(btn().disabled).toBe(false);
  });

  it("suggests M and disables download with the S2 message", () => {
    fill({ "f-deadline": "2026-12-01", "f-deliverables": "8" });
    expect(sizeSel().value).toBe("M");
    expect(text("f-size-msg")).toBe("Templates for size M arrive in S2. Download is disabled for this size.");
    expect(btn().disabled).toBe(true);
  });

  it("allows override: picking S for a suggested M enables download", () => {
    fill({ "f-deadline": "2026-12-01", "f-deliverables": "8" });
    sizeSel().value = "S";
    sizeSel().dispatchEvent(new Event("change", { bubbles: true }));
    expect(btn().disabled).toBe(false);
    expect(text("f-size-msg")).toBe("");
  });

  it("keeps an override when answers change afterwards", () => {
    fill({ "f-deadline": "2026-12-01", "f-deliverables": "8" });
    sizeSel().value = "S";
    sizeSel().dispatchEvent(new Event("change", { bubbles: true }));
    setVal("f-deliverables", "9");
    expect(sizeSel().value).toBe("S");
  });

  it("re-suggests size when answers change before any override", () => {
    fill({ "f-deadline": "2026-12-01", "f-deliverables": "8" });
    expect(sizeSel().value).toBe("M");
    setVal("f-deliverables", "1");
    setVal("f-deadline", "2026-11-21");
    expect(sizeSel().value).toBe("S");
  });

  it("lists validation errors and keeps download disabled", () => {
    fill({ "f-name": "" });
    expect(text("f-errors")).toContain("Enter a project name.");
    expect(btn().disabled).toBe(true);
  });

  it("warns when the deadline is before the start date", () => {
    fill({ "f-deadline": "2026-11-10" });
    expect(text("f-deadline-hint")).toMatch(/before the start date/);
    expect(text("f-duration")).toBe("Duration: 1 day, counting start and deadline.");
  });

  it("download saves {slug}.zip with a non-empty blob", async () => {
    fill({ "f-approver": "Approver A", "f-outofscope": "Mobile app" });
    btn().click();
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    const [blob, filename] = save.mock.calls[0] as [Blob, string];
    expect(filename).toBe("acme-relaunch.zip");
    expect(blob.size).toBeGreaterThan(0);
  });

  it("readAnswers maps empty numeric fields to NaN", () => {
    setVal("f-deliverables", "");
    expect(Number.isNaN(readAnswers(root).deliverables)).toBe(true);
  });
});
