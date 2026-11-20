// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountIntakeForm, readAnswers } from "./form";
import type { SaveFn } from "./dom";
import { fieldErrors, suggestFromIntake } from "../core/intake";
import { phaseDefs } from "../core/templates";
import { TRACK_LABELS } from "./labels";

/** Chooses a selection card: check the radio and fire change, as a click does. */
const pick = (name: string, value: string): void => {
  const radio = document.getElementById(`${name}-${value}`) as HTMLInputElement;
  radio.checked = true;
  radio.dispatchEvent(new Event("change", { bubbles: true }));
};
const setVal = (id: string, value: string): void => {
  const node = document.getElementById(id) as HTMLInputElement;
  node.value = value;
  node.dispatchEvent(new Event("input", { bubbles: true }));
};
const stepHidden = (n: number): boolean => (document.getElementById(`step-${n}`) as HTMLElement).hidden === true;
const click = (id: string): void => (document.getElementById(id) as HTMLButtonElement).click();
const errorOf = (id: string): string => {
  const line = document.getElementById(`err-${id}`);
  return line && !line.hidden ? line.textContent ?? "" : "";
};
const checked = (name: string): string =>
  (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement | null)?.value ?? "";

describe("wizard: step gating", () => {
  let save: ReturnType<typeof vi.fn<SaveFn>>;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    save = vi.fn<SaveFn>();
    mountIntakeForm(document.getElementById("app") as HTMLElement, save);
  });

  it("starts on step 1 of 3 with Back hidden and Download hidden", () => {
    expect(stepHidden(1)).toBe(false);
    expect(stepHidden(2)).toBe(true);
    expect(stepHidden(3)).toBe(true);
    expect(document.getElementById("f-step-count")?.textContent).toBe("1 of 3");
    expect((document.getElementById("f-back") as HTMLElement).hidden).toBe(true);
    expect((document.getElementById("f-download") as HTMLElement).hidden).toBe(true);
  });

  it("Continue is blocked on step 1 without a track, and the track error is shown", () => {
    setVal("f-name", "Acme");
    click("f-next");
    expect(stepHidden(1)).toBe(false);
    expect(stepHidden(2)).toBe(true);
    expect(errorOf("f-track")).toBe("Choose a track.");
    expect(document.activeElement?.id).toBe("f-track-brand");
  });

  it("Continue is blocked on step 1 without a name", () => {
    pick("f-track", "dev");
    click("f-next");
    expect(stepHidden(1)).toBe(false);
    expect(errorOf("f-name")).toBe("Enter a project name.");
  });

  it("a valid step 1 moves to step 2, and Back returns without losing answers", () => {
    setVal("f-name", "Acme");
    pick("f-track", "uiux");
    click("f-next");
    expect(stepHidden(2)).toBe(false);
    expect(stepHidden(1)).toBe(true);
    expect(document.getElementById("f-step-count")?.textContent).toBe("2 of 3");
    click("f-back");
    expect(stepHidden(1)).toBe(false);
    expect((document.getElementById("f-name") as HTMLInputElement).value).toBe("Acme");
    expect(checked("f-track")).toBe("uiux");
  });

  it("Continue is blocked on step 2 when the deadline is missing", () => {
    setVal("f-name", "Acme");
    pick("f-track", "dev");
    click("f-next");
    setVal("f-deadline", "");
    click("f-next");
    expect(stepHidden(2)).toBe(false);
    expect(stepHidden(3)).toBe(true);
    expect(errorOf("f-deadline")).toBe("Enter a deadline.");
  });

  it("a step 2 error moves focus to the first invalid field", () => {
    setVal("f-name", "Acme");
    pick("f-track", "dev");
    click("f-next");
    setVal("f-deadline", "2026-11-25");
    setVal("f-deliverables", "0");
    click("f-next");
    expect(document.activeElement?.id).toBe("f-deliverables");
  });

  it("step 3 shows the labelled stepper, the Download button, and the tip", () => {
    setVal("f-name", "Acme");
    pick("f-track", "dev");
    click("f-next");
    setVal("f-deadline", "2026-11-25");
    setVal("f-start", "2026-11-20");
    setVal("f-deliverables", "2");
    pick("f-risk", "easy_undo");
    pick("f-unknowns", "none");
    click("f-next");
    expect(stepHidden(3)).toBe(false);
    expect(document.querySelectorAll(".stepper .stage").length).toBe(3);
    expect((document.getElementById("f-next") as HTMLElement).hidden).toBe(true);
    expect((document.getElementById("f-download") as HTMLElement).hidden).toBe(false);
    expect(document.querySelector(".tip")?.textContent).toBe("Tip: cut nice items first when the deadline moves.");
  });

  it("the first Download click with an empty step 1 jumps back to step 1 and reveals every error", () => {
    click("f-download");
    expect(stepHidden(1)).toBe(false);
    expect(stepHidden(3)).toBe(true);
    expect(errorOf("f-name")).toBe("Enter a project name.");
    expect(errorOf("f-track")).toBe("Choose a track.");
    expect(save).not.toHaveBeenCalled();
  });
});

