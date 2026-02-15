import path from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { describe, expect, it } from "vitest";

function buildStringEnv(overrides: Record<string, string>): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      env[key] = value;
    }
  }

  return {
    ...env,
    ...overrides,
  };
}

function resolveTsxCommand(): string {
  return path.resolve(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "tsx.cmd" : "tsx",
  );
}

describe("MCP stdio server", () => {
  it("lists tools and executes analyze_artifact", async () => {
    const transport = new StdioClientTransport({
      command: resolveTsxCommand(),
      args: [path.resolve(process.cwd(), "src/mcp/stdio.ts")],
      cwd: process.cwd(),
      env: buildStringEnv({
        LLM_PROVIDER: "mock",
        ANALYSIS_V2_ENABLED: "true",
      }),
      stderr: "pipe",
    });
    const client = new Client({ name: "agentlint-test-client", version: "1.0.0" });

    try {
      await client.connect(transport);

      const tools = await client.listTools();
      const names = tools.tools.map((tool) => tool.name);
      expect(names).toEqual(
        expect.arrayContaining([
          "analyze_artifact",
          "analyze_context_bundle",
          "quality_gate_artifact",
          "suggest_patch",
          "validate_export",
          "analyze_workspace_artifacts",
        ]),
      );

      const result = await client.callTool({
        name: "analyze_artifact",
        arguments: {
          type: "agents",
          content: "# AGENTS.md\n\nNever run force push without manual confirmation.",
        },
      });

      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toBeTruthy();

      const structured = result.structuredContent as Record<string, unknown>;
      expect(typeof structured.score).toBe("number");
      expect(structured.provider).toBe("deterministic");
      expect(structured.requestedProvider).toBe("deterministic");
      expect(structured.analysisMode).toBe("deterministic");

      const qualityGateResult = await client.callTool({
        name: "quality_gate_artifact",
        arguments: {
          type: "agents",
          content: "# AGENTS.md\n\nNever run force push without manual confirmation.",
          targetScore: 100,
          candidateContent:
            "# AGENTS.md\n\nNever run force push without manual confirmation.\n\n## Verification\n- Run lint and tests before merge.\n<script>alert('xss')</script>",
        },
      });
      expect(qualityGateResult.isError).not.toBe(true);
      const qualityStructured = qualityGateResult.structuredContent as Record<string, unknown>;
      expect(qualityStructured.analysis).toEqual(
        expect.objectContaining({
          provider: "deterministic",
          requestedProvider: "deterministic",
        }),
      );
      expect(typeof qualityStructured.initialScore).toBe("number");
      expect(qualityStructured.patch).not.toBeNull();
      expect(typeof qualityStructured.finalContent).toBe("string");
      expect(String(qualityStructured.finalContent)).not.toContain("<script>");
      expect(
        (qualityStructured.warnings as string[]).some((warning) => warning.includes("Script tags")),
      ).toBe(true);

      const workspaceScan = await client.callTool({
        name: "analyze_workspace_artifacts",
        arguments: {
          rootPath: process.cwd(),
          maxFiles: 5,
          includePatterns: ["AGENTS\\.md$"],
        },
      });
      expect(workspaceScan.isError).not.toBe(true);
      const workspaceStructured = workspaceScan.structuredContent as Record<string, unknown>;
      expect(typeof workspaceStructured.analyzedCount).toBe("number");

      const prompts = await client.listPrompts();
      expect(prompts.prompts.some((prompt) => prompt.name === "artifact_create_prompt")).toBe(true);

      const resources = await client.listResources();
      expect(resources.resources.some((resource) => resource.uri === "agentlint://prompt-pack/agents")).toBe(
        true,
      );
      expect(
        resources.resources.some((resource) => resource.uri === "agentlint://artifact-path-hints/agents"),
      ).toBe(true);
      expect(resources.resources.some((resource) => resource.uri === "agentlint://artifact-spec/agents")).toBe(
        true,
      );

      const promptPack = await client.readResource({
        uri: "agentlint://prompt-pack/agents",
      });
      const firstContent = promptPack.contents[0];
      if (!firstContent || !("text" in firstContent)) {
        throw new Error("Expected text resource content for prompt pack");
      }
      expect(firstContent.text.toLowerCase()).toContain("agents.md");

      const artifactSpec = await client.readResource({
        uri: "agentlint://artifact-spec/agents",
      });
      const specContent = artifactSpec.contents[0];
      if (!specContent || !("text" in specContent)) {
        throw new Error("Expected text resource content for artifact spec");
      }
      expect(specContent.text).toContain("Mandatory sections");
    } finally {
      await client.close();
      await transport.close();
    }
  });
});
