import { CodedError } from "../../core/errors";
import { MAX_PROJECT_YAML_MB } from "../../core/thresholds";
import { en, type MessageKey } from "./en";
import { ar } from "./ar";

export type Lang = "en" | "ar";
export const LANG_PARAM = "lang";
/** The only value this module ever stores: the chosen language. */
export const STORAGE_KEY = "nasaq-lang";

type Params = Readonly<Record<string, string | number>>;
const DICTS: Record<Lang, Record<MessageKey, string>> = { en, ar };

let current: Lang = "en";
/** Functions that set text or state. Each one reads the current language when it runs. */
const bindings: Array<() => void> = [];

export function lang(): Lang {
  return current;
}

/** Looks up a message and fills its {placeholders}. Numbers are written with Western digits. */
export function t(key: MessageKey, params: Params = {}): string {
  const template = DICTS[current][key] ?? en[key];
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole));
}

/**
 * Wraps a Latin-direction value (a date, a file name) so it reads correctly inside Arabic text.
 * Only in Arabic: English text stays exactly as written.
 */
export function ltr(value: string): string {
  return current === "ar" ? `\u2066${value}\u2069` : value;
}

/** "1 day", "2 days" or the Arabic form for the count, chosen by Intl.PluralRules for the current language. */
export function pluralText(base: "day" | "phase", n: number): string {
  const category = new Intl.PluralRules(current).select(n);
  return t(`${base}.${category}` as MessageKey, { n });
}

/** Text for a core error code. Unknown codes get the generic message. Never shows the English core text. */
export function errorText(code: string, params: Params = {}): string {
  const key = `error.${code}` as MessageKey;
  const known = Object.prototype.hasOwnProperty.call(en, key);
  return t(known ? key : "error.unknown", { mb: MAX_PROJECT_YAML_MB, ...params });
}

/** Text for any thrown value: coded core errors are translated, anything else is generic. */
export function describeError(err: unknown): string {
  if (err instanceof CodedError) return errorText(err.code, err.params);
  return errorText("unknown");
}

/**
 * Runs `fn` now and again whenever the language changes. Use it for every piece of text or
 * attribute that comes from a message, so switching language updates the page without rebuilding it.
 */
export function bind(fn: () => void): void {
  bindings.push(fn);
  fn();
}

/** Like bind, but only registers `fn` (it does not run now). For state that is recomputed on switch. */
export function onLanguageChange(fn: () => void): void {
  bindings.push(fn);
}

/** Sets a node's text from a message key. Keeps the text current on language switch. */
export function translate<N extends Node>(node: N, key: MessageKey, params?: Params): N {
  bind(() => {
    (node as unknown as Node & { textContent: string }).textContent = t(key, params ?? {});
  });
  return node;
}

export function resetBindings(): void {
  bindings.length = 0;
}

/** Pure: picks the language from the query string, the stored choice, then the browser language. */
export function resolveLanguage(search: string, browserLang: string | undefined, stored: string | null): Lang {
  const fromQuery = new URLSearchParams(search).get(LANG_PARAM);
  if (fromQuery === "ar" || fromQuery === "en") return fromQuery;
  if (stored === "ar" || stored === "en") return stored;
  if (browserLang && browserLang.toLowerCase().startsWith("ar")) return "ar";
  return "en";
}

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(value: Lang): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage can be blocked (private mode, policy). The page still works without it.
  }
}

/** Sets <html lang> and <html dir>. Arabic is RTL; English stays LTR. */
export function applyDocumentLanguage(): void {
  const html = document.documentElement;
  html.lang = current;
  html.dir = current === "ar" ? "rtl" : "ltr";
}

/** Writes ?lang= into the address bar without reloading the page. */
function writeUrl(value: Lang): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(LANG_PARAM, value);
    window.history.replaceState(window.history.state, "", url.toString());
  } catch {
    // Not fatal: the language still changes.
  }
}

/** Switches the language. The DOM stays in place, so wizard and upload state are kept. */
export function setLanguage(next: Lang, options: { persist?: boolean; url?: boolean } = {}): void {
  current = next;
  applyDocumentLanguage();
  if (options.url !== false && typeof window !== "undefined") writeUrl(next);
  if (options.persist !== false) writeStored(next);
  for (const fn of bindings) fn();
}

/** Called once at page start. Reads the URL, storage and browser language. */
export function initLanguage(): void {
  const resolved = resolveLanguage(window.location.search, navigator.language, readStored());
  current = resolved;
  applyDocumentLanguage();
}
