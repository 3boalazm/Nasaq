import JSZip from "jszip";
import { renderProjectFiles } from "./files";
import type { Project } from "./types";

/** Builds the ZIP of Markdown files plus project.yml as a Blob. */
export async function buildZip(project: Project): Promise<Blob> {
  const files = renderProjectFiles(project);
  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content);
  }
  return zip.generateAsync({ type: "blob", mimeType: "application/zip" });
}
