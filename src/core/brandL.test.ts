import { describe, expect, it } from "vitest";
import { createProject, type IntakeAnswers } from "./intake";
import { renderProjectFiles } from "./files";
import { sizeRule } from "./render";
import { filePlan, roleFiles } from "./plan";
import { APPROVERS_BANDS, DELIVERABLES_BANDS, DURATION_DAYS_BANDS } from "./thresholds";

const answers: IntakeAnswers = {
  name: "Sample Brand",
  track: "brand",
  startDate: "2026-11-20",
  deadline: "2027-01-20",
  approver: "Approver A",
  outOfScopeText: "Website build\nPrinting",
  deliverables: 20,
  approvers: 3,
  risk: "hard_undo",
  unknowns: "research_needed",
};

const files = renderProjectFiles(createProject(answers, "L", "2026-11-20"));
const file = (name: string): string => files[name] ?? "";
const MODULES = [
  "01_Project_Intelligence.md",
  "02_Brand_Strategy.md",
  "03_Creative_Development.md",
  "04_Design_System.md",
  "05_Quality_Validation.md",
  "06_Delivery_Lifecycle.md",
];
const GOVERNING = ["00_Governance.md", "00_AI_Orchestration.md", "00_Risk_Register.md", "Handoff.md"];

describe("brand L: six modules under a governing layer", () => {
  it("generates the entry file, project.yml, four governing files and six modules", () => {
    expect(Object.keys(files).sort()).toEqual(["README.md", "project.yml", ...GOVERNING, ...MODULES].sort());
    expect(filePlan("brand", "L").slice(2)).toEqual([...GOVERNING, ...MODULES]);
  });

  it("renders with no placeholder left in any file", () => {
    for (const [name, text] of Object.entries(files)) expect(text, name).not.toMatch(/\{\{.*?\}\}/);
  });

  it("no file points to a file that is not generated", () => {
    const names = new Set(Object.keys(files));
    for (const [name, text] of Object.entries(files)) {
      for (const ref of text.match(/[A-Za-z0-9_]+\.md/g) ?? []) {
        if (ref === "RESCOPE_NOTE.md") continue;
        expect(names.has(ref), `${name} → ${ref}`).toBe(true);
      }
    }
  });

  it("entry file names the governing files and sends the reader to the module of the phase", () => {
    const text = file("README.md");
    expect(text).toContain("Read 00_Governance.md, 00_AI_Orchestration.md, 00_Risk_Register.md and Handoff.md fully.");
    expect(text).toContain("Then open the numbered module for the phase in hand (01 to 06).");
  });

  it("other tracks and sizes keep the plain entry sentence", () => {
    const dev = renderProjectFiles(createProject({ ...answers, track: "dev" }, "L", "2026-11-20"));
    expect(dev["AGENTS.md"]).toContain("for the brief, phases, checklists and handoff.\n");
    const s = renderProjectFiles(createProject(answers, "S", "2026-11-20"));
    expect(s["README.md"]).not.toContain("numbered module");
  });

  it("every module ends with a gate checklist", () => {
    for (const name of MODULES.filter((m) => m !== "05_Quality_Validation.md")) {
      const text = file(name);
      expect(text, name).toMatch(/^## \d Gates?/m);
      expect(text.match(/^- \[ \] /gm)?.length ?? 0, name).toBeGreaterThanOrEqual(4);
    }
  });

  it("governance maps every module to a phase and holds scope, roles, timeline, feedback and change rules", () => {
    const text = file("00_Governance.md");
    for (const m of MODULES) expect(text, m).toContain(m);
    expect(text).toContain(sizeRule("L"));
    expect(text).toContain("- Website build\n- Printing");
    expect(text).toContain("| Client decision owner (final say; sends the one feedback list) | Approver A |");
    for (const heading of ["## 6 Feedback", "## 7 Change requests", "## 8 Version control"]) expect(text).toContain(heading);
    for (const phase of ["Discovery", "Strategy", "Identity core", "System", "Applications", "Handover"]) {
      expect(text, phase).toContain(`| ${phase} | _ | _ | _ | _ | 0 |`);
    }
  });

  it("AI orchestration holds the prompts, the load map, the rules and the log", () => {
    const text = file("00_AI_Orchestration.md");
    for (const heading of ["## 1 Start prompts", "## 2 What to load per phase", "## 3 AI rules", "## 4 Phase spec template", "## 5 AI log"]) {
      expect(text, heading).toContain(heading);
    }
    expect(text).toContain("An AI agent never approves a gate.");
  });

  it("strategy lists its required outputs, each with an acceptance cell", () => {
    const rows = file("02_Brand_Strategy.md").split("\n").filter((l) => /^\| (Purpose|Vision|Positioning|Personas|Value|Personality|Messaging|Tone|Architecture|Differentiation|Archetype)/.test(l));
    expect(rows.length).toBe(11);
    for (const row of rows) for (const cell of row.split("|").slice(1, -1)) expect(cell.trim(), row).not.toBe("");
  });

  it("the size rule is built from the thresholds", () => {
    const rule = sizeRule("L");
    expect(rule).toContain(`${DURATION_DAYS_BANDS.L.min}+ days`);
    expect(rule).toContain(`${DELIVERABLES_BANDS.L.min}+ deliverables`);
    expect(rule).toContain(`${APPROVERS_BANDS.L.min}+ approvers`);
    expect(sizeRule("M")).toContain(`${DURATION_DAYS_BANDS.M.min}–${DURATION_DAYS_BANDS.M.max} days`);
  });

  it("risks are scored and owned", () => {
    const text = file(roleFiles("brand").risk);
    expect(text).toContain("probability 1–3 × impact 1–3");
    expect(text.match(/^\| PR-\d\d /gm)?.length).toBe(8);
  });

  it("every baseline test has a pass condition, and the five validation areas are mapped", () => {
    const text = file(roleFiles("brand").test);
    const rows = text.split("\n").filter((l) => l.startsWith("| AT-BASE-"));
    expect(rows.length).toBe(16);
    for (const row of rows) {
      const cells = row.split("|").slice(1, -1).map((c) => c.trim());
      expect(cells.length, row).toBe(6);
      expect(cells[3]!.length, row).toBeGreaterThan(15);
    }
    for (const area of ["Visual QA", "Accessibility", "Language", "Legal", "Print"]) expect(text).toContain(`| ${area} |`);
  });

  it("delivery holds formats, folders, naming, rights, asset register and maintenance", () => {
    const text = file("06_Delivery_Lifecycle.md");
    for (const heading of ["## 1 Formats", "## 2 Folders", "## 3 Names and versions", "## 4 Rights and licences", "## 5 Asset register", "## 6 Documentation", "## 7 Maintenance", "## 8 Gate: closing the project"]) {
      expect(text, heading).toContain(heading);
    }
  });

  it("handoff keeps the state and the logs", () => {
    const text = file("Handoff.md");
    for (const heading of ["## Current state", "## NEXT", "## Approvals", "## Feedback log", "## Change requests", "## Decisions", "## Change log", "## Session log"]) {
      expect(text, heading).toContain(heading);
    }
  });
});
