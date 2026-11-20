// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { errorText, lang, ltr, pluralText, resolveLanguage, setLanguage, STORAGE_KEY, t } from "./index";
import { MAX_PROJECT_YAML_MB } from "../../core/thresholds";

afterEach(() => {
  setLanguage("en", { persist: false, url: false });
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
});

describe("which language the page starts in", () => {
  it("?lang= wins over everything", () => {
    expect(resolveLanguage("?lang=ar", "en-US", "en")).toBe("ar");
    expect(resolveLanguage("?lang=en", "ar-EG", "ar")).toBe("en");
  });

  it("a stored choice comes next, then the browser language, then English", () => {
    expect(resolveLanguage("", "en-US", "ar")).toBe("ar");
    expect(resolveLanguage("", "ar-SA", null)).toBe("ar");
    expect(resolveLanguage("", "fr-FR", null)).toBe("en");
    expect(resolveLanguage("", undefined, null)).toBe("en");
  });

  it("an unknown ?lang= value is ignored", () => {
    expect(resolveLanguage("?lang=fr", "ar", null)).toBe("ar");
    expect(resolveLanguage("?lang=fr", "de", null)).toBe("en");
  });
});

describe("switching language", () => {
  it("sets <html lang> and <html dir>", () => {
    setLanguage("ar", { persist: false, url: false });
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
    setLanguage("en", { persist: false, url: false });
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("writes ?lang= to the address without a reload, and stores only the language", () => {
    setLanguage("ar");
    expect(new URL(window.location.href).searchParams.get("lang")).toBe("ar");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("ar");
    expect(window.localStorage.length).toBe(1);
  });

  it("still works when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => setLanguage("ar")).not.toThrow();
    expect(lang()).toBe("ar");
  });
});

describe("numbers, days and plurals", () => {
  it("uses Western digits in Arabic", () => {
    setLanguage("ar", { persist: false, url: false });
    expect(pluralText("day", 3)).toBe("3 أيام");
    expect(pluralText("day", 12)).toBe("12 يومًا");
    expect(pluralText("day", 100)).toBe("100 يوم");
  });

  it("uses the Arabic plural forms for 0, 1, 2, 3-10, 11-99 and 100+", () => {
    setLanguage("ar", { persist: false, url: false });
    expect(pluralText("day", 0)).toBe("0 أيام");
    expect(pluralText("day", 1)).toBe("يوم واحد");
    expect(pluralText("day", 2)).toBe("يومان");
    expect(pluralText("phase", 2)).toBe("مرحلتان");
    expect(pluralText("phase", 6)).toBe("6 مراحل");
  });

  it("uses singular and plural in English", () => {
    expect(pluralText("day", 1)).toBe("1 day");
    expect(pluralText("day", 2)).toBe("2 days");
    expect(pluralText("phase", 5)).toBe("5 phases");
  });

  it("wraps a date in an isolate only in Arabic", () => {
    expect(ltr("2026-11-20")).toBe("2026-11-20");
    setLanguage("ar", { persist: false, url: false });
    expect(ltr("2026-11-20")).toBe("\u20662026-11-20\u2069");
  });
});

describe("messages", () => {
  it("translates a core error code, and falls back to a generic message for an unknown code", () => {
    setLanguage("ar", { persist: false, url: false });
    expect(errorText("empty")).toBe("الملف فارغ.");
    expect(errorText("no-such-code")).toBe(t("error.unknown"));
  });

  it("fills the size limit from thresholds.ts, not from a literal", () => {
    expect(errorText("too-large")).toContain(`${MAX_PROJECT_YAML_MB} MB`);
  });
});
