import { describe, expect, it } from "vitest";
import { APPROVERS_BANDS, DELIVERABLES_BANDS, DURATION_DAYS_BANDS, MAX_PROJECT_YAML_BYTES } from "./thresholds";

// M4.4: the limits live only in thresholds.ts. These checks read that file and check that the bands
// meet with no gap and no overlap, so a template editor who changes a number cannot leave a hole.
describe("size bands in thresholds.ts", () => {
  it.each([
    ["duration", DURATION_DAYS_BANDS],
    ["deliverables", DELIVERABLES_BANDS],
  ])("%s: S, M and L meet with no gap", (_name, b) => {
    expect(b.S.min).toBe(1);
    expect(b.M.min).toBe(b.S.max + 1);
    expect(b.L.min).toBe(b.M.max + 1);
    expect(b.S.max).toBeGreaterThanOrEqual(b.S.min);
    expect(b.M.max).toBeGreaterThanOrEqual(b.M.min);
  });

  it("approvers: S, M and L meet with no gap", () => {
    expect(APPROVERS_BANDS.S.min).toBe(1);
    expect(APPROVERS_BANDS.M.min).toBe(APPROVERS_BANDS.S.max + 1);
    expect(APPROVERS_BANDS.L.min).toBe(APPROVERS_BANDS.M.max + 1);
  });

  it("the YAML size limit is a positive number of bytes", () => {
    expect(Number.isInteger(MAX_PROJECT_YAML_BYTES)).toBe(true);
    expect(MAX_PROJECT_YAML_BYTES).toBeGreaterThan(0);
  });
});
