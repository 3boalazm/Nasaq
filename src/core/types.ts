export const TRACKS = ["brand", "uiux", "dev"] as const;
export type Track = (typeof TRACKS)[number];

export const SIZES = ["S", "M", "L"] as const;
export type Size = (typeof SIZES)[number];

export const ITEM_PRIORITIES = ["must", "nice"] as const;
export type ItemPriority = (typeof ITEM_PRIORITIES)[number];

export const ITEM_STATUSES = ["todo", "doing", "done", "cut"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export interface Item {
  id: string;
  title: string;
  priority: ItemPriority;
  status: ItemStatus;
}

export interface Phase {
  id: string;
  name: string;
  items: Item[];
}

export interface ChangeRecord {
  /** ISO date (YYYY-MM-DD) the size was set or changed. */
  date: string;
  /** null for the initial sizing. */
  fromSize: Size | null;
  toSize: Size;
  reason: string;
  /** Person who approved the change, or null. */
  approvedBy: string | null;
  /** Item ids cut by this change. */
  itemsCut: string[];
  /** Item ids added by this change. */
  itemsAdded: string[];
}

export interface Project {
  name: string;
  track: Track;
  size: Size;
  /** ISO date (YYYY-MM-DD). Required. */
  startDate: string;
  sizeHistory: ChangeRecord[];
  /** ISO date (YYYY-MM-DD) or null when not set. */
  deadline: string | null;
  approver: string | null;
  outOfScope: string[];
  phases: Phase[];
}
