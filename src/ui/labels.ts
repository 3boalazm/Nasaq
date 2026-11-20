import type { Size, Track } from "../core/types";

/** Nasaq's own display names. Used by the wizard, the summary and the dashboard. */
export const TRACK_LABELS: Record<Track, string> = {
  brand: "Brand identity",
  uiux: "UI/UX",
  dev: "Development",
};

export const SIZE_NAMES: Record<Size, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
};
