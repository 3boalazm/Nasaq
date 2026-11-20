// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountApp } from "./app";
import { mountExisting } from "./existing";
import type { SaveFn } from "./dom";
import { toYaml } from "../core/projectYaml";
import { sampleProject } from "../testutil/sample";

/** Every action button must be a styled pill (primary or secondary). Tabs have their own style. */
function unstyledButtons(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll<HTMLButtonElement>("button"))
    .filter((b) => b.getAttribute("role") !== "tab")
    .filter((b) => !b.classList.contains("primary") && !b.classList.contains("secondary"))
    .map((b) => b.id || b.textContent || "(no text)");
}

describe("every button uses the page's button style, not the browser default", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("the New project wizard buttons are styled", () => {
    const root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { save: vi.fn<SaveFn>(), today: "2026-11-01" });
    expect(unstyledButtons(root)).toEqual([]);
    expect(root.querySelector("#f-download")?.classList.contains("primary")).toBe(true);
    expect(root.querySelector("#f-back")?.classList.contains("secondary")).toBe(true);
  });

  it("the Download rescope ZIP button is the same primary pill as Download ZIP", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    mountExisting(root, { save: vi.fn<SaveFn>(), today: "2026-11-01" });
    const input = root.querySelector<HTMLInputElement>("#up-file")!;
    const file = new File([toYaml(sampleProject("M"))], "project.yml", { type: "text/yaml" });
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(root.querySelector("#rs-download")).not.toBeNull());
    const rescue = root.querySelector<HTMLButtonElement>("#rs-download")!;
    expect(rescue.classList.contains("primary")).toBe(true);
    expect(unstyledButtons(root)).toEqual([]);
  });

  it("the file input stays in the page and is reachable by keyboard (not hidden or removed)", () => {
    const root = document.createElement("div");
    document.body.append(root);
    mountExisting(root, { save: vi.fn<SaveFn>(), today: "2026-11-01" });
    const input = root.querySelector<HTMLInputElement>("#up-file")!;
    expect(input.type).toBe("file");
    expect(input.hidden).toBe(false);
    expect(input.closest("[hidden]")).toBeNull();
  });
});
