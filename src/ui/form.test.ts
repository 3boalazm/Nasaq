// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountIntakeForm, readAnswers } from "./form";
import type { SaveFn } from "./dom";

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

/** Leaves a field, as a user does by tabbing away. */
const blur = (id: string): void => {
  (document.getElementById(id) as HTMLElement).dispatchEvent(new Event("focusout", { bubbles: true }));
};
/** The visible error line for a field, or "" when hidden. */
const errorOf = (id: string): string => {
  const line = document.getElementById(`err-${id}`);
  return line && !line.hidden ? line.textContent ?? "" : "";
};
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

  it("starts with start date set to today; download enabled; no error shown", () => {
    const now = new Date();
    const pad = (n: number): string => String(n).padStart(2, "0");
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    expect((document.getElementById("f-start") as HTMLInputElement).value).toBe(today);
    expect(btn().disabled).toBe(false);
    expect(document.querySelectorAll(".field-error:not([hidden])").length).toBe(0);
  });

  it("shows a suggested size with the deciding answers and a duration", () => {
    fill();
    expect(text("f-duration")).toBe("Duration: 6 days, counting start and deadline.");
    expect(text("f-suggestion")).toMatch(/^Suggested size: S\. Decided by: /);
    expect(sizeSel().value).toBe("S");
    expect(btn().disabled).toBe(false);
  });

  it("suggests M and enables download (M templates exist)", () => {
    fill({ "f-deadline": "2026-12-01", "f-deliverables": "8" });
    expect(sizeSel().value).toBe("M");
    expect(btn().disabled).toBe(false);
  });

  it("suggests L and enables download (L templates exist)", () => {
    fill({ "f-deadline": "2026-12-20", "f-deliverables": "8" });
    expect(sizeSel().value).toBe("L");
    expect(btn().disabled).toBe(false);
  });

  it("allows override: picking S for a suggested M keeps download enabled", () => {
    fill({ "f-deadline": "2026-12-01", "f-deliverables": "8" });
    sizeSel().value = "S";
    sizeSel().dispatchEvent(new Event("change", { bubbles: true }));
    expect(btn().disabled).toBe(false);
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

  it("an error is shown only after its field is touched", () => {
    fill({ "f-name": "" });
    expect(errorOf("f-name")).toBe("");
    blur("f-name");
    expect(errorOf("f-name")).toBe("Enter a project name.");
    expect(document.getElementById("f-name")?.getAttribute("aria-invalid")).toBe("true");
  });

  it("leaving a different field does not reveal an untouched invalid field", () => {
    fill({ "f-name": "" });
    blur("f-deadline");
    expect(errorOf("f-name")).toBe("");
    expect(errorOf("f-deadline")).toBe("");
  });

  it("the error goes away once the field is fixed", () => {
    fill({ "f-name": "" });
    blur("f-name");
    setVal("f-name", "Fixed");
    expect(errorOf("f-name")).toBe("");
    expect(document.getElementById("f-name")?.getAttribute("aria-invalid")).toBe("false");
  });

  it("the first Download click reveals every error, focuses the first invalid field, and saves nothing", () => {
    fill({ "f-name": "", "f-deadline": "", "f-deliverables": "" });
    expect(btn().disabled).toBe(false);
    expect(errorOf("f-name")).toBe("");
    btn().click();
    expect(errorOf("f-name")).toBe("Enter a project name.");
    expect(errorOf("f-deadline")).toBe("Enter a deadline.");
    expect(errorOf("f-deliverables")).toBe("Deliverables must be a whole number, 1 or more.");
    expect(document.activeElement?.id).toBe("f-name");
    expect(save).not.toHaveBeenCalled();
  });

  it("after the reveal, every error is live: fixing one clears only that one", () => {
    fill({ "f-name": "", "f-deadline": "" });
    btn().click();
    setVal("f-deadline", "2026-11-25");
    expect(errorOf("f-deadline")).toBe("");
    expect(errorOf("f-name")).toBe("Enter a project name.");
  });

  it("a click with valid answers saves, and reveals nothing", async () => {
    fill({ "f-approver": "Approver A" });
    btn().click();
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(document.querySelectorAll(".field-error:not([hidden])").length).toBe(0);
  });

  it("warns when the deadline is before the start date", () => {
    fill({ "f-deadline": "2026-11-10" });
    expect(text("f-deadline-hint")).toMatch(/before the start date/);
    expect(text("f-duration")).toBe("Duration: 1 day, counting start and deadline.");
  });

  it("download saves the chosen size's ZIP name and content", async () => {
    fill({ "f-deadline": "2026-12-01", "f-deliverables": "8", "f-approver": "Approver A" });
    sizeSel().value = "M";
    sizeSel().dispatchEvent(new Event("change", { bubbles: true }));
    btn().click();
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    const [blob, filename] = save.mock.calls[0] as [Blob, string];
    expect(filename).toBe("acme-relaunch.zip");
    expect(blob.size).toBeGreaterThan(0);
    save.mockClear();
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
