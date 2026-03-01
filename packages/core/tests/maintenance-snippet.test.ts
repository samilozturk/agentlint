import { buildMaintenanceSnippet } from "@agent-lint/core";

describe("maintenance-snippet", () => {
  it("returns cursor snippet with .mdc path", () => {
    const result = buildMaintenanceSnippet("cursor");
    expect(result.targetPath).toBe(".cursor/rules/agentlint-maintenance.mdc");
    expect(result.snippet).toContain("alwaysApply: true");
    expect(result.snippet).toContain("agentlint_quick_check");
    expect(result.markdown).toContain("# Maintenance Snippet for Cursor");
  });

  it("returns windsurf snippet", () => {
    const result = buildMaintenanceSnippet("windsurf");
    expect(result.targetPath).toBe(".windsurf/rules/agentlint-maintenance.md");
    expect(result.snippet).toContain("agentlint_get_guidelines");
  });

  it("returns vscode snippet targeting copilot-instructions", () => {
    const result = buildMaintenanceSnippet("vscode");
    expect(result.targetPath).toBe(".github/copilot-instructions.md");
  });

  it("returns claude-code snippet targeting CLAUDE.md", () => {
    const result = buildMaintenanceSnippet("claude-code");
    expect(result.targetPath).toBe("CLAUDE.md");
  });

  it("returns generic snippet targeting AGENTS.md", () => {
    const result = buildMaintenanceSnippet("generic");
    expect(result.targetPath).toBe("AGENTS.md");
  });

  it("defaults to generic when no client specified", () => {
    const result = buildMaintenanceSnippet();
    expect(result.targetPath).toBe("AGENTS.md");
  });

  it("markdown includes how-to-apply instructions", () => {
    const result = buildMaintenanceSnippet("cursor");
    expect(result.markdown).toContain("## How to apply");
    expect(result.markdown).toContain("## What this does");
  });

  it("all snippets contain core rules", () => {
    const clients = ["cursor", "windsurf", "vscode", "claude-code", "generic"] as const;
    for (const client of clients) {
      const result = buildMaintenanceSnippet(client);
      expect(result.snippet).toContain("agentlint_quick_check");
      expect(result.snippet).toContain("agentlint_get_guidelines");
    }
  });
});
