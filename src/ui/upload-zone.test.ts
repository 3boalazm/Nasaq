// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountExisting } from "./existing";
import type { SaveFn } from "./dom";
import { toYaml } from "../core/projectYaml";
import { sampleProject } from "../testutil/sample";

describe("existing project: drop zone", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    const root = document.createElement("div");
    document.body.append(root);
    mountExisting(root, { save: vi.fn<SaveFn>(), today: "2026-11-01" });
  });

  it("the drop zone contains the real file input, labelled project.yml", () => {
    const zone = document.getElementById("up-zone")!;
    const input = zone.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input?.id).toBe("up-file");
    expect(zone.querySelector("label")?.getAttribute("for")).toBe("up-file");
  });

  it("dropping a project.yml on the zone shows the dashboard, like choosing it", async () => {
    const zone = document.getElementById("up-zone")!;
    const file = new File([toYaml(sampleProject("S"))], "project.yml", { type: "text/yaml" });
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", { value: { files: [file] } });
    zone.dispatchEvent(drop);
    await vi.waitFor(() => expect(document.getElementById("status-box")?.textContent).toContain("Sample Project"));
    expect(zone.classList.contains("compact")).toBe(true);
  });
});
