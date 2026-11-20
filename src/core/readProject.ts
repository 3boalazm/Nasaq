import { fromYaml, ProjectYamlError } from "./projectYaml";
import type { Project } from "./types";

export type ReadResult = { ok: true; project: Project } | { ok: false; error: string };

/** Reads an uploaded project.yml. Never throws: returns a message the page can show. */
export function readProjectYaml(text: string): ReadResult {
  if (text.trim() === "") return { ok: false, error: "The file is empty." };
  try {
    return { ok: true, project: fromYaml(text) };
  } catch (err) {
    if (err instanceof ProjectYamlError) return { ok: false, error: err.message };
    throw err;
  }
}
