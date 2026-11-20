import type { Size, Track } from "./types";

export const ENTRY_FILE: Record<Track, string> = {
  dev: "AGENTS.md",
  brand: "README.md",
  uiux: "README.md",
};

export const PROJECT_YAML = "project.yml";

const SIZE_FILES: Record<Size, readonly string[]> = {
  S: ["PROJECT.md"],
  M: ["PROJECT.md", "PLAN.md"],
  L: [],
};

const L_FILES: Record<Track, readonly string[]> = {
  dev: ["Implementation.md", "Security_issues.md", "Test_scenarios.md", "Handoff.md"],
  brand: ["Brand_Roadmap.md", "Brand_Risks.md", "Application_Tests.md", "Handoff.md"],
  uiux: ["UX_Roadmap.md", "UX_Risks.md", "UX_Tests.md", "Handoff.md"],
};

/**
 * Returns the files to generate for a track and size, in a stable order:
 * entry file, project.yml, then the size-specific files.
 */
export function filePlan(track: Track, size: Size): string[] {
  const sizeFiles = size === "L" ? L_FILES[track] : SIZE_FILES[size];
  return [ENTRY_FILE[track], PROJECT_YAML, ...sizeFiles];
}
