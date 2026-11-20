import { describe, expect, it } from "vitest";
import { createProject, type IntakeAnswers } from "./intake";
import { renderProjectFiles } from "./files";
import { ENTRY_TEMPLATE, fileTemplate, phaseDefs } from "./templates";
import { SIZES, TRACKS, type Size, type Track } from "./types";
import { ENTRY_FILE, filePlan } from "./plan";

const SECTIONS = ["## Brief", "## Out of scope", "## Phases", "## Baseline checklist", "## Decisions", "## Feedback log", "## Handoff"];

const answers: IntakeAnswers = {
  name: "Sample Project",
  track: "brand",
  startDate: "2026-11-20",
  deadline: "2026-11-25",
  approver: "Approver A",
  outOfScopeText: "Mobile app",
  deliverables: 2,
  approvers: 1,
  risk: "easy_undo",
  unknowns: "none",
};

describe("S and M PROJECT.md templates", () => {
  it.each(TRACKS.flatMap((t) => (["S", "M"] as const).map((s) => [t, s] as const)))(
    "%s/%s PROJECT.md has the required sections in order",
    (track, size) => {
      const text = fileTemplate(track, size, "PROJECT.md");
      let last = -1;
      for (const heading of SECTIONS) {
        const at = text.indexOf(heading);
        expect(at, heading).toBeGreaterThan(last);
        last = at;
      }
    },
  );

  it("Decisions table has a Why column", () => {
    for (const track of TRACKS) {
      expect(fileTemplate(track, "S", "PROJECT.md")).toMatch(/\| Date \| Decision \| Why \|/);
    }
  });

  it("UI/UX baseline is the spec 5.2 checklist in S and M, not the placeholder", () => {
    for (const size of ["S", "M"] as const) {
      const text = fileTemplate("uiux", size, "PROJECT.md");
      expect(text).not.toContain("not defined for UI/UX");
      expect(text).toContain("- [ ] Text contrast AA (4.5:1)");
      expect(text).toContain("- [ ] Works at 375 px and 1280 px");
      expect(text).toContain("- [ ] Arabic/RTL parity when the product is bilingual");
      expect(text).toContain("- [ ] Keyboard reachable with visible focus");
      expect(text).toContain("- [ ] Every screen has empty, loading and error states");
    }
  });
});

describe("entry file", () => {
  it("states the six always-on rules and the start prompt", () => {
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
    expect(ENTRY_TEMPLATE).toContain("Read {{readFirst}} fully.");
  });

  it("names PROJECT.md for S and the L files for L, once rendered", () => {
    const s = createProject(answers, "S", "2026-11-20");
    expect(renderProjectFiles(s)["README.md"]).toContain("Read PROJECT.md fully.");
    const l = createProject({ ...answers, track: "dev" }, "L", "2026-11-20");
    const agents = renderProjectFiles(l)["AGENTS.md"] ?? "";
    expect(agents).toContain("Read Implementation.md, Security_issues.md, Test_scenarios.md and Handoff.md fully.");
    expect(agents).not.toContain("PROJECT.md");
  });
});

describe("phase lists", () => {
  it.each(TRACKS.flatMap((t) => SIZES.map((s) => [t, s] as const)))(
    "%s/%s phases.yml parses and has phases with items",
    (track: Track, size: Size) => {
      const phases = phaseDefs(track, size);
      expect(phases.length).toBeGreaterThan(0);
      for (const ph of phases) expect(ph.items.length).toBeGreaterThan(0);
    },
  );

  it("brand S phases match spec 5.1 S column", () => {
    expect(phaseDefs("brand", "S").map((p) => [p.name, p.items])).toEqual([
      ["Discovery", ["Questionnaire + 5 peers"]],
      ["Strategy", ["One positioning line, 3 attributes"]],
      ["Identity core", ["1 direction: logo AR/EN, colour, type"]],
      ["System", ["1-page usage sheet"]],
      ["Applications", ["2–3 mock-ups"]],
      ["Handover", ["Files + sheet"]],
    ]);
  });

  it("dev S phases match spec 5.3 S column", () => {
    expect(phaseDefs("dev", "S").map((p) => p.name)).toEqual(["Spec", "Setup", "Build", "Verify", "Release"]);
  });

  it("dev L Setup carries the M items plus the L '+' items (spec 5.3)", () => {
    const setup = phaseDefs("dev", "L").find((p) => p.name === "Setup");
    expect(setup?.items).toEqual([
      "Branch, preview deploy, env list",
      "CI, staging, secrets handling, migration plan, rollback plan",
    ]);
  });

  it("every track's M and L phase names match the spec's phase rows", () => {
    expect(phaseDefs("uiux", "L").map((p) => p.name)).toEqual(["Discover", "Define", "Design", "Validate", "Handoff"]);
    expect(phaseDefs("brand", "L").map((p) => p.name)).toEqual(["Discovery", "Strategy", "Identity core", "System", "Applications", "Handover"]);
    expect(phaseDefs("dev", "M").map((p) => p.name)).toEqual(["Spec", "Setup", "Build", "Verify", "Release"]);
  });

  it("filePlan sizes are used to pick templates (no missing file)", () => {
    for (const track of TRACKS) {
      for (const size of SIZES) {
        for (const name of filePlan(track, size)) {
          if (name === "project.yml" || name === ENTRY_FILE[track]) continue;
          expect(() => fileTemplate(track, size, name), `${track}/${size}/${name}`).not.toThrow();
        }
      }
    }
  });
});
