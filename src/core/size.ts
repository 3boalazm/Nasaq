import {
  APPROVERS_BANDS,
  DELIVERABLES_BANDS,
  DURATION_DAYS_BANDS,
  RISK_LEVELS,
  RISK_SIZES,
  UNKNOWNS_LEVELS,
  UNKNOWNS_SIZES,
  type NumericBands,
  type RiskLevel,
  type UnknownsLevel,
} from "./thresholds";
import type { Size } from "./types";

export const ANSWER_KEYS = ["duration", "deliverables", "approvers", "risk", "unknowns"] as const;
export type AnswerKey = (typeof ANSWER_KEYS)[number];

export interface SizeAnswers {
  /** Days from start to deadline. Positive integer. */
  duration: number;
  /** Number of deliverables. Positive integer. */
  deliverables: number;
  /** Number of people who approve. Positive integer. */
  approvers: number;
  risk: RiskLevel;
  unknowns: UnknownsLevel;
}

export interface SizeSuggestion {
  size: Size;
  /** Answer keys that map to `size`. */
  decidedBy: AnswerKey[];
}

const RANK: Record<Size, number> = { S: 0, M: 1, L: 2 };

function requirePositiveInteger(key: AnswerKey, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${key} must be a positive whole number (got ${value})`);
  }
}

function bandSize(value: number, bands: NumericBands): Size {
  if (value >= bands.L.min) return "L";
  if (value >= bands.M.min) return "M";
  return "S";
}

function enumSize<T extends string>(
  key: AnswerKey,
  value: T,
  allowed: readonly T[],
  sizes: Record<T, Size>,
): Size {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new RangeError(`${key} must be one of: ${allowed.join(", ")} (got ${JSON.stringify(value)})`);
  }
  return sizes[value];
}

/** Maps each answer to the size it implies, per the thresholds table. */
export function sizeForAnswers(answers: SizeAnswers): Record<AnswerKey, Size> {
  requirePositiveInteger("duration", answers.duration);
  requirePositiveInteger("deliverables", answers.deliverables);
  requirePositiveInteger("approvers", answers.approvers);
  return {
    duration: bandSize(answers.duration, DURATION_DAYS_BANDS),
    deliverables: bandSize(answers.deliverables, DELIVERABLES_BANDS),
    approvers: bandSize(answers.approvers, APPROVERS_BANDS),
    risk: enumSize("risk", answers.risk, RISK_LEVELS, RISK_SIZES),
    unknowns: enumSize("unknowns", answers.unknowns, UNKNOWNS_LEVELS, UNKNOWNS_SIZES),
  };
}

/**
 * The size is the highest size any single answer maps to.
 * `decidedBy` lists every answer that maps to that size.
 */
export function suggestSize(answers: SizeAnswers): SizeSuggestion {
  const perAnswer = sizeForAnswers(answers);
  let size: Size = "S";
  for (const key of ANSWER_KEYS) {
    if (RANK[perAnswer[key]] > RANK[size]) size = perAnswer[key];
  }
  const decidedBy = ANSWER_KEYS.filter((key) => perAnswer[key] === size);
  return { size, decidedBy: [...decidedBy] };
}
