import { describe, expect, it } from "vitest";
import { createProject, type IntakeAnswers } from "./intake";
import { renderProjectFiles } from "./files";
import { sizeRule } from "./render";
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

describe("brand L: gaps closed after the template audit", () => {
  it("renders with no placeholder left in any file", () => {
    for (const [name, text] of Object.entries(files)) expect(text, name).not.toMatch(/\{\{.*?\}\}/);
  });

  it("entry file sends the reader to the playbook", () => {
    expect(file("README.md")).toContain("Handoff.md and Brand_Playbook.md");
  });

  it("playbook has operating rules and one section per phase", () => {
    const text = file("Brand_Playbook.md");
    for (const heading of [
      "### 0.1 Feedback",
      "### 0.2 Change requests",
      "### 0.3 AI use",
      "## 1 Discovery: research framework",
      "## 2 Strategy: required outputs",
      "## 3 Identity core: production spec",
      "## 4 System",
      "## 5 Applications: catalogue",
      "## 6 Handover: delivery spec",
    ]) {
      expect(text, heading).toContain(heading);
    }
  });

  it("every strategy output and identity component has an acceptance cell", () => {
    const rows = file("Brand_Playbook.md")
      .split("\n")
      .filter((l) => l.startsWith("| ") && !l.startsWith("|---"));
    expect(rows.length).toBeGreaterThan(40);
    for (const row of rows) {
      for (const cell of row.split("|").slice(1, -1)) expect(cell.trim(), row).not.toBe("");
    }
  });

  it("roadmap states why the size is L, the scope, named roles and a timeline row per phase", () => {
    const text = file("Brand_Roadmap.md");
    expect(text).toContain(sizeRule("L"));
    expect(text).toContain("- Website build\n- Printing");
    expect(text).toContain("| Client decision owner (final say; sends the one feedback list) | Approver A |");
    for (const phase of ["Discovery", "Strategy", "Identity core", "System", "Applications", "Handover"]) {
      expect(text, phase).toContain(`| ${phase} | _ | _ | _ | _ | 0 |`);
    }
  });

  it("the size rule is built from the thresholds", () => {
    const rule = sizeRule("L");
    expect(rule).toContain(`${DURATION_DAYS_BANDS.L.min}+ days`);
    expect(rule).toContain(`${DELIVERABLES_BANDS.L.min}+ deliverables`);
    expect(rule).toContain(`${APPROVERS_BANDS.L.min}+ approvers`);
    expect(sizeRule("M")).toContain(`${DURATION_DAYS_BANDS.M.min}–${DURATION_DAYS_BANDS.M.max} days`);
  });

  it("risks are scored and owned", () => {
    const text = file("Brand_Risks.md");
    expect(text).toContain("probability 1–3 × impact 1–3");
    expect(text).toContain("| ID | Risk | P | I | Score | Owner | Mitigation | Next review |");
    expect(text.match(/^\| PR-\d\d /gm)?.length).toBe(8);
  });

  it("every baseline application test has a pass condition", () => {
    const rows = file("Application_Tests.md").split("\n").filter((l) => l.startsWith("| AT-BASE-"));
    expect(rows.length).toBe(16);
    for (const row of rows) {
      const cells = row.split("|").slice(1, -1).map((c) => c.trim());
      expect(cells.length, row).toBe(6);
      expect(cells[3]!.length, row).toBeGreaterThan(15);
    }
  });

  it("handoff has feedback, change request and AI logs", () => {
    const text = file("Handoff.md");
    for (const heading of ["## Feedback log", "## Change requests", "## AI log"]) expect(text).toContain(heading);
  });
});
