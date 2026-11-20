import { describe, expect, it } from "vitest";
import { suggestSize, type SizeAnswers } from "./size";
import {
  APPROVERS_BANDS,
  DELIVERABLES_BANDS,
  DURATION_DAYS_BANDS,
} from "./thresholds";

// Limits come only from thresholds.ts. Nothing here repeats the numbers.
const SMALLEST: SizeAnswers = {
  duration: DURATION_DAYS_BANDS.S.min,
  deliverables: DELIVERABLES_BANDS.S.min,
  approvers: APPROVERS_BANDS.S.min,
  risk: "easy_undo",
  unknowns: "none",
};

const ALL_L: SizeAnswers = {
  duration: DURATION_DAYS_BANDS.L.min,
  deliverables: DELIVERABLES_BANDS.L.min,
  approvers: APPROVERS_BANDS.L.min,
  risk: "hard_undo",
  unknowns: "research_needed",
};

describe("suggestSize", () => {
  it("returns S when every answer is at the smallest band", () => {
    expect(suggestSize(SMALLEST)).toEqual({
      size: "S",
      decidedBy: ["duration", "deliverables", "approvers", "risk", "unknowns"],
    });
  });

  it("returns L when every answer is at the largest band", () => {
    expect(suggestSize(ALL_L)).toEqual({
      size: "L",
      decidedBy: ["duration", "deliverables", "approvers", "risk", "unknowns"],
    });
  });

  describe("one column lifts the size to M", () => {
    it("duration", () => {
      const r = suggestSize({ ...SMALLEST, duration: DURATION_DAYS_BANDS.M.min });
      expect(r).toEqual({ size: "M", decidedBy: ["duration"] });
    });
    it("deliverables", () => {
      const r = suggestSize({ ...SMALLEST, deliverables: DELIVERABLES_BANDS.M.min });
      expect(r).toEqual({ size: "M", decidedBy: ["deliverables"] });
    });
    it("approvers", () => {
      const r = suggestSize({ ...SMALLEST, approvers: APPROVERS_BANDS.M.min });
      expect(r).toEqual({ size: "M", decidedBy: ["approvers"] });
    });
    it("risk", () => {
      const r = suggestSize({ ...SMALLEST, risk: "some_rework" });
      expect(r).toEqual({ size: "M", decidedBy: ["risk"] });
    });
    it("unknowns", () => {
      const r = suggestSize({ ...SMALLEST, unknowns: "few" });
      expect(r).toEqual({ size: "M", decidedBy: ["unknowns"] });
    });
  });

  describe("one column lifts the size to L", () => {
    it("duration", () => {
      const r = suggestSize({ ...SMALLEST, duration: DURATION_DAYS_BANDS.L.min });
      expect(r).toEqual({ size: "L", decidedBy: ["duration"] });
    });
    it("deliverables", () => {
      const r = suggestSize({ ...SMALLEST, deliverables: DELIVERABLES_BANDS.L.min });
      expect(r).toEqual({ size: "L", decidedBy: ["deliverables"] });
    });
    it("approvers", () => {
      const r = suggestSize({ ...SMALLEST, approvers: APPROVERS_BANDS.L.min });
      expect(r).toEqual({ size: "L", decidedBy: ["approvers"] });
    });
    it("risk", () => {
      const r = suggestSize({ ...SMALLEST, risk: "hard_undo" });
      expect(r).toEqual({ size: "L", decidedBy: ["risk"] });
    });
    it("unknowns", () => {
      const r = suggestSize({ ...SMALLEST, unknowns: "research_needed" });
      expect(r).toEqual({ size: "L", decidedBy: ["unknowns"] });
    });
  });

  it("lists every answer that reaches the top size", () => {
    const r = suggestSize({ ...SMALLEST, duration: DURATION_DAYS_BANDS.L.min, approvers: APPROVERS_BANDS.M.min });
    expect(r).toEqual({ size: "L", decidedBy: ["duration"] });
    const tie = suggestSize({ ...SMALLEST, risk: "hard_undo", unknowns: "research_needed" });
    expect(tie).toEqual({ size: "L", decidedBy: ["risk", "unknowns"] });
  });

  describe("boundaries", () => {
    it("duration: top of S stays S, next day is M", () => {
      expect(suggestSize({ ...SMALLEST, duration: DURATION_DAYS_BANDS.S.max }).size).toBe("S");
      expect(suggestSize({ ...SMALLEST, duration: DURATION_DAYS_BANDS.S.max + 1 }).size).toBe("M");
    });
    it("duration: top of M stays M, next day is L", () => {
      expect(suggestSize({ ...SMALLEST, duration: DURATION_DAYS_BANDS.M.max }).size).toBe("M");
      expect(suggestSize({ ...SMALLEST, duration: DURATION_DAYS_BANDS.M.max + 1 }).size).toBe("L");
    });
    it("deliverables: top of S stays S, next is M", () => {
      expect(suggestSize({ ...SMALLEST, deliverables: DELIVERABLES_BANDS.S.max }).size).toBe("S");
      expect(suggestSize({ ...SMALLEST, deliverables: DELIVERABLES_BANDS.S.max + 1 }).size).toBe("M");
    });
    it("deliverables: top of M stays M, next is L", () => {
      expect(suggestSize({ ...SMALLEST, deliverables: DELIVERABLES_BANDS.M.max }).size).toBe("M");
      expect(suggestSize({ ...SMALLEST, deliverables: DELIVERABLES_BANDS.M.max + 1 }).size).toBe("L");
    });
    it("approvers: one stays S, two is M, three is L", () => {
      expect(suggestSize({ ...SMALLEST, approvers: APPROVERS_BANDS.S.max }).size).toBe("S");
      expect(suggestSize({ ...SMALLEST, approvers: APPROVERS_BANDS.M.min }).size).toBe("M");
      expect(suggestSize({ ...SMALLEST, approvers: APPROVERS_BANDS.L.min }).size).toBe("L");
    });
  });

  describe("rejects invalid numbers", () => {
    it.each([
      ["duration", 0],
      ["duration", -1],
      ["deliverables", 0],
      ["deliverables", -3],
      ["approvers", 0],
      ["approvers", -2],
    ] as const)("%s = %s throws", (key, value) => {
      expect(() => suggestSize({ ...SMALLEST, [key]: value })).toThrowError(
        new RegExp(`^${key} must be a positive whole number`),
      );
    });

    it("rejects a non-whole number", () => {
      expect(() => suggestSize({ ...SMALLEST, duration: 7.5 })).toThrowError(/duration must be a positive whole number/);
    });
  });
});
