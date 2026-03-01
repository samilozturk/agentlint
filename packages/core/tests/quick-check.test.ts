import { runQuickCheck } from "@agent-lint/core";

describe("quick-check", () => {
  it("returns no signals for empty input", () => {
    const result = runQuickCheck();
    expect(result.signals).toHaveLength(0);
    expect(result.markdown).toContain("No context artifact updates");
  });

  it("detects package.json changes", () => {
    const result = runQuickCheck(["package.json"]);
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.signals[0].trigger).toContain("package.json");
    expect(result.signals[0].affectedArtifacts).toContain("agents");
  });

  it("detects CI config changes", () => {
    const result = runQuickCheck([".github/workflows/ci.yml"]);
    expect(result.signals.some((s) => s.trigger.includes("CI/CD"))).toBe(true);
  });

  it("detects env file changes", () => {
    const result = runQuickCheck([".env.local"]);
    expect(result.signals.some((s) => s.trigger.includes("Environment"))).toBe(true);
  });

  it("detects IDE config changes", () => {
    const result = runQuickCheck([".cursor/rules/new-rule.md"]);
    expect(result.signals.some((s) => s.trigger.includes("IDE"))).toBe(true);
  });

  it("detects description-based signals for new feature", () => {
    const result = runQuickCheck(undefined, "Added new feature for payments");
    expect(result.signals.some((s) => s.trigger.includes("New module"))).toBe(true);
  });

  it("detects description-based signals for security", () => {
    const result = runQuickCheck(undefined, "Updated authentication logic");
    expect(result.signals.some((s) => s.trigger.includes("Security"))).toBe(true);
  });

  it("deduplicates signals", () => {
    const result = runQuickCheck(
      ["package.json", "package.json"],
    );
    const packageTriggers = result.signals.filter((s) =>
      s.trigger.includes("package.json"),
    );
    expect(packageTriggers).toHaveLength(1);
  });

  it("markdown output includes next steps", () => {
    const result = runQuickCheck(["package.json"]);
    expect(result.markdown).toContain("## Next steps");
  });
});
