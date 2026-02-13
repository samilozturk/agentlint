import { describe, expect, it } from "vitest";

import { buildJudgeAnalysis } from "@/server/services/artifact-analyzer";

const baseDimensions = {
  clarity: 80,
  safety: 80,
  tokenEfficiency: 80,
  completeness: 80,
};

describe("buildJudgeAnalysis", () => {
  it("returns checklist, missing items, metric explanations and prompt pack", () => {
    const result = buildJudgeAnalysis({
      type: "agents",
      content: "# AGENTS.md\n\n## Quick Commands\n- npm run test",
      dimensions: baseDimensions,
    });

    expect(result.checklist.length).toBeGreaterThan(0);
    expect(Array.isArray(result.missingItems)).toBe(true);
    expect(result.metricExplanations).toHaveLength(12);
    expect(result.bestPracticeHints.length).toBeGreaterThan(0);
    expect(result.promptPack.title).toContain("AGENTS");
  });

  it("flags missing skill frontmatter as blocking", () => {
    const result = buildJudgeAnalysis({
      type: "skills",
      content: "# Skill\n\n1. Do work\n2. Verify",
      dimensions: baseDimensions,
    });

    expect(
      result.missingItems.some(
        (item) => item.id === "skills-frontmatter-name" && item.severity === "blocking",
      ),
    ).toBe(true);
  });

  it("flags dangerous workflow commands", () => {
    const result = buildJudgeAnalysis({
      type: "workflows",
      content: "# Deploy\n\n1. force push to main",
      dimensions: baseDimensions,
    });

    expect(
      result.checklist.some(
        (item) => item.id === "dangerous-operations" && item.status === "fail",
      ),
    ).toBe(true);
  });
});
