import { PROJECT_YAML, filePlan, roleFiles } from "./plan";
import { render } from "./render";
import { RESCOPE_NOTE_TEMPLATE, rescopeSnippet } from "./templates";
import { isRealIsoDate } from "./projectYaml";
import { SIZES, type ChangeRecord, type Item, type Project, type Size } from "./types";

const RANK: Record<Size, number> = { S: 0, M: 1, L: 2 };

export type Direction = "up" | "down";

export interface RescopeOptions {
  /** Ids of open items to cut. Allowed only when moving down. */
  cutItemIds?: string[];
  /** Required (non-empty) when any cut item is a must item. */
  mustCutReason?: string;
}

export function directionOf(from: Size, to: Size): Direction {
  return RANK[to] > RANK[from] ? "up" : "down";
}

/**
 * Changes the project's size and appends one change record to sizeHistory.
 * Phases are kept; cut items get status "cut". Throws on invalid input.
 */
export function rescope(
  project: Project,
  newSize: Size,
  reason: string,
  approvedBy: string | null,
  date: string,
  options: RescopeOptions = {},
): Project {
  if (!(SIZES as readonly string[]).includes(newSize)) throw new Error(`unknown size ${newSize}`);
  if (newSize === project.size) throw new Error(`the project is already size ${project.size}`);
  const cleanReason = reason.trim();
  if (cleanReason === "") throw new Error("a reason is required for a size change");
  if (!isRealIsoDate(date)) throw new Error("date must be a real date (YYYY-MM-DD)");

  const cutIds = [...new Set(options.cutItemIds ?? [])];
  if (cutIds.length > 0 && directionOf(project.size, newSize) !== "down") {
    throw new Error("items can be cut only when moving down");
  }

  const byId = new Map<string, Item>();
  for (const ph of project.phases) for (const it of ph.items) byId.set(it.id, it);
  for (const id of cutIds) {
    const item = byId.get(id);
    if (!item) throw new Error(`no item ${id} in project.yml`);
    if (item.status !== "todo" && item.status !== "doing") {
      throw new Error(`item ${id} is not open (status ${item.status})`);
    }
  }

  const mustCuts = cutIds.filter((id) => byId.get(id)!.priority === "must");
  const mustReason = (options.mustCutReason ?? "").trim();
  if (mustCuts.length > 0 && mustReason === "") {
    throw new Error(`cutting a must item needs a typed reason (${mustCuts.join(", ")})`);
  }

  const phases = project.phases.map((ph) => ({
    ...ph,
    items: ph.items.map((it) => (cutIds.includes(it.id) ? { ...it, status: "cut" as const } : it)),
  }));

  const recordReason =
    mustCuts.length > 0
      ? `${cleanReason}. Must items cut: ${mustCuts.join(", ")}. Reason: ${mustReason}`
      : cleanReason;

  const change: ChangeRecord = {
    date,
    fromSize: project.size,
    toSize: newSize,
    reason: recordReason,
    approvedBy: approvedBy?.trim() ? approvedBy.trim() : null,
    itemsCut: cutIds,
    itemsAdded: [],
  };

  return { ...project, size: newSize, phases, sizeHistory: [...project.sizeHistory, change] };
}

/**
 * Template files the user does not have yet. Going up: files of the new size that the old
 * size did not have, minus project.yml. Going down: none (the ZIP is project.yml and the note).
 */
export function newFilesFor(track: Project["track"], from: Size, to: Size): string[] {
  if (directionOf(from, to) === "down") return [];
  const have = new Set(filePlan(track, from));
  return filePlan(track, to).filter((f) => !have.has(f) && f !== PROJECT_YAML);
}

/** Instruction snippets for a move, in order (spec section 6). */
function stepSnippets(from: Size, to: Size): string[] {
  if (directionOf(from, to) === "up") return [rescopeSnippet("up")];
  const order: Size[] = ["L", "M", "S"];
  const out: string[] = [];
  for (let i = order.indexOf(from); i < order.indexOf(to); i++) {
    const a = order[i]!;
    const b = order[i + 1]!;
    if (a === "L" && b === "M") out.push(rescopeSnippet("down-L-M"));
    if (a === "M" && b === "S") out.push(rescopeSnippet("down-M-S"));
  }
  return out;
}

function listOrNone(items: string[]): string {
  return items.length ? items.map((i) => `- ${i}`).join("\n") : "- None";
}

/** Renders RESCOPE_NOTE.md for a change from `from` to the project's current size. */
export function renderRescopeNote(project: Project, from: Size): string {
  const change = project.sizeHistory[project.sizeHistory.length - 1];
  if (!change || change.toSize !== project.size) throw new Error("the last change record does not match the project size");
  const roles = roleFiles(project.track);
  const newFiles = newFilesFor(project.track, from, project.size);
  const extra: Record<string, string> = {
    changeDate: change.date,
    fromSize: change.fromSize ?? "-",
    toSize: change.toSize,
    direction: directionOf(from, project.size) === "down" ? "Going down" : "Going up",
    reason: change.reason.replace(/\|/g, "\\|"),
    approvedBy: change.approvedBy ?? "not recorded",
    itemsCut: change.itemsCut.length ? change.itemsCut.join(", ") : "none",
    itemsAdded: change.itemsAdded.length ? change.itemsAdded.join(", ") : "none",
    newFiles: listOrNone(newFiles),
    roadmapFile: roles.roadmap,
    riskFile: roles.risk,
    testFile: roles.test,
    cutNotice: change.itemsCut.length
      ? `Tell the client in writing when this change cuts something they expected. This change cuts: ${change.itemsCut.join(", ")}.`
      : "No items were cut in this change.",
    instructions: "",
  };
  extra["instructions"] = stepSnippets(from, project.size)
    .map((s) => render(s, project, extra))
    .join("\n\n");
  return render(RESCOPE_NOTE_TEMPLATE, project, extra);
}