describe("wizard: selection cards set the same values the old selects did", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    mountIntakeForm(document.getElementById("app") as HTMLElement, vi.fn<SaveFn>());
  });

  it("each track card is a radio whose label is the card, with the phase count", () => {
    for (const t of ["brand", "uiux", "dev"] as const) {
      const radio = document.getElementById(`f-track-${t}`) as HTMLInputElement;
      expect(radio.type).toBe("radio");
      expect(radio.name).toBe("f-track");
      const card = radio.closest("label")!;
      expect(card.textContent).toContain(TRACK_LABELS[t]);
      expect(card.textContent).toContain(`${phaseDefs(t, "S").length} phases`);
    }
  });

  it("choosing a track card gives the same track value as the old select", () => {
    pick("f-track", "uiux");
    expect(readAnswers(document.getElementById("app")!).track).toBe("uiux");
  });

  it("choosing risk and unknowns cards gives the same values as the old selects", () => {
    pick("f-risk", "hard_undo");
    pick("f-unknowns", "research_needed");
    const a = readAnswers(document.getElementById("app")!);
    expect(a.risk).toBe("hard_undo");
    expect(a.unknowns).toBe("research_needed");
  });

  it("risk and unknowns are three cards each, in one radio group per field", () => {
    expect(document.querySelectorAll('input[name="f-risk"]').length).toBe(3);
    expect(document.querySelectorAll('input[name="f-unknowns"]').length).toBe(3);
  });

  it("a card choice changes the suggested size exactly as the same values in the old selects did", () => {
    setVal("f-name", "Acme");
    setVal("f-start", "2026-11-01");
    setVal("f-deadline", "2026-12-20");
    setVal("f-deliverables", "8");
    pick("f-track", "brand");
    pick("f-risk", "hard_undo");
    pick("f-unknowns", "none");
    const a = readAnswers(document.getElementById("app")!);
    expect(fieldErrors(a)).toEqual({});
    expect(checked("f-size")).toBe(suggestFromIntake(a).size);
    expect(document.getElementById("f-suggestion")?.textContent).toMatch(/^Suggested size: L\. Decided by: /);
  });
});

describe("wizard: suggested size is preselected and labelled", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    mountIntakeForm(document.getElementById("app") as HTMLElement, vi.fn<SaveFn>());
  });

  it("once the answers are valid, the suggested size card is checked and labelled Suggested", () => {
    setVal("f-name", "Acme");
    pick("f-track", "dev");
    setVal("f-start", "2026-11-20");
    setVal("f-deadline", "2026-11-25");
    setVal("f-deliverables", "2");
    setVal("f-approvers", "1");
    pick("f-risk", "easy_undo");
    pick("f-unknowns", "none");
    expect(checked("f-size")).toBe("S");
    const badges = Array.from(document.querySelectorAll<HTMLElement>(".size-card .badge"));
    const visible = badges.filter((b) => !b.hidden);
    expect(visible.length).toBe(1);
    expect(visible[0]!.textContent).toBe("Suggested");
    expect(visible[0]!.closest("label")?.getAttribute("for")).toBe("f-size-S");
  });

  it("the detail of the chosen card lists the deciding answers and the files from filePlan", () => {
    setVal("f-name", "Acme");
    pick("f-track", "dev");
    setVal("f-start", "2026-11-20");
    setVal("f-deadline", "2026-11-25");
    setVal("f-deliverables", "2");
    pick("f-risk", "easy_undo");
    pick("f-unknowns", "none");
    // The checked card's detail is the one shown. Suggested is S here, so its detail has the deciding answers.
    const chosenCard = document.querySelector<HTMLInputElement>('input[name="f-size"]:checked')!.closest("label")!;
    const detail = chosenCard.querySelector<HTMLElement>(".detail");
    expect(detail?.hidden).toBe(false);
    const text = detail?.textContent ?? "";
    expect(text).toMatch(/Decided by: /);
    expect(text).toContain("AGENTS.md");
    expect(text).toContain("project.yml");
    expect(text).toContain("PROJECT.md");
  });

  it("the summary panel shows the name, track, dates, duration and the live suggestion", () => {
    setVal("f-name", "Acme");
    pick("f-track", "brand");
    setVal("f-start", "2026-11-20");
    setVal("f-deadline", "2026-11-25");
    setVal("f-deliverables", "2");
    pick("f-risk", "easy_undo");
    pick("f-unknowns", "none");
    expect(document.getElementById("f-sum-name")?.textContent).toBe("Acme");
    expect(document.getElementById("f-sum-track")?.textContent).toBe("Brand identity");
    expect(document.getElementById("f-sum-dates")?.textContent).toBe("2026-11-20 to 2026-11-25");
    expect(document.getElementById("f-duration")?.textContent).toBe("Duration: 6 days, counting start and deadline.");
    expect(document.getElementById("f-suggestion")?.textContent).toMatch(/^Suggested size: S\./);
  });

  it("every selection group is one radio group, so arrow keys move within it", () => {
    for (const name of ["f-track", "f-risk", "f-unknowns", "f-size"]) {
      const radios = Array.from(document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`));
      expect(radios.length, name).toBeGreaterThan(1);
      expect(new Set(radios.map((r) => r.name)).size).toBe(1);
    }
  });
});
