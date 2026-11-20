import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export interface UrlHit {
  file: string;
  url: string;
  /** True when the URL sits inside a /* ... *\/ block comment (license text is kept there). */
  inComment: boolean;
}

const URL_RE = /https?:\/\/[^\s"'`<>)\\]+/gi;
const BLOCK_COMMENT_RE = /\/\*[\s\S]*?\*\//g;

/** Every http:// or https:// occurrence in one file's text, marked as comment or code. */
export function findUrls(file: string, text: string): UrlHit[] {
  const comments: Array<[number, number]> = [];
  for (const m of text.matchAll(BLOCK_COMMENT_RE)) {
    comments.push([m.index, m.index + m[0].length]);
  }
  const hits: UrlHit[] = [];
  for (const m of text.matchAll(URL_RE)) {
    const at = m.index;
    const inComment = comments.some(([start, end]) => at >= start && at < end);
    hits.push({ file, url: m[0], inComment });
  }
  return hits;
}

/** All files under dir, relative to dir, sorted. */
export function listFiles(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const name of readdirSync(join(dir, prefix)).sort()) {
    const rel = prefix ? `${prefix}/${name}` : name;
    if (statSync(join(dir, rel)).isDirectory()) out.push(...listFiles(dir, rel));
    else out.push(rel);
  }
  return out;
}

/** Scans every file under dir. Returns the hits; the caller decides what is allowed. */
export function scanDir(dir: string): UrlHit[] {
  const hits: UrlHit[] = [];
  for (const rel of listFiles(dir)) {
    hits.push(...findUrls(rel, readFileSync(join(dir, rel), "utf8")));
  }
  return hits;
}
