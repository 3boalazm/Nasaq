import type { Project } from "./types";

const PLACEHOLDER = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;

/** Values available to templates, derived from the project. */
export function buildContext(project: Project): Record<string, string> {
  const first = project.sizeHistory[0];
  return {
    name: project.name,
    size: project.size,
    startDate: project.startDate,
    deadline: project.deadline ?? "not set",
    approver: project.approver ?? "not set",
    outOfScope: project.outOfScope.length
      ? project.outOfScope.map((s) => `- ${s}`).join("\n")
      : "- None",
    phaseChecklist: project.phases
      .map((ph) => {
        const lines = ph.items.map(
          (it) => `- [ ] [${it.priority}] ${it.title}`,
        );
        return [`### ${ph.name}`, ...lines].join("\n");
      })
      .join("\n\n"),
    sizeDate: first?.date ?? "not set",
    sizeReason: first?.reason ?? "not set",
  };
}

/**
 * Fills {{key}} placeholders from the project.
 * Throws if the template uses a key the project does not provide.
 */
export function render(template: string, project: Project): string {
  const ctx = buildContext(project);
  return template.replace(PLACEHOLDER, (_match, key: string) => {
    if (!Object.hasOwn(ctx, key)) {
      throw new Error(`template uses placeholder {{${key}}}, which the project does not have`);
    }
    return ctx[key] as string;
  });
}
