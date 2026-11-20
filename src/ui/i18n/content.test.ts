// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { setLanguage } from "./index";
import { CONTENT_KEYS, content, isolate } from "./content";
import { phaseDefs } from "../../core/templates";
import { SIZES, TRACKS } from "../../core/types";

afterEach(() => setLanguage("en"));

describe("Arabic display text for template content", () => {
  it("covers every phase name and item title in every template", () => {
    const missing: string[] = [];
    for (const track of TRACKS) {
      for (const size of SIZES) {
        for (const ph of phaseDefs(track, size)) {
          if (!CONTENT_KEYS.includes(ph.name)) missing.push(ph.name);
          for (const title of ph.items) if (!CONTENT_KEYS.includes(title)) missing.push(title);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("returns the text unchanged in English", () => {
    setLanguage("en");
    expect(content("2 routes, then refine one")).toBe("2 routes, then refine one");
    expect(isolate("2 routes")).toBe("2 routes");
  });

  it("returns Arabic for a template title and leaves a user-written title as it is", () => {
    setLanguage("ar");
    expect(content("Discovery")).toBe("الاستكشاف");
    expect(content("2 routes, then refine one")).not.toBe("2 routes, then refine one");
    expect(content("My own custom item")).toBe("My own custom item");
  });

  it("no Arabic value is empty or equal to its English key", () => {
    setLanguage("ar");
    for (const key of CONTENT_KEYS) {
      expect(content(key).trim(), key).not.toBe("");
      expect(content(key), key).not.toBe(key);
    }
  });

  it("wraps a value in a first-strong isolate in Arabic, so a leading number keeps its place", () => {
    setLanguage("ar");
    expect(isolate("2 routes")).toBe("⁨2 routes⁩");
  });
});
