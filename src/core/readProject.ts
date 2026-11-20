import { MAX_PROJECT_YAML_BYTES, MAX_PROJECT_YAML_MB } from "./thresholds";
import { fromYaml, ProjectYamlError } from "./projectYaml";
import type { ErrorParams } from "./errors";
import type { Project } from "./types";

export type ReadResult = { ok: true; project: Project } | { ok: false; error: string };

/** Same as ReadResult, plus a stable `code` and `params` so the page can translate the failure. */
export type CodedReadResult =
  | { ok: true; project: Project }
  | { ok: false; error: string; code: string; params: ErrorParams };

export const TOO_LARGE_MESSAGE = `project.yml is larger than ${MAX_PROJECT_YAML_MB} MB. A Nasaq project.yml is a few kilobytes; this file is not one.`;

/** Reads an uploaded project.yml. Never throws. The page uses the coded form to translate messages. */
export function readProjectYamlCoded(text: string): CodedReadResult {
  try {
    if (new TextEncoder().encode(text).byteLength > MAX_PROJECT_YAML_BYTES) {
      return { ok: false, error: TOO_LARGE_MESSAGE, code: "too-large", params: {} };
    }
    if (text.trim() === "") return { ok: false, error: "The file is empty.", code: "empty", params: {} };
    return { ok: true, project: fromYaml(text) };
  } catch (err) {
    if (err instanceof ProjectYamlError) {
      return { ok: false, error: err.message, code: err.code, params: err.params };
    }
    // Anything else is a bug or an odd input; the page must still show a message.
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `project.yml could not be read: ${detail}`, code: "unreadable", params: {} };
  }
}

/** Reads an uploaded project.yml. Never throws: returns a message the page can show. */
export function readProjectYaml(text: string): ReadResult {
  const result = readProjectYamlCoded(text);
  return result.ok ? result : { ok: false, error: result.error };
}
