import JSZip from "jszip";
import { renderProjectFiles } from "./files";
import { render } from "./render";
import { renderRescopeNote, newFilesFor } from "./rescope";
import { toYaml } from "./projectYaml";
import { fileTemplate } from "./templates";
import type { Project, Size } from "./types";

/** Builds the ZIP of Markdown files plus project.yml as a Blob. */
export async function buildZip(project: Project): Promise<Blob> {
  const files = renderProjectFiles(project);
  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content);
  }
  return zip.generateAsync({ type: "blob", mimeType: "application/zip" });
}

/**
 * Rescope ZIP. Going up: the new files for the new size, plus project.yml and RESCOPE_NOTE.md.
 * Going down: project.yml and RESCOPE_NOTE.md only. Files the user already has are never included.
 */
export async function buildRescopeZip(project: Project, from: Size): Promise<Blob> {
  const zip = new JSZip();
  zip.file("project.yml", toYaml(project));
  zip.file("RESCOPE_NOTE.md", renderRescopeNote(project, from));
  for (const name of newFilesFor(project.track, from, project.size)) {
    zip.file(name, render(fileTemplate(project.track, project.size, name), project));
  }
  return zip.generateAsync({ type: "blob", mimeType: "application/zip" });
}
