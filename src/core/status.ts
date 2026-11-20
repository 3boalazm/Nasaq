import { DELIVERABLES_BANDS, DURATION_DAYS_BANDS } from "./thresholds";
import { durationDays } from "./intake";
import type { ChangeRecord, Item, Project, Size } from "./types";

export interface OpenItem {
  id: string;
  title: string;
  phase: string;
  priority: Item["priority"];
}

/** A size history record with cut item ids shown as "title (id)". */
export interface HistoryRow extends ChangeRecord {
  itemsCutLabels: string[];
}

export interface ProjectStatus {
  name: string;
  track: Project["track"];
  size: Size;
  startDate: string;
  deadline: string | null;
  sizeHistory: ChangeRecord[];
  /** The size history with cut items labelled "title (id)". */
  historyRows: HistoryRow[];
  /** Name of the first phase with an open item, or null when none is open. */
  currentPhase: string | null;
  /** Items not cut: the deliverables count (spec and S3 note). */
  deliverables: number;
  openMust: OpenItem[];
  openNice: OpenItem[];
  /** Inclusive days from `today` to the deadline. 0 when overdue or no deadline. */
  daysLeft: number;
  overdue: boolean;
  hasDeadline: boolean;
}

export interface ScopeAlert {
  alert: boolean;
  /** Human-readable reasons, one per exceeded limit. */
  reasons: string[];
  /** The next size up. Set only when alert is true. Never applied automatically. */
  suggestedSize: Size | null;
  deliverables: number;
  /** Inclusive duration in days, or null when there is no deadline. */
  duration: number | null;
}

const NEXT_SIZE: Record<Size, Size> = { S: "M", M: "L", L: "L" };

function isOpen(item: Item): boolean {
  return item.status === "todo" || item.status === "doing";
}

/** "title (id)" for an item of the project, or the bare id when the project has no such item. */
export function describeItem(project: Project, id: string): string {
  for (const ph of project.phases) {
    for (const it of ph.items) {
      if (it.id === id) return `${it.title} (${id})`;
    }
  }
  return id;
}

/** Labels for a list of item ids, in the same order. */
export function describeItems(project: Project, ids: string[]): string[] {
  return ids.map((id) => describeItem(project, id));
}

export function deliverableCount(project: Project): number {
  return project.phases.reduce((n, ph) => n + ph.items.filter((it) => it.status !== "cut").length, 0);
}

/** Status of a project as of `today` (YYYY-MM-DD). */
export function status(project: Project, today: string): ProjectStatus {
  const openMust: OpenItem[] = [];
  const openNice: OpenItem[] = [];
  let currentPhase: string | null = null;
  for (const ph of project.phases) {
    for (const it of ph.items) {
      if (!isOpen(it)) continue;
      if (currentPhase === null) currentPhase = ph.name;
      const row = { id: it.id, title: it.title, phase: ph.name, priority: it.priority };
      if (it.priority === "must") openMust.push(row);
      else openNice.push(row);
    }
  }

  const hasDeadline = project.deadline !== null;
  const overdue = hasDeadline && project.deadline! < today;
  const daysLeft = hasDeadline && !overdue ? durationDays(today, project.deadline!) : 0;

  return {
    name: project.name,
    track: project.track,
    size: project.size,
    startDate: project.startDate,
    deadline: project.deadline,
    sizeHistory: project.sizeHistory,
    historyRows: project.sizeHistory.map((c) => ({ ...c, itemsCutLabels: describeItems(project, c.itemsCut) })),
    currentPhase,
    deliverables: deliverableCount(project),
    openMust,
    openNice,
    daysLeft,
    overdue,
    hasDeadline,
  };
}

/**
 * Warns when an S or M project has outgrown its size. Limits come from thresholds.ts.
 * Duration uses the same inclusive count as durationDays. L has no limit to exceed.
 */
export function scopeAlert(project: Project): ScopeAlert {
  const deliverables = deliverableCount(project);
  const duration = project.deadline !== null ? durationDays(project.startDate, project.deadline) : null;
  const reasons: string[] = [];

  if (project.size !== "L") {
    const maxDeliverables = DELIVERABLES_BANDS[project.size].max;
    const maxDays = DURATION_DAYS_BANDS[project.size].max;
    if (deliverables > maxDeliverables) {
      reasons.push(`${deliverables} deliverables; the ${project.size} limit is ${maxDeliverables}`);
    }
    if (duration !== null && duration > maxDays) {
      reasons.push(`${duration} days from start to deadline; the ${project.size} limit is ${maxDays}`);
    }
  }

  const alert = reasons.length > 0;
  return {
    alert,
    reasons,
    suggestedSize: alert ? NEXT_SIZE[project.size] : null,
    deliverables,
    duration,
  };
}
