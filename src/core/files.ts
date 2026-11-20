import { ENTRY_TEMPLATE, sProjectTemplate } from "./templates";
import { render } from "./render";
import { filePlan } from "./plan";
import { toYaml } from "./projectYaml";
import type { Project } from "./types";

/**
 * Renders every file in filePlan(track, size) as text, keyed by file name.
 * Only size S has templates in this sprint.
 */
export function renderProjectFiles(project: Project): Record<string, string> {
  if (project.size !== "S") {
    throw new Error(`templates for size ${project.size} arrive in S2`);
  }
  const plan = filePlan(project.track, project.size);
  const files: Record<string, string> = {};
  for (const name of plan) {
    if (name === "project.yml") {
      files[name] = toYaml(project);
    } else if (name === "PROJECT.md") {
      files[name] = render(sProjectTemplate(project.track), project);
    } else {
      files[name] = render(ENTRY_TEMPLATE, project);
    }
  }
  return files;
}

/** Lowercase ASCII slug for file names. Falls back to "project". */
export function projectSlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "project";
}

export function zipFileName(project: Project): string {
  return `${projectSlug(project.name)}.zip`;
}
