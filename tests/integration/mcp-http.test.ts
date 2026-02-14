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
      expect(listed.tools.some((tool) => tool.name === "validate_export")).toBe(true);

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
});
