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
          "suggest_patch",
          "validate_export",
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
      expect(typeof structured.provider).toBe("string");
    } finally {
      await client.close();
      await transport.close();
    }
  });
});
