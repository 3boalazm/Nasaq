import { parse, stringify } from "yaml";
import {
  ITEM_PRIORITIES,
  ITEM_STATUSES,
  SIZES,
  TRACKS,
  type ChangeRecord,
  type Item,
  type Phase,
  type Project,
} from "./types";

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

  const name = requireNonEmptyString(raw, "name");
  const track = parseEnum(raw["track"], "track", TRACKS);
  const size = parseEnum(raw["size"], "size", SIZES);
  const sizeHistory = parseArray(raw["sizeHistory"], "sizeHistory", parseChangeRecord);
  const deadline = parseNullableString(raw["deadline"], "deadline");
  const approver = parseNullableString(raw["approver"], "approver");
  const outOfScope = parseArray(raw["outOfScope"], "outOfScope", (v, p) => {
    if (typeof v !== "string") throw new ProjectYamlError(`${p} must be a string`);
    return v;
  });
  const phases = parseArray(raw["phases"], "phases", parsePhase);

  return { name, track, size, sizeHistory, deadline, approver, outOfScope, phases };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
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
  const date = v["date"];
  if (typeof date !== "string") throw new ProjectYamlError(`${path}.date must be a string`);
  const fromSize =
    v["fromSize"] === undefined || v["fromSize"] === null
      ? null
      : parseEnum(v["fromSize"], `${path}.fromSize`, SIZES);
  const toSize = parseEnum(v["toSize"], `${path}.toSize`, SIZES);
  const reason = v["reason"];
  if (typeof reason !== "string") throw new ProjectYamlError(`${path}.reason must be a string`);
  return { date, fromSize, toSize, reason };
}

function parsePhase(v: unknown, path: string): Phase {
  if (!isRecord(v)) throw new ProjectYamlError(`${path} must be a mapping`);
  const id = v["id"];
  const name = v["name"];
  if (typeof id !== "string") throw new ProjectYamlError(`${path}.id must be a string`);
  if (typeof name !== "string") throw new ProjectYamlError(`${path}.name must be a string`);
  const items = parseArray(v["items"], `${path}.items`, parseItem);
  return { id, name, items };
}

function parseItem(v: unknown, path: string): Item {
  if (!isRecord(v)) throw new ProjectYamlError(`${path} must be a mapping`);
  const id = v["id"];
  const title = v["title"];
  if (typeof id !== "string") throw new ProjectYamlError(`${path}.id must be a string`);
  if (typeof title !== "string") throw new ProjectYamlError(`${path}.title must be a string`);
  const priority = parseEnum(v["priority"], `${path}.priority`, ITEM_PRIORITIES);
  const status = parseEnum(v["status"], `${path}.status`, ITEM_STATUSES);
  return { id, title, priority, status };
}
