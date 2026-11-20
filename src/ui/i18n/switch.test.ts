// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountApp } from "../app";
import { mountStatus } from "../status";
import { setLanguage } from "./index";
import { sampleProject } from "../../testutil/sample";

const ARABIC_INDIC = /[\u0660-\u0669\u06F0-\u06F9]/;

function pillFor(root: HTMLElement, code: "en" | "ar"): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>(`.lang-pill[lang="${code}"]`)!;
}
const text = (id: string): string => document.getElementById(id)?.textContent ?? "";

let root: HTMLElement;
beforeEach(() => {
  document.body.innerHTML = "";
  root = document.createElement("div");
  document.body.append(root);
  mountApp(root, { save: vi.fn(), today: "2026-11-01" });
});
afterEach(() => {
  setLanguage("en", { persist: false, url: false });
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("language switch in the header", () => {
  it("is a two-option button group with aria-pressed, English first", () => {
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>(".lang-switch button"));
    expect(buttons.map((b) => b.textContent)).toEqual(["English", "العربية"]);
    expect(pillFor(root, "en").getAttribute("aria-pressed")).toBe("true");
    expect(pillFor(root, "ar").getAttribute("aria-pressed")).toBe("false");
  });

  it("switching to Arabic changes lang and dir, updates the URL and the pressed state, and does not reload", () => {
    (window as unknown as { marker: string }).marker = "still here";
    pillFor(root, "ar").click();
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
    expect(new URL(window.location.href).searchParams.get("lang")).toBe("ar");
    expect(pillFor(root, "ar").getAttribute("aria-pressed")).toBe("true");
    expect((window as unknown as { marker: string }).marker).toBe("still here");
    expect(root.querySelector("h1")?.textContent).toBe("Nasaq");
    expect(root.querySelector('[role="tab"]')?.textContent).toBe("مشروع جديد");

    pillFor(root, "en").click();
    expect(document.documentElement.dir).toBe("ltr");
    expect(root.querySelector('[role="tab"]')?.textContent).toBe("New project");
  });

  it("the generated-files note sits under Download, in both languages", () => {
    const note = root.querySelector(".download-note");
    expect(note?.textContent).toContain("stay in English");
    pillFor(root, "ar").click();
    expect(note?.textContent).toContain("تبقى بالإنجليزية");
  });
});

describe("the wizard keeps its state across a language switch", () => {
  it("keeps typed values, the step, and the chosen track", () => {
    const name = document.getElementById("f-name") as HTMLInputElement;
    name.value = "Acme Relaunch";
    name.dispatchEvent(new Event("input", { bubbles: true }));
    (document.getElementById("f-track-uiux") as HTMLInputElement).click();
    document.getElementById("f-next")!.click();
    expect(document.getElementById("f-step-count")?.textContent).toBe("2 of 3");

    const deadline = document.getElementById("f-deadline") as HTMLInputElement;
    deadline.value = "2026-12-15";
    deadline.dispatchEvent(new Event("input", { bubbles: true }));
    const deliverables = document.getElementById("f-deliverables") as HTMLInputElement;
    deliverables.value = "3";
    deliverables.dispatchEvent(new Event("input", { bubbles: true }));
    (document.getElementById("f-risk-easy_undo") as HTMLInputElement).click();
    (document.getElementById("f-unknowns-none") as HTMLInputElement).click();

    pillFor(root, "ar").click();
    expect(document.getElementById("f-step-count")?.textContent).toBe("2 من 3");
    expect((document.getElementById("step-2") as HTMLElement).hidden).toBe(false);
    expect(deadline.value).toBe("2026-12-15");
    expect(text("f-duration")).toContain("المدة:");

    document.getElementById("f-back")!.click();
    expect((document.getElementById("f-name") as HTMLInputElement).value).toBe("Acme Relaunch");
    expect((document.querySelector('input[name="f-track"]:checked') as HTMLInputElement).value).toBe("uiux");
  });
});

describe("validation messages follow the language", () => {
  it("shows the error in English, then in Arabic, while it stays on screen", () => {
    document.getElementById("f-next")!.click();
    expect(text("err-f-name")).toBe("Enter a project name.");
    pillFor(root, "ar").click();
    expect(text("err-f-name")).toBe("أدخل اسم المشروع.");
    expect(document.getElementById("f-name")?.getAttribute("aria-invalid")).toBe("true");
    // Focus goes to the first invalid field.
    expect(document.activeElement?.id).toBe("f-name");
  });

  it("the Arabic error text is the one from the Arabic dictionary", () => {
    pillFor(root, "ar").click();
    document.getElementById("f-next")!.click();
    expect(text("err-f-name")).toBe("أدخل اسم المشروع.");
  });
});

describe("the dashboard renders in Arabic from a sample project.yml", () => {
  it("shows Arabic headings, Western digits, and Latin file names inside the Arabic", () => {
    setLanguage("ar", { persist: false, url: false });
    const box = document.createElement("div");
    document.body.append(box);
    mountStatus(box, sampleProject("S", "dev"), "2026-11-01");
    const headings = Array.from(box.querySelectorAll(".card-head")).map((h) => h.textContent);
    expect(headings).toEqual(["النطاق", "البنود المفتوحة", "المراحل", "الحجم", "المخرجات", "سجل الحجم"]);
    expect(box.querySelector(".pill")?.textContent).toBe("الحجم S");
    expect(box.querySelector(".pill + .pill")?.textContent).toBe("تطوير");
    expect(box.querySelector("#scope-alert")?.textContent).toContain("تنبيه النطاق");
    expect(box.textContent).toContain("المدة من البداية حتى الموعد النهائي 10 يوم");
    expect(box.textContent).toContain("بدءًا من");
    expect(ARABIC_INDIC.test(box.textContent ?? "")).toBe(false);
    expect(box.querySelector(".dash-name")?.getAttribute("dir")).toBe("auto");
  });

  it("the upload panel and the rescope panel are Arabic after a switch", () => {
    pillFor(root, "ar").click();
    const panel = root.querySelectorAll<HTMLElement>('[role="tabpanel"]')[1]!;
    expect(panel.querySelector("#up-zone h2")?.textContent).toBe("رفع project.yml");
    expect(panel.querySelector(".dropzone-label")?.textContent).toBe("project.yml");
  });
});
