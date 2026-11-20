import { parse } from "yaml";
import type { Size, Track } from "./types";

// Every file under templates/ is imported as raw text at build time.
// Keys look like "../../templates/dev/L/Implementation.md".
const RAW = import.meta.glob("../../templates/**/*.{md,yml}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export interface PhaseDef {
  name: string;
  items: string[];
}

function rawTemplate(path: string): string {
  const text = RAW[`../../templates/${path}`];
  if (text === undefined) throw new Error(`missing template: templates/${path}`);
  return text;
}

/** Shared entry file body (README.md or AGENTS.md). */
export const ENTRY_TEMPLATE: string = rawTemplate("_shared/entry.md");

/** Rescope note template and the per-direction instruction snippets (spec section 6). */
export const RESCOPE_NOTE_TEMPLATE: string = rawTemplate("_shared/RESCOPE_NOTE.md");
export function rescopeSnippet(name: "down-L-M" | "down-M-S" | "up"): string {
  return rawTemplate(`_shared/rescope/${name}.md`);
}

/** Template for one generated file of a track and size, by its output name. */
export function fileTemplate(track: Track, size: Size, fileName: string): string {
  return rawTemplate(`${track}/${size}/${fileName}`);
}

/** Phase checklist for a track and size, from the matching column of spec section 5. */
export function phaseDefs(track: Track, size: Size): PhaseDef[] {
  const raw: unknown = parse(rawTemplate(`${track}/${size}/phases.yml`));
  const list = (raw as { phases?: unknown } | null)?.phases;
  if (!Array.isArray(list)) {
    throw new Error(`phases.yml for ${track}/${size} must have a 'phases' list`);
  }
  return list.map((p, i) => {
    const phase = p as { name?: unknown; items?: unknown };
    if (typeof phase.name !== "string" || !Array.isArray(phase.items)) {
      throw new Error(`phases.yml for ${track}/${size}: phase ${i + 1} needs a name and items`);
    }
    const items = phase.items.map((it) => {
      if (typeof it !== "string") throw new Error(`phases.yml for ${track}/${size}: items must be strings`);
      return it;
    });
    return { name: phase.name, items };
  });
}
