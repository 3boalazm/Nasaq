// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountExisting } from "./existing";
import { mountApp } from "./app";
import type { SaveFn } from "./dom";
import { toYaml } from "../core/projectYaml";
import { sampleProject } from "../testutil/sample";
import { MAX_PROJECT_YAML_BYTES } from "../core/thresholds";
import { parse, stringify } from "yaml";

async function uploadFile(file: File): Promise<void> {
  const input = document.getElementById("up-file") as HTMLInputElement;
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await vi.waitFor(() => {
    const err = document.getElementById("up-error")?.textContent ?? "";
    expect(err !== "" || document.getElementById("status-box") !== null).toBe(true);
  });
}

describe("M4.1 upload safety in the Existing project panel", () => {
  let save: ReturnType<typeof vi.fn<SaveFn>>;

  beforeEach(() => {
    document.body.innerHTML = "";
    const root = document.createElement("div");
    document.body.append(root);
    save = vi.fn<SaveFn>();
    mountExisting(root, { save, today: "2026-11-01" });
  });

  it("a file over 1 MB is refused before it is read", async () => {
    const big = new File(["x".repeat(MAX_PROJECT_YAML_BYTES + 1)], "project.yml", { type: "text/yaml" });
    const text = vi.spyOn(big, "text");
    await uploadFile(big);
    expect(document.getElementById("up-error")?.textContent).toMatch(/larger than 1 MB/);
    expect(document.getElementById("status-box")).toBeNull();
    expect(text).not.toHaveBeenCalled();
  });

  it("a file that is YAML but not a mapping shows a message", async () => {
    await uploadFile(new File(["- one\n- two\n"], "project.yml"));
    expect(document.getElementById("up-error")?.textContent).toBe("project.yml must contain a mapping at the top level");
    expect(document.getElementById("status-box")).toBeNull();
  });

  it("an unknown field shows the field name", async () => {
    const doc = parse(toYaml(sampleProject("S"))) as Record<string, unknown>;
    doc["owner"] = "someone";
    await uploadFile(new File([stringify(doc)], "project.yml"));
    expect(document.getElementById("up-error")?.textContent).toMatch(/unknown field "owner"/);
    expect(document.getElementById("status-box")).toBeNull();
  });

  it("a project name with HTML is shown as plain text and nothing is injected", async () => {
    const hostile = "<b>x</b> <img src=x onerror=\"window.__pwned = 1\">";
    const p = { ...sampleProject("S"), name: hostile };
    await uploadFile(new File([toYaml(p)], "project.yml"));
    await vi.waitFor(() => expect(document.getElementById("status-box")).not.toBeNull());
    const box = document.getElementById("status-box")!;
    expect(box.textContent).toContain("<b>x</b>");
    expect(box.textContent).toContain("<img src=x");
    expect(box.querySelector("b")).toBeNull();
    expect(document.querySelector("img")).toBeNull();
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });

  it("an all-Arabic project name downloads as project-rescope-*.zip", async () => {
    const p = { ...sampleProject("M"), name: "مشروع" };
    await uploadFile(new File([toYaml(p)], "project.yml"));
    await vi.waitFor(() => expect(document.getElementById("rs-reason")).not.toBeNull());
    (document.getElementById("rs-reason") as HTMLInputElement).value = "Client cut scope";
    (document.getElementById("rs-approved") as HTMLInputElement).value = "Approver A";
    (document.getElementById("rs-date") as HTMLInputElement).value = "2026-11-05";
    const small = document.getElementById("rs-size-S") as HTMLInputElement;
    small.checked = true;
    small.dispatchEvent(new Event("change", { bubbles: true }));
    (document.getElementById("rs-download") as HTMLButtonElement).click();
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0]![1]).toMatch(/^project-rescope-S\.zip$/);
  });
});

describe("M4.3 every control has a label and focus order follows the page", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    const root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { save: vi.fn<SaveFn>(), today: "2026-11-01" });
  });

  function controls(): Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
    return Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea"));
  }

  it("every input, select and textarea has a visible label on the New project form", () => {
    const list = controls().filter((c) => !(c instanceof HTMLInputElement && c.type === "hidden"));
    expect(list.length).toBeGreaterThan(5);
    for (const c of list) {
      expect(c.id, "control needs an id").not.toBe("");
      const label = c.labels?.[0];
      expect(label?.textContent?.trim() ?? "", `label for #${c.id}`).not.toBe("");
    }
  });

  it("the Existing project controls are labelled too, including after an upload", async () => {
    await uploadFile(new File([toYaml(sampleProject("M"))], "project.yml"));
    await vi.waitFor(() => expect(document.getElementById("rs-reason")).not.toBeNull());
    for (const c of controls()) {
      expect(c.labels?.[0]?.textContent?.trim() ?? "", `label for #${c.id}`).not.toBe("");
    }
  });

  it("no positive tabindex, so the tab order is the page order", () => {
    for (const el of Array.from(document.querySelectorAll("[tabindex]"))) {
      expect(Number(el.getAttribute("tabindex"))).toBeLessThanOrEqual(0);
    }
  });

  it("every button has text, and tabs expose their state", () => {
    for (const b of Array.from(document.querySelectorAll("button"))) {
      expect(b.textContent?.trim(), b.outerHTML).not.toBe("");
    }
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    expect(tabs.map((t) => t.textContent)).toEqual(["New project", "Existing project"]);
    expect(tabs.map((t) => t.getAttribute("aria-selected"))).toEqual(["true", "false"]);
  });
});
