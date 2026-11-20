import { describeItems } from "./status";
import { ENTRY_FILE, PROJECT_YAML, filePlan, roleFiles } from "./plan";
import { render } from "./render";
import { ENTRY_TEMPLATE, RESCOPE_NOTE_TEMPLATE, fileTemplate, rescopeSnippet } from "./templates";
import { isRealIsoDate, toYaml } from "./projectYaml";
import { SIZES, type ChangeRecord, type Item, type Project, type Size, type Track } from "./types";

const RANK: Record<Size, number> = { S: 0, M: 1, L: 2 };

export const RESCOPE_NOTE = "RESCOPE_NOTE.md";

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
 * approvedBy is required. Phases are kept; cut items get status "cut". Throws on invalid input.
 */
export function rescope(
  project: Project,
  newSize: Size,
  reason: string,
  approvedBy: string,
  date: string,
  options: RescopeOptions = {},
): Project {
  if (!(SIZES as readonly string[]).includes(newSize)) throw new Error(`unknown size ${newSize}`);
  if (newSize === project.size) throw new Error(`the project is already size ${project.size}`);
  const cleanReason = reason.trim();
  if (cleanReason === "") throw new Error("a reason is required for a size change");
  const cleanApprover = typeof approvedBy === "string" ? approvedBy.trim() : "";
  if (cleanApprover === "") throw new Error("the person who approved the change is required");
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
    approvedBy: cleanApprover,
    itemsCut: cutIds,
    itemsAdded: [],
  };

  return { ...project, size: newSize, phases, sizeHistory: [...project.sizeHistory, change] };
}

/**
 * Template files the user does not have yet: filePlan(track, to) minus filePlan(track, from),
 * without the entry file and project.yml (those are always included on their own).
 * S→M: PLAN.md. S→L, M→L: the four L files. L→M: PROJECT.md, PLAN.md. L→S: PROJECT.md. M→S: none.
 */
export function newFilesFor(track: Track, from: Size, to: Size): string[] {
  const have = new Set(filePlan(track, from));
  return filePlan(track, to).filter((f) => !have.has(f) && f !== PROJECT_YAML && f !== ENTRY_FILE[track]);
}

/** Which instruction snippet applies to a move. */
function instructionKey(from: Size, to: Size): "down-L-M" | "down-L-S" | "down-M-S" | "up" {
  if (directionOf(from, to) === "up") return "up";
  if (from === "L" && to === "M") return "down-L-M";
  if (from === "L" && to === "S") return "down-L-S";
  return "down-M-S";
}

function listOrNone(items: string[]): string {
  return items.length ? items.map((i) => `- ${i}`).join("\n") : "- None";
}

/** Names and roles of the files in the rescope ZIP. */
function fileRows(track: Track, from: Size, to: Size): string[] {
  const entry = ENTRY_FILE[track];
  return [
    `- \`${PROJECT_YAML}\`: replace your current file with this one. It holds the change record.`,
    `- \`${entry}\`: replace your current file with this one. It states the new size.`,
    `- \`${RESCOPE_NOTE}\`: new. Keep it with project.yml.`,
    ...newFilesFor(track, from, to).map((f) => `- \`${f}\`: new. Add it to the folder.`),
  ];
}

/** Renders RESCOPE_NOTE.md for a change from `from` to the project's current size. */
export function renderRescopeNote(project: Project, from: Size): string {
  const change = project.sizeHistory[project.sizeHistory.length - 1];
  if (!change || change.toSize !== project.size) throw new Error("the last change record does not match the project size");
  const roles = roleFiles(project.track);
  // Markdown table cells: a "|" in a title would split the cell, so escape it.
  const cutLabels = describeItems(project, change.itemsCut).map((l) => l.replace(/\|/g, "\\|"));
  const extra: Record<string, string> = {
    changeDate: change.date,
    fromSize: change.fromSize ?? "-",
    toSize: change.toSize,
    direction: directionOf(from, project.size) === "down" ? "Going down" : "Going up",
    reason: change.reason.replace(/\|/g, "\\|"),
    approvedBy: change.approvedBy ?? "not recorded",
    itemsCut: cutLabels.length ? cutLabels.join(", ") : "none",
    itemsAdded: change.itemsAdded.length ? change.itemsAdded.join(", ") : "none",
    fileList: fileRows(project.track, from, project.size).join("\n"),
    roadmapFile: roles.roadmap,
    riskFile: roles.risk,
    testFile: roles.test,
    cutNotice: cutLabels.length
      ? `Tell the client in writing when this change cuts something they expected. This change cuts: ${cutLabels.join(", ")}.`
      : "No items were cut in this change.",
    instructions: "",
  };
  extra["instructions"] = render(rescopeSnippet(instructionKey(from, project.size)), project, extra);
  return render(RESCOPE_NOTE_TEMPLATE, project, extra);
}

/**
 * Every file in the rescope ZIP, by name: project.yml, RESCOPE_NOTE.md, the regenerated entry
 * file, and the new files. Never a file the user already has (other than the two replaced ones).
 */
export function rescopeZipFiles(project: Project, from: Size): Record<string, string> {
  const files: Record<string, string> = {
    [PROJECT_YAML]: toYaml(project),
    [RESCOPE_NOTE]: renderRescopeNote(project, from),
    [ENTRY_FILE[project.track]]: render(ENTRY_TEMPLATE, project),
  };
  for (const name of newFilesFor(project.track, from, project.size)) {
    files[name] = render(fileTemplate(project.track, project.size, name), project);
  }
  return files;
}
