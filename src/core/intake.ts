import { suggestSize, type SizeSuggestion } from "./size";
import { sPhaseDefs } from "./templates";
import { isRealIsoDate, ProjectYamlError } from "./projectYaml";
import { TRACKS, type ChangeRecord, type Item, type Phase, type Project, type Size, type Track } from "./types";
import { RISK_LEVELS, UNKNOWNS_LEVELS, type RiskLevel, type UnknownsLevel } from "./thresholds";

/** Answers as collected by the form. */
export interface IntakeAnswers {
  name: string;
  track: string;
  startDate: string;
  deadline: string;
  approver: string;
  outOfScopeText: string;
  deliverables: number;
  approvers: number;
  risk: string;
  unknowns: string;
}

const MS_PER_DAY = 86_400_000;

function utcMillis(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

/** Local calendar date as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Days from start to deadline, inclusive of both days. Minimum 1. */
export function durationDays(startDate: string, deadline: string): number {
  const days = Math.round((utcMillis(deadline) - utcMillis(startDate)) / MS_PER_DAY) + 1;
  return Math.max(1, days);
}

/** Splits the out-of-scope textarea into one item per non-empty line. */
export function parseOutOfScope(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

const isPositiveInt = (n: number): boolean => Number.isInteger(n) && n >= 1;

/** Human-readable problems with the answers. Empty when the answers are usable. */
export function validateAnswers(a: IntakeAnswers): string[] {
  const errors: string[] = [];
  if (a.name.trim() === "") errors.push("Enter a project name.");
  if (!(TRACKS as readonly string[]).includes(a.track)) errors.push("Choose a track.");
  if (!isRealIsoDate(a.startDate)) errors.push("Enter a start date.");
  if (!isRealIsoDate(a.deadline)) errors.push("Enter a deadline.");
  if (!isPositiveInt(a.deliverables)) errors.push("Deliverables must be a whole number, 1 or more.");
  if (!isPositiveInt(a.approvers)) errors.push("Approvers must be a whole number, 1 or more.");
  if (!(RISK_LEVELS as readonly string[]).includes(a.risk)) errors.push("Choose a risk level.");
  if (!(UNKNOWNS_LEVELS as readonly string[]).includes(a.unknowns)) errors.push("Choose an unknowns level.");
  return errors;
}

export interface IntakeSuggestion extends SizeSuggestion {
  duration: number;
}

/** Suggested size from the five answers. Throws on invalid answers. */
export function suggestFromIntake(a: IntakeAnswers): IntakeSuggestion {
  const duration = durationDays(a.startDate, a.deadline);
  const s = suggestSize({
    duration,
    deliverables: a.deliverables,
    approvers: a.approvers,
    risk: a.risk as RiskLevel,
    unknowns: a.unknowns as UnknownsLevel,
  });
  return { ...s, duration };
}

/**
 * Builds the project for size S. Phases come from the S column of spec section 5.
 * Every item starts as must / todo. The initial size is recorded in sizeHistory.
 */
export function createProject(a: IntakeAnswers, size: Size, today: string = todayIso()): Project {
  const name = a.name.trim();
  if (name === "") throw new ProjectYamlError("name is required");
  if (!(TRACKS as readonly string[]).includes(a.track)) {
    throw new ProjectYamlError(`unknown track ${JSON.stringify(a.track)}`);
  }
  const track = a.track as Track;
  if (!isRealIsoDate(a.startDate)) throw new ProjectYamlError("startDate must be a real date (YYYY-MM-DD)");
  if (!isRealIsoDate(a.deadline)) throw new ProjectYamlError("deadline must be a real date (YYYY-MM-DD)");
  if (size !== "S") throw new Error(`templates for size ${size} arrive in S2`);

  const phases: Phase[] = sPhaseDefs(track).map((def, i) => {
    const phaseId = `p${i + 1}`;
    const items: Item[] = def.items.map((title, j) => ({
      id: `${phaseId}-${j + 1}`,
      title,
      priority: "must",
      status: "todo",
    }));
    return { id: phaseId, name: def.name, items };
  });

  const initial: ChangeRecord = {
    date: today,
    fromSize: null,
    toSize: size,
    reason: "Initial sizing",
    approvedBy: null,
    itemsCut: [],
    itemsAdded: phases.flatMap((p) => p.items.map((it) => it.id)),
  };

  const approver = a.approver.trim();
  return {
    name,
    track,
    size,
    startDate: a.startDate,
    sizeHistory: [initial],
    deadline: a.deadline,
    approver: approver === "" ? null : approver,
    outOfScope: parseOutOfScope(a.outOfScopeText),
    phases,
  };
}

