import { parse } from "yaml";
import type { Track } from "./types";

// Template files are imported as raw text. All project text lives in templates/.
import brandS from "../../templates/brand/S/PROJECT.md?raw";
import uiuxS from "../../templates/uiux/S/PROJECT.md?raw";
import devS from "../../templates/dev/S/PROJECT.md?raw";
import brandPhasesS from "../../templates/brand/S/phases.yml?raw";
import uiuxPhasesS from "../../templates/uiux/S/phases.yml?raw";
import devPhasesS from "../../templates/dev/S/phases.yml?raw";
import entry from "../../templates/_shared/entry.md?raw";

export interface PhaseDef {
  name: string;
  items: string[];
}

const S_PROJECT: Record<Track, string> = { brand: brandS, uiux: uiuxS, dev: devS };
const S_PHASES: Record<Track, string> = { brand: brandPhasesS, uiux: uiuxPhasesS, dev: devPhasesS };

/** Entry file body, shared by all tracks (AGENTS.md for dev, README.md otherwise). */
export const ENTRY_TEMPLATE: string = entry;

/** PROJECT.md template for size S. */
export function sProjectTemplate(track: Track): string {
  return S_PROJECT[track];
}

/** Phase checklist for size S from the S column of spec section 5. */
export function sPhaseDefs(track: Track): PhaseDef[] {
  const raw: unknown = parse(S_PHASES[track]);
  if (typeof raw !== "object" || raw === null || !Array.isArray((raw as { phases?: unknown }).phases)) {
    throw new Error(`phases.yml for ${track} must have a 'phases' list`);
  }
  return ((raw as { phases: unknown[] }).phases).map((p, i) => {
    const phase = p as { name?: unknown; items?: unknown };
    if (typeof phase.name !== "string" || !Array.isArray(phase.items)) {
      throw new Error(`phases.yml for ${track}: phase ${i + 1} needs a name and items`);
    }
    const items = phase.items.map((it) => {
      if (typeof it !== "string") throw new Error(`phases.yml for ${track}: items must be strings`);
      return it;
    });
    return { name: phase.name, items };
  });
}
