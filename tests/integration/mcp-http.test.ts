import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { startMcpHttpServer, type RunningMcpHttpServer } from "@/mcp/http/server";

describe("MCP streamable HTTP server", () => {
  let running: RunningMcpHttpServer | null = null;

  beforeEach(() => {
    vi.stubEnv("LLM_PROVIDER", "mock");
    vi.stubEnv("MCP_BEARER_TOKENS", "test-client=test-token:*");
    vi.stubEnv("MCP_REQUIRE_AUTH", "true");
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    if (running) {
      await running.close();
      running = null;
    }
  });

  it("accepts authenticated clients and serves MCP tools", async () => {
    running = await startMcpHttpServer({
      host: "127.0.0.1",
      port: 0,
    });

    const ready = await fetch(`${running.baseUrl}/readyz`);
    expect(ready.status).toBe(200);
    const readyPayload = (await ready.json()) as Record<string, unknown>;
    expect(readyPayload.capabilities).toEqual(
      expect.objectContaining({
        tools: true,
        prompts: true,
        resources: true,
      }),
    );
    expect(Array.isArray(readyPayload.advertisedToolNames)).toBe(true);

    const client = new Client({ name: "agentlint-http-test", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(`${running.baseUrl}/mcp`), {
      requestInit: {
        headers: {
          Authorization: "Bearer test-token",
        },
      },
    });

    try {
      await client.connect(transport);

      const listed = await client.listTools();
      const toolNames = listed.tools.map((tool) => tool.name);
      expect(toolNames).toEqual(
        expect.arrayContaining([
          "analyze_artifact",
          "analyze_context_bundle",
          "quality_gate_artifact",
          "suggest_patch",
          "validate_export",
        ]),
      );
      expect(toolNames.includes("analyze_workspace_artifacts")).toBe(false);

      const prompts = await client.listPrompts();
      expect(prompts.prompts.some((prompt) => prompt.name === "artifact_review_prompt")).toBe(true);

      const resources = await client.listResources();
      expect(resources.resources.some((resource) => resource.uri === "agentlint://quality-metrics/agents")).toBe(
        true,
      );
      expect(
        resources.resources.some((resource) => resource.uri === "agentlint://artifact-path-hints/agents"),
      ).toBe(true);
      expect(resources.resources.some((resource) => resource.uri === "agentlint://artifact-spec/agents")).toBe(
        true,
      );

      const resourceRead = await client.readResource({
        uri: "agentlint://artifact-spec/agents",
      });
      const firstContent = resourceRead.contents[0];
      if (!firstContent || !("text" in firstContent)) {
        throw new Error("Expected text resource content for artifact-spec");
      }
      expect(firstContent.text).toContain("Mandatory sections");

      const result = await client.callTool({
        name: "validate_export",
        arguments: {
          content: "# Valid markdown",
        },
      });

      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toEqual(
        expect.objectContaining({
          valid: true,
        }),
      );
    } finally {
      await client.close();
      await transport.close();
    }
  });

  it("rejects unauthenticated clients", async () => {
    running = await startMcpHttpServer({
      host: "127.0.0.1",
      port: 0,
    });

    const client = new Client({ name: "agentlint-http-test-no-auth", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(`${running.baseUrl}/mcp`));

    await expect(client.connect(transport)).rejects.toBeTruthy();

    await transport.close();
  });

  it("supports stateless compatibility mode with resources and quality gate", async () => {
    vi.stubEnv("MCP_HTTP_STATELESS", "true");
    running = await startMcpHttpServer({
      host: "127.0.0.1",
      port: 0,
    });

    const client = new Client({ name: "agentlint-http-test-stateless", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(`${running.baseUrl}/mcp`), {
      requestInit: {
        headers: {
          Authorization: "Bearer test-token",
        },
      },
    });

    try {
      await client.connect(transport);

      const listed = await client.listTools();
      expect(listed.tools.some((tool) => tool.name === "quality_gate_artifact")).toBe(true);

      const resources = await client.listResources();
      expect(resources.resources.some((resource) => resource.uri === "agentlint://artifact-spec/agents")).toBe(
        true,
      );

      const qualityGate = await client.callTool({
        name: "quality_gate_artifact",
        arguments: {
          type: "agents",
          content: "# AGENTS.md\n\nNever run destructive commands automatically.",
          targetScore: 100,
          candidateContent:
            "# AGENTS.md\n\nNever run destructive commands automatically.\n\n## Verification\n- Run lint and tests before merge.",
        },
      });

      expect(qualityGate.isError).not.toBe(true);
      expect(qualityGate.structuredContent).toEqual(
        expect.objectContaining({
          initialScore: expect.any(Number),
          score: expect.any(Number),
        }),
      );
    } finally {
      await client.close();
      await transport.close();
    }
  });
});
