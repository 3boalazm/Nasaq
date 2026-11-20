import JSZip from "jszip";
import { renderProjectFiles } from "./files";
import { rescopeZipFiles } from "./rescope";
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
 * Rescope ZIP: project.yml, RESCOPE_NOTE.md, the regenerated entry file, and the new files
 * for the new size. See rescopeZipFiles.
 */
export async function buildRescopeZip(project: Project, from: Size): Promise<Blob> {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(rescopeZipFiles(project, from))) {
    zip.file(name, content);
  }
  return zip.generateAsync({ type: "blob", mimeType: "application/zip" });
}
