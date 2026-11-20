import { ENTRY_TEMPLATE, fileTemplate } from "./templates";
import { render } from "./render";
import { ENTRY_FILE, PROJECT_YAML, filePlan } from "./plan";
import { toYaml } from "./projectYaml";
import type { Project } from "./types";

/**
 * Renders every file in filePlan(track, size) as text, keyed by file name.
 * Covers all nine track × size combinations.
 */
export function renderProjectFiles(project: Project): Record<string, string> {
  const files: Record<string, string> = {};
  for (const name of filePlan(project.track, project.size)) {
    if (name === PROJECT_YAML) {
      files[name] = toYaml(project);
    } else if (name === ENTRY_FILE[project.track]) {
      files[name] = render(ENTRY_TEMPLATE, project);
    } else {
      files[name] = render(fileTemplate(project.track, project.size, name), project);
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
