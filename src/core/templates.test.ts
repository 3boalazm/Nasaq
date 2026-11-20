import { describe, expect, it } from "vitest";
import { ENTRY_TEMPLATE, sPhaseDefs, sProjectTemplate } from "./templates";
import { TRACKS } from "./types";

const SECTIONS = ["## Brief", "## Out of scope", "## Phases", "## Baseline checklist", "## Decisions", "## Feedback log", "## Handoff"];

describe("S templates", () => {
  it.each(TRACKS)("%s PROJECT.md has the required sections in order", (track) => {
    const text = sProjectTemplate(track);
    let last = -1;
    for (const heading of SECTIONS) {
      const at = text.indexOf(heading);
      expect(at, heading).toBeGreaterThan(last);
      last = at;
    }
  });

  it("Decisions table has a Why column", () => {
    for (const track of TRACKS) {
      expect(sProjectTemplate(track)).toMatch(/\| Date \| Decision \| Why \|/);
    }
  });

  it("entry file states the six always-on rules and the start prompt", () => {
    const rules = [
      "Size and out-of-scope are written before work starts.",
      "One approval gate per phase, recorded (who, when, where).",
      "Every session ends with a handoff note: done, current state, next.",
      "Decisions are logged with the reason.",
      "Claims carry a tag: verified, client-reported, unverified, assumption.",
      "Nothing is sent, published, merged or deployed without your approval.",
    ];
    for (const rule of rules) expect(ENTRY_TEMPLATE).toContain(rule);
    expect(ENTRY_TEMPLATE).toMatch(/## Start prompt/);
    expect(ENTRY_TEMPLATE).toContain("Read PROJECT.md fully.");
  });

  it.each(TRACKS)("%s phases are the S column of spec section 5, all must / todo", (track) => {
    const phases = sPhaseDefs(track);
    expect(phases.length).toBeGreaterThan(0);
    for (const ph of phases) expect(ph.items.length).toBeGreaterThan(0);
  });

  it("brand S phases match spec 5.1 S column", () => {
    expect(sPhaseDefs("brand").map((p) => [p.name, p.items])).toEqual([
      ["Discovery", ["Questionnaire + 5 peers"]],
      ["Strategy", ["One positioning line, 3 attributes"]],
      ["Identity core", ["1 direction: logo AR/EN, colour, type"]],
      ["System", ["1-page usage sheet"]],
      ["Applications", ["2–3 mock-ups"]],
      ["Handover", ["Files + sheet"]],
    ]);
  });

  it("dev S phases match spec 5.3 S column", () => {
    expect(sPhaseDefs("dev").map((p) => p.name)).toEqual(["Spec", "Setup", "Build", "Verify", "Release"]);
  });
});
