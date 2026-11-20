import { describe, expect, it } from "vitest";
import { render } from "./render";
import { createProject, type IntakeAnswers } from "./intake";
import { ENTRY_TEMPLATE, sProjectTemplate } from "./templates";
import { TRACKS, type Project } from "./types";

const answers: IntakeAnswers = {
  name: "Sample Project",
  track: "dev",
  startDate: "2026-11-20",
  deadline: "2026-11-25",
  approver: "Approver A",
  outOfScopeText: "Mobile app\nPayments",
  deliverables: 2,
  approvers: 1,
  risk: "easy_undo",
  unknowns: "none",
};

const project = (): Project => createProject(answers, "S", "2026-11-20");

describe("render", () => {
  it("replaces every placeholder with its value", () => {
    expect(render("Hello {{name}}, size {{size}}.", project())).toBe("Hello Sample Project, size S.");
  });

  it("throws on an unknown key", () => {
    expect(() => render("x {{nope}} y", project())).toThrow(/nope/);
  });

  it("does not treat prototype names as keys", () => {
    expect(() => render("{{constructor}}", project())).toThrow(/constructor/);
  });

  it("leaves no {{ behind in any S template", () => {
    for (const track of TRACKS) {
      const p = { ...project(), track };
      expect(render(sProjectTemplate(track), p)).not.toContain("{{");
      expect(render(ENTRY_TEMPLATE, p)).not.toContain("{{");
    }
  });

  it("renders out-of-scope lines as a list", () => {
    const out = render("{{outOfScope}}", project());
    expect(out).toBe("- Mobile app\n- Payments");
  });
});
