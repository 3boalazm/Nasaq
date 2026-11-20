import { parse, stringify } from "yaml";
import { ITEM_PRIORITIES, ITEM_STATUSES, SIZES, TRACKS } from "./types";
import type { ChangeRecord, Item, Phase, Project, Size, Track } from "./types";

export class ProjectYamlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectYamlError";
  }
}

export function toYaml(project: Project): string {
  return stringify(project, { lineWidth: 0 });
}

export function fromYaml(text: string): Project {
  let raw: unknown;
  try {
    raw = parse(text);
  } catch (err) {
    throw new ProjectYamlError(`project.yml is not valid YAML: ${(err as Error).message}`);
  }
  if (!isRecord(raw)) {
    throw new ProjectYamlError("project.yml must contain a mapping at the top level");
  }
  rejectUnknownKeys(raw, TOP_KEYS, "top level");

  const name = requireNonEmptyString(raw, "name");
  const track = parseEnum<Track>(raw["track"], "track", TRACKS);
  const size = parseEnum<Size>(raw["size"], "size", SIZES);
  const startDate = parseRequiredDate(raw["startDate"], "startDate");
  const sizeHistory = parseArray(raw["sizeHistory"], "sizeHistory", parseChangeRecord);
  const deadline = parseDate(raw["deadline"], "deadline");
  const approver = parseNullableString(raw["approver"], "approver");
  const outOfScope = parseStringList(raw["outOfScope"], "outOfScope");
  const phases = parseArray(raw["phases"], "phases", parsePhase);

  return { name, track, size, startDate, sizeHistory, deadline, approver, outOfScope, phases };
}

const TOP_KEYS = [
  "name",
  "track",
  "size",
  "startDate",
  "sizeHistory",
  "deadline",
  "approver",
  "outOfScope",
  "phases",
] as const;
const CHANGE_KEYS = ["date", "fromSize", "toSize", "reason", "approvedBy", "itemsCut", "itemsAdded"] as const;
const PHASE_KEYS = ["id", "name", "items"] as const;
const ITEM_KEYS = ["id", "title", "priority", "status"] as const;

/** Unknown fields are an error, so a typo is never silently dropped. */
function rejectUnknownKeys(obj: Record<string, unknown>, allowed: readonly string[], where: string): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      throw new ProjectYamlError(
        `unknown field ${JSON.stringify(key)} in project.yml (${where}). Remove it or fix the spelling.`,
      );
    }
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** True only for YYYY-MM-DD that names a real calendar day. */
export function isRealIsoDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(0);
  dt.setUTCFullYear(y, mo - 1, d);
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

function parseRequiredDate(value: unknown, path: string): string {
  if (value === undefined || value === null) {
    throw new ProjectYamlError(`${path} is required (YYYY-MM-DD)`);
  }
  return checkIsoDate(value, path);
}

function parseDate(value: unknown, path: string): string | null {
  if (value === undefined || value === null) return null;
  return checkIsoDate(value, path);
}

function checkIsoDate(value: unknown, path: string): string {
  if (typeof value !== "string" || !isRealIsoDate(value)) {
    throw new ProjectYamlError(
      `${path} must be a real date in YYYY-MM-DD format (got ${JSON.stringify(value)})`,
    );
  }
  return value;
}

function requireNonEmptyString(obj: Record<string, unknown>, field: string): string {
  const v = obj[field];
  if (v === undefined || v === null) {
    throw new ProjectYamlError(`${field} is required`);
  }
  if (typeof v !== "string" || v.trim() === "") {
    throw new ProjectYamlError(`${field} must be a non-empty string`);
  }
  return v;
}

function parseEnum<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  if (value === undefined || value === null) {
    throw new ProjectYamlError(`${field} is required (one of: ${allowed.join(", ")})`);
  }
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new ProjectYamlError(
      `unknown ${field} ${JSON.stringify(value)} (expected one of: ${allowed.join(", ")})`,
    );
  }
  return value as T;
}

function parseNullableString(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new ProjectYamlError(`${field} must be a string or null`);
  return value;
}

function parseStringList(value: unknown, field: string): string[] {
  return parseArray(value, field, (v, path) => {
    if (typeof v !== "string") throw new ProjectYamlError(`${path} must be a string`);
    return v;
  });
}

/** Missing or null lists parse as empty. */
function parseArray<T>(
  value: unknown,
  field: string,
  parseItem: (v: unknown, path: string) => T,
): T[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new ProjectYamlError(`${field} must be a list`);
  return value.map((v, i) => parseItem(v, `${field}[${i}]`));
}

function parseChangeRecord(v: unknown, path: string): ChangeRecord {
  if (!isRecord(v)) throw new ProjectYamlError(`${path} must be a mapping`);
  rejectUnknownKeys(v, CHANGE_KEYS, path);
  const date = parseRequiredDate(v["date"], `${path}.date`);
  const fromSize =
    v["fromSize"] === undefined || v["fromSize"] === null
      ? null
      : parseEnum<Size>(v["fromSize"], `${path}.fromSize`, SIZES);
  const toSize = parseEnum<Size>(v["toSize"], `${path}.toSize`, SIZES);
  const reason = v["reason"];
  if (typeof reason !== "string") throw new ProjectYamlError(`${path}.reason must be a string`);
  const approvedBy = parseNullableString(v["approvedBy"], `${path}.approvedBy`);
  const itemsCut = parseStringList(v["itemsCut"], `${path}.itemsCut`);
  const itemsAdded = parseStringList(v["itemsAdded"], `${path}.itemsAdded`);
  return { date, fromSize, toSize, reason, approvedBy, itemsCut, itemsAdded };
}

function parsePhase(v: unknown, path: string): Phase {
  if (!isRecord(v)) throw new ProjectYamlError(`${path} must be a mapping`);
  rejectUnknownKeys(v, PHASE_KEYS, path);
  const id = v["id"];
  const name = v["name"];
  if (typeof id !== "string") throw new ProjectYamlError(`${path}.id must be a string`);
  if (typeof name !== "string") throw new ProjectYamlError(`${path}.name must be a string`);
  const items = parseArray(v["items"], `${path}.items`, parseItem);
  return { id, name, items };
}

function parseItem(v: unknown, path: string): Item {
  if (!isRecord(v)) throw new ProjectYamlError(`${path} must be a mapping`);
  rejectUnknownKeys(v, ITEM_KEYS, path);
  const id = v["id"];
  const title = v["title"];
  if (typeof id !== "string") throw new ProjectYamlError(`${path}.id must be a string`);
  if (typeof title !== "string") throw new ProjectYamlError(`${path}.title must be a string`);
  const priority = parseEnum(v["priority"], `${path}.priority`, ITEM_PRIORITIES);
  const status = parseEnum(v["status"], `${path}.status`, ITEM_STATUSES);
  return { id, title, priority, status };
}
