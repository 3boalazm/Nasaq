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
  // Brand L is six modules (01 to 06) under a governing layer (00_ files and Handoff.md).
  brand: [
    "00_Governance.md",
    "00_AI_Orchestration.md",
    "00_Risk_Register.md",
    "Handoff.md",
    "01_Project_Intelligence.md",
    "02_Brand_Strategy.md",
    "03_Creative_Development.md",
    "04_Design_System.md",
    "05_Quality_Validation.md",
    "06_Delivery_Lifecycle.md",
  ],
  uiux: ["UX_Roadmap.md", "UX_Risks.md", "UX_Tests.md", "Handoff.md"],
};

interface RoleFiles {
  roadmap: string;
  risk: string;
  test: string;
  handoff: string;
}

const ROLE_FILES: Record<Track, RoleFiles> = {
  dev: { roadmap: "Implementation.md", risk: "Security_issues.md", test: "Test_scenarios.md", handoff: "Handoff.md" },
  brand: { roadmap: "00_Governance.md", risk: "00_Risk_Register.md", test: "05_Quality_Validation.md", handoff: "Handoff.md" },
  uiux: { roadmap: "UX_Roadmap.md", risk: "UX_Risks.md", test: "UX_Tests.md", handoff: "Handoff.md" },
};

/** Names of the size L files by role, for a track. */
export function roleFiles(track: Track): RoleFiles {
  return ROLE_FILES[track];
}

/** Brand L files that are read in every session; the numbered modules are opened one phase at a time. */
export const BRAND_L_GOVERNING: readonly string[] = ["00_Governance.md", "00_AI_Orchestration.md", "00_Risk_Register.md", "Handoff.md"];

/**
 * Returns the files to generate for a track and size, in a stable order:
 * entry file, project.yml, then the size-specific files.
 */
export function filePlan(track: Track, size: Size): string[] {
  const sizeFiles = size === "L" ? L_FILES[track] : SIZE_FILES[size];
  return [ENTRY_FILE[track], PROJECT_YAML, ...sizeFiles];
}
