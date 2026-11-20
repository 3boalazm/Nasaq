// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountExisting } from "./existing";
import type { SaveFn } from "./dom";
import { toYaml } from "../core/projectYaml";
import { sampleProject } from "../testutil/sample";

/** Uploads text, then waits until the page shows the outcome (error text or status card). */
async function upload(text: string, name = "project.yml"): Promise<void> {
  const input = document.getElementById("up-file") as HTMLInputElement;
  const file = new File([text], name, { type: "text/yaml" });
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await vi.waitFor(() => {
    const err = document.getElementById("up-error")?.textContent ?? "";
    expect(err !== "" || document.getElementById("status-box") !== null).toBe(true);
  });
}

describe("existing project UI (upload, status, rescope)", () => {
  let root: HTMLElement;
  let save: ReturnType<typeof vi.fn<SaveFn>>;

  beforeEach(() => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    document.body.append(root);
    save = vi.fn<SaveFn>();
    mountExisting(root, { save, today: "2026-11-01" });
  });

  it("uploading a valid project.yml shows its status and the rescope panel", async () => {
    await upload(toYaml(sampleProject("S")));
    await vi.waitFor(() => expect(document.getElementById("status-box")?.textContent).toContain("Sample Project"));
    expect(document.getElementById("status-box")?.textContent).toContain("10 days");
    expect(document.getElementById("rescope-box")?.textContent).toContain("Download rescope ZIP");
    expect(document.getElementById("up-error")?.textContent).toBe("");
  });

  it("an invalid file shows the error and no status", async () => {
    await upload("name: [unclosed");
    expect(document.getElementById("up-error")?.textContent).toMatch(/not valid YAML/);
    expect(document.getElementById("status-box")).toBeNull();
  });

  it("an empty file shows a message", async () => {
    await upload("   ");
    expect(document.getElementById("up-error")?.textContent).toBe("The file is empty.");
  });

  it("a project over the S limit shows the scope alert, and the size is not changed", async () => {
    const p = sampleProject("S");
    const big = { ...p, phases: [{ ...p.phases[0]!, items: Array.from({ length: 6 }, (_, i) => ({ id: `i${i}`, title: `t${i}`, priority: "must" as const, status: "todo" as const })) }] };
    await upload(toYaml(big));
    await vi.waitFor(() => expect(document.getElementById("scope-alert")).not.toBeNull());
    expect(document.getElementById("scope-alert")?.textContent).toMatch(/Suggested next size: M/);
    expect((document.getElementById("rs-size") as HTMLSelectElement).value).toBe("M");
  });

  it("after a rescope the status shows the new size and the change history", async () => {
    await upload(toYaml(sampleProject("M")));
    await vi.waitFor(() => expect(document.getElementById("rs-reason")).not.toBeNull());
    (document.getElementById("rs-reason") as HTMLInputElement).value = "Client cut scope";
    (document.getElementById("rs-date") as HTMLInputElement).value = "2026-11-05";
    (document.getElementById("rs-size") as HTMLSelectElement).value = "S";
    (document.getElementById("rs-download") as HTMLButtonElement).click();
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(document.querySelector("table.history tbody")?.textContent).toContain("M → S"));
    expect(document.getElementById("status-box")?.textContent).toContain("S");
  });
});
