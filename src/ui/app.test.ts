// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { mountApp } from "./app";

describe("two-tab page", () => {
  it("shows New project by default and switches to Existing project", () => {
    const root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { today: "2026-11-01" });
    const [tabNew, tabExisting] = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
    expect(tabNew!.textContent).toBe("New project");
    expect(tabExisting!.textContent).toBe("Existing project");
    expect(panels[0]!.hidden).toBe(false);
    expect(panels[1]!.hidden).toBe(true);
    expect(tabNew!.getAttribute("aria-selected")).toBe("true");

    tabExisting!.click();
    expect(panels[0]!.hidden).toBe(true);
    expect(panels[1]!.hidden).toBe(false);
    expect(tabExisting!.getAttribute("aria-selected")).toBe("true");
    root.remove();
  });
});
