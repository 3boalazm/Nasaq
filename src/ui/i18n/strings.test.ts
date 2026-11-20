import { describe, expect, it } from "vitest";
import { listDir, readText } from "../../testutil/files";
import { ar } from "./ar";
import { en } from "./en";

// Every test reads the sources from disk, so it checks the real files and not a copy.
const UI_DIR = new URL("..", import.meta.url);

/** Latin words that stay Latin in Arabic (fixed by the brief): brand, track code, file names. */
const ALLOWED_LATIN = new Set(["Nasaq", "UI/UX", "English", "project.yml"]);

const ARABIC_LETTER = /[\u0600-\u06FF]/;
const ARABIC_INDIC_DIGIT = /[\u0660-\u0669\u06F0-\u06F9]/;

describe("i18n string files", () => {
  it("en and ar have exactly the same keys", () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });

  it("no value is empty in either language", () => {
    for (const [lang, dict] of [["en", en], ["ar", ar]] as const) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim(), `${lang} ${key}`).not.toBe("");
      }
    }
  });

  it("every Arabic value is translated: it has Arabic letters, or is on the Latin allow-list", () => {
    for (const [key, value] of Object.entries(ar)) {
      const ok = ARABIC_LETTER.test(value) || ALLOWED_LATIN.has(value);
      expect(ok, `ar ${key} = ${JSON.stringify(value)}`).toBe(true);
    }
  });

  it("Arabic values differ from English unless they are on the allow-list", () => {
    for (const [key, value] of Object.entries(ar)) {
      // A language's own name is written the same way in both languages: العربية is Arabic in English too.
      if (ALLOWED_LATIN.has(value) || key.startsWith("lang.")) continue;
      expect(value, `ar ${key}`).not.toBe(en[key as keyof typeof en]);
    }
  });

  it("Arabic text uses Western digits only", () => {
    for (const [key, value] of Object.entries(ar)) {
      expect(ARABIC_INDIC_DIGIT.test(value), `ar ${key}`).toBe(false);
    }
  });

  it("every key is used by some UI file, so no dead strings are left behind", () => {
    const source = listDir(UI_DIR)
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
      .map((f) => readText(new URL(f, UI_DIR)))
      .join("\n");
    const dynamicPrefixes = ["day", "phase", "sizeName", "track", "err", "dash.priority", "answer", "error"];
    const unused = Object.keys(en).filter((key) => {
      if (source.includes(`"${key}"`) || source.includes(`'${key}'`)) return false;
      // Keys built at run time: prefix.part, e.g. `track.${track}` or error codes.
      return !dynamicPrefixes.some((p) => key.startsWith(`${p}.`));
    });
    expect(unused).toEqual([]);
  });
});
