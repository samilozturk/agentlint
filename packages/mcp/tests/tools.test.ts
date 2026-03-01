import { createAgentLintMcpServer } from "@agent-lint/mcp";
import {
  buildGuidelines,
  runQuickCheck,
  buildMaintenanceSnippet,
  buildWorkspaceAutofixPlan,
} from "@agent-lint/core";

describe("MCP tools - core function integration", () => {
  it("guidelines tool: builds markdown for each artifact type", () => {
    const types = ["agents", "skills", "rules", "workflows", "plans"] as const;

    for (const type of types) {
      const md = buildGuidelines(type);
      expect(md).toContain(`# Guidelines: ${type}`);
      expect(md).toContain("## Mandatory sections");
      expect(md).toContain("## Do");
      expect(md).toContain("## Don't");
    }
  });

  it("guidelines tool: includes client hints for cursor", () => {
    const md = buildGuidelines("agents", "cursor");
    expect(md).toContain(".cursor/rules/");
  });

  it("quick-check tool: returns signals for package.json change", () => {
    const result = runQuickCheck(["package.json"]);
    expect(result.markdown).toContain("# Quick Check Results");
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.signals[0].trigger).toContain("package.json");
  });

  it("quick-check tool: returns no signals for empty input", () => {
    const result = runQuickCheck();
    expect(result.markdown).toContain("No context artifact updates");
    expect(result.signals).toHaveLength(0);
  });

  it("maintenance-snippet tool: returns snippet for each client", () => {
    const clients = ["cursor", "windsurf", "vscode", "claude-code", "generic"] as const;

    for (const client of clients) {
      const result = buildMaintenanceSnippet(client);
      expect(result.markdown).toContain("# Maintenance Snippet");
      expect(result.snippet).toContain("agentlint_quick_check");
    }
  });

  it("plan-workspace-autofix tool: returns plan for current workspace", () => {
    const plan = buildWorkspaceAutofixPlan(process.cwd());
    expect(plan.markdown).toContain("# Workspace Autofix Plan");
    expect(plan.markdown).toContain("## Discovered artifacts");
  });
});

describe("MCP server creation", () => {
  it("creates server with default options", () => {
    const server = createAgentLintMcpServer();
    expect(server).toBeTruthy();
  });

  it("creates server with workspace scan enabled", () => {
    const server = createAgentLintMcpServer({ enableWorkspaceScan: true });
    expect(server).toBeTruthy();
  });

  it("creates server with workspace scan disabled", () => {
    const server = createAgentLintMcpServer({ enableWorkspaceScan: false });
    expect(server).toBeTruthy();
  });

  it("creates server with custom name and version", () => {
    const server = createAgentLintMcpServer({ name: "test", version: "1.0.0" });
    expect(server).toBeTruthy();
  });
});
