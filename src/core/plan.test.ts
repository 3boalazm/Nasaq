import { describe, expect, it } from "vitest";
import { filePlan } from "./plan";
import type { Size, Track } from "./types";

describe("filePlan", () => {
  const expected: Record<Track, Record<Size, string[]>> = {
    dev: {
      S: ["AGENTS.md", "project.yml", "PROJECT.md"],
      M: ["AGENTS.md", "project.yml", "PROJECT.md", "PLAN.md"],
      L: [
        "AGENTS.md",
        "project.yml",
        "Implementation.md",
        "Security_issues.md",
        "Test_scenarios.md",
        "Handoff.md",
      ],
    },
    brand: {
      S: ["README.md", "project.yml", "PROJECT.md"],
      M: ["README.md", "project.yml", "PROJECT.md", "PLAN.md"],
      L: [
        "README.md",
        "project.yml",
        "00_Governance.md", "00_AI_Orchestration.md", "00_Risk_Register.md", "Handoff.md",
        "01_Project_Intelligence.md", "02_Brand_Strategy.md", "03_Creative_Development.md",
        "04_Design_System.md", "05_Quality_Validation.md", "06_Delivery_Lifecycle.md",
      ],
    },
    uiux: {
      S: ["README.md", "project.yml", "PROJECT.md"],
      M: ["README.md", "project.yml", "PROJECT.md", "PLAN.md"],
      L: ["README.md", "project.yml", "UX_Roadmap.md", "UX_Risks.md", "UX_Tests.md", "Handoff.md"],
    },
  };

  const tracks: Track[] = ["brand", "uiux", "dev"];
  const sizes: Size[] = ["S", "M", "L"];

  for (const track of tracks) {
    for (const size of sizes) {
      it(`${track} / ${size} returns the expected files`, () => {
        expect(filePlan(track, size)).toEqual(expected[track][size]);
      });
    }
  }

  it("covers all 9 track and size combinations", () => {
    let count = 0;
    for (const track of tracks) for (const size of sizes) {
      expect(filePlan(track, size).length).toBeGreaterThan(0);
      count++;
    }
    expect(count).toBe(9);
  });

  it("always includes project.yml and the track's entry file", () => {
    for (const track of tracks) for (const size of sizes) {
      const plan = filePlan(track, size);
      expect(plan).toContain("project.yml");
      expect(plan).toContain(track === "dev" ? "AGENTS.md" : "README.md");
    }
  });
});
