import { MAX_PROJECT_YAML_BYTES } from "./thresholds";
import { fromYaml, ProjectYamlError } from "./projectYaml";
import type { Project } from "./types";

export type ReadResult = { ok: true; project: Project } | { ok: false; error: string };

export const TOO_LARGE_MESSAGE = `project.yml is larger than ${MAX_PROJECT_YAML_BYTES / (1024 * 1024)} MB. A Nasaq project.yml is a few kilobytes; this file is not one.`;

/** Reads an uploaded project.yml. Never throws: returns a message the page can show. */
export function readProjectYaml(text: string): ReadResult {
  try {
    if (new TextEncoder().encode(text).byteLength > MAX_PROJECT_YAML_BYTES) {
      return { ok: false, error: TOO_LARGE_MESSAGE };
    }
    if (text.trim() === "") return { ok: false, error: "The file is empty." };
    return { ok: true, project: fromYaml(text) };
  } catch (err) {
    if (err instanceof ProjectYamlError) return { ok: false, error: err.message };
    // Anything else is a bug or an odd input; the page must still show a message.
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `project.yml could not be read: ${detail}` };
  }
}
