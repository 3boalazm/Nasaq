import { createProject, type IntakeAnswers } from "../core/intake";
import type { Project, Size, Track } from "../core/types";

export const SAMPLE_ANSWERS: IntakeAnswers = {
  name: "Sample Project",
  track: "dev",
  startDate: "2026-11-01",
  deadline: "2026-11-10",
  approver: "Approver A",
  outOfScopeText: "Mobile app",
  deliverables: 2,
  approvers: 1,
  risk: "easy_undo",
  unknowns: "none",
};

export function sampleProject(size: Size = "S", track: Track = "dev", over: Partial<IntakeAnswers> = {}): Project {
  return createProject({ ...SAMPLE_ANSWERS, track, ...over }, size, "2026-11-01");
}

/** Returns the id of the first item in the project's phases. */
export function firstItemId(p: Project): string {
  return p.phases[0]!.items[0]!.id;
}
