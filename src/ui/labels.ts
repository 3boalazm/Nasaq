import type { Size, Track } from "../core/types";
import { t } from "./i18n";

/** Nasaq's own display names, read from the current language. Call them inside bind() to stay live. */
export function trackName(track: Track): string {
  return t(`track.${track}`);
}

export function sizeName(size: Size): string {
  return t(`sizeName.${size}`);
}
