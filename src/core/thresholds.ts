/**
 * The only place where size limits live.
 * Numeric bands are inclusive. S and M have both bounds; L is open-ended.
 */
import type { Size } from "./types";

export interface NumericBands {
  readonly S: { readonly min: number; readonly max: number };
  readonly M: { readonly min: number; readonly max: number };
  readonly L: { readonly min: number };
}

/** duration: days from start to deadline */
export const DURATION_DAYS_BANDS = {
  S: { min: 1, max: 7 },
  M: { min: 8, max: 28 },
  L: { min: 29 },
} as const satisfies NumericBands;

/** deliverables: count */
export const DELIVERABLES_BANDS = {
  S: { min: 1, max: 5 },
  M: { min: 6, max: 15 },
  L: { min: 16 },
} as const satisfies NumericBands;

/** approvers: count of people who approve */
export const APPROVERS_BANDS = {
  S: { min: 1, max: 1 },
  M: { min: 2, max: 2 },
  L: { min: 3 },
} as const satisfies NumericBands;

export const RISK_LEVELS = ["easy_undo", "some_rework", "hard_undo"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];
export const RISK_SIZES: Record<RiskLevel, Size> = {
  easy_undo: "S",
  some_rework: "M",
  hard_undo: "L",
};

export const UNKNOWNS_LEVELS = ["none", "few", "research_needed"] as const;
export type UnknownsLevel = (typeof UNKNOWNS_LEVELS)[number];
export const UNKNOWNS_SIZES: Record<UnknownsLevel, Size> = {
  none: "S",
  few: "M",
  research_needed: "L",
};

/** Largest project.yml the page will read. Bigger files are refused before parsing. */
export const MAX_PROJECT_YAML_BYTES = 1024 * 1024;
/** The same limit in megabytes, for messages. */
export const MAX_PROJECT_YAML_MB = MAX_PROJECT_YAML_BYTES / (1024 * 1024);
