import { describe, expect, it } from "vitest";

import { runMockJudge } from "@/server/services/mock-judge";

describe("runMockJudge", () => {
  it("returns valid score and dimensions for normal AGENTS.md input", () => {
    const result = runMockJudge({
      type: "agents",
      content: "# AGENTS.md\n\n## Context\n- Stack: Next.js\n\n## Rules\n- No destructive ops",
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.dimensions.clarity).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.clarity).toBeLessThanOrEqual(100);
    expect(result.dimensions.safety).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.safety).toBeLessThanOrEqual(100);
    expect(result.dimensions.tokenEfficiency).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.tokenEfficiency).toBeLessThanOrEqual(100);
    expect(result.dimensions.completeness).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.completeness).toBeLessThanOrEqual(100);
    expect(result.refinedContent).toContain("Refined Artifact");
    expect(result.rationale).toBeTruthy();
  });

  it("warns on dangerous patterns like rm -rf", () => {
    const result = runMockJudge({
      type: "workflows",
      content: "# Deploy\n\n1. rm -rf /tmp/build\n2. Deploy",
    });

    expect(result.warnings).toContainEqual(
      expect.stringContaining("dangerous command"),
    );
  });

  it("warns on force push pattern", () => {
    const result = runMockJudge({
      type: "rules",
      content: "# Rules\n\n- Always force push to main",
    });

    expect(result.warnings).toContainEqual(
      expect.stringContaining("dangerous command"),
    );
  });

  it("gives lower tokenEfficiency for very long input", () => {
    const shortResult = runMockJudge({
      type: "agents",
      content: "# Short\n\nBrief content.",
    });

    const longResult = runMockJudge({
      type: "agents",
      content: "# Long\n\n" + "x".repeat(33_000),
    });

    expect(longResult.dimensions.tokenEfficiency).toBeLessThan(
      shortResult.dimensions.tokenEfficiency,
    );
  });

  it("gives higher clarity when headers are present", () => {
    const withHeaders = runMockJudge({
      type: "agents",
      content: "# Title\n\n## Section\n\nContent here.",
    });

    const withoutHeaders = runMockJudge({
      type: "agents",
      content: "Just some plain text without any markdown headers at all.",
    });

    expect(withHeaders.dimensions.clarity).toBeGreaterThan(
      withoutHeaders.dimensions.clarity,
    );
  });

  it("gives lower completeness for very short body", () => {
    const shortBody = runMockJudge({
      type: "skills",
      content: "hi",
    });

    const normalBody = runMockJudge({
      type: "skills",
      content: "# Skill\n\nThis is a comprehensive skill definition with enough detail to evaluate properly.",
    });

    expect(shortBody.dimensions.completeness).toBeLessThan(
      normalBody.dimensions.completeness,
    );
  });

  it("includes parse error in warnings for invalid frontmatter", () => {
    const result = runMockJudge({
      type: "skills",
      content: "---\n: : invalid\n---\nBody text",
    });

    expect(result.warnings).toContainEqual(
      expect.stringContaining("parse"),
    );
  });

  it("includes artifact type in refined content", () => {
    for (const type of ["skills", "agents", "rules", "workflows", "plans"] as const) {
      const result = runMockJudge({ type, content: "# Test\n\nContent." });
      expect(result.refinedContent).toContain(type);
    }
  });
});
