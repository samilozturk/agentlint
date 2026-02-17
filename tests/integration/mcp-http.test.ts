import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  startMcpHttpServer,
  type RunningMcpHttpServer,
} from "@/mcp/http/server";
import { resetRateLimitWindowsForTests } from "@/server/security/rate-limit";

const CLIENT_METRICS = [
  "clarity",
  "specificity",
  "scope-control",
  "completeness",
  "actionability",
  "verifiability",
  "safety",
  "injection-resistance",
  "secret-hygiene",
  "token-efficiency",
  "platform-fit",
  "maintainability",
] as const;

describe("MCP streamable HTTP server", () => {
  let running: RunningMcpHttpServer | null = null;

  beforeEach(() => {
    vi.stubEnv("LLM_PROVIDER", "mock");
    vi.stubEnv("MCP_BEARER_TOKENS", "test-client=test-token:*");
    vi.stubEnv("MCP_REQUIRE_AUTH", "true");
    resetRateLimitWindowsForTests();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    resetRateLimitWindowsForTests();
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
    expect(readyPayload.advertisedToolNames).toEqual(
      expect.arrayContaining([
        "prepare_artifact_fix_context",
        "submit_client_assessment",
        "quality_gate_artifact",
      ]),
    );
    expect(readyPayload.resourceTemplates).toEqual(
      expect.arrayContaining([
        "agentlint://scoring-policy/{type}",
        "agentlint://assessment-schema/{type}",
        "agentlint://improvement-playbook/{type}",
      ]),
    );

    const client = new Client({
      name: "agentlint-http-test",
      version: "1.0.0",
    });
    const transport = new StreamableHTTPClientTransport(
      new URL(`${running.baseUrl}/mcp`),
      {
        requestInit: {
          headers: {
            Authorization: "Bearer test-token",
          },
        },
      },
    );

    try {
      await client.connect(transport);

      const listed = await client.listTools();
      const toolNames = listed.tools.map((tool) => tool.name);
      expect(toolNames).toEqual(
        expect.arrayContaining([
          "prepare_artifact_fix_context",
          "analyze_artifact",
          "analyze_context_bundle",
          "submit_client_assessment",
          "quality_gate_artifact",
          "suggest_patch",
          "validate_export",
        ]),
      );
      expect(toolNames.includes("analyze_workspace_artifacts")).toBe(false);

      const prompts = await client.listPrompts();
      expect(
        prompts.prompts.some(
          (prompt) => prompt.name === "artifact_review_prompt",
        ),
      ).toBe(true);

      const resources = await client.listResources();
      expect(
        resources.resources.some(
          (resource) => resource.uri === "agentlint://quality-metrics/agents",
        ),
      ).toBe(true);
      expect(
        resources.resources.some(
          (resource) =>
            resource.uri === "agentlint://artifact-path-hints/agents",
        ),
      ).toBe(true);
      expect(
        resources.resources.some(
          (resource) => resource.uri === "agentlint://artifact-spec/agents",
        ),
      ).toBe(true);
      expect(
        resources.resources.some(
          (resource) => resource.uri === "agentlint://scoring-policy/agents",
        ),
      ).toBe(true);
      expect(
        resources.resources.some(
          (resource) => resource.uri === "agentlint://assessment-schema/agents",
        ),
      ).toBe(true);
      expect(
        resources.resources.some(
          (resource) =>
            resource.uri === "agentlint://improvement-playbook/agents",
        ),
      ).toBe(true);

      const resourceRead = await client.readResource({
        uri: "agentlint://scoring-policy/agents",
      });
      const firstContent = resourceRead.contents[0];
      if (!firstContent || !("text" in firstContent)) {
        throw new Error("Expected text resource content for scoring policy");
      }
      expect(firstContent.text).toContain("clientWeighted*90%");

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

      const prepare = await client.callTool({
        name: "prepare_artifact_fix_context",
        arguments: {
          type: "agents",
        },
      });
      expect(prepare.isError).not.toBe(true);
      expect(prepare.structuredContent).toEqual(
        expect.objectContaining({
          policySnapshot: expect.any(Object),
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

    const client = new Client({
      name: "agentlint-http-test-no-auth",
      version: "1.0.0",
    });
    const transport = new StreamableHTTPClientTransport(
      new URL(`${running.baseUrl}/mcp`),
    );

    await expect(client.connect(transport)).rejects.toBeTruthy();

    await transport.close();
  });

  it("supports stateless compatibility mode with resources and quality gate", async () => {
    vi.stubEnv("MCP_HTTP_STATELESS", "true");
    running = await startMcpHttpServer({
      host: "127.0.0.1",
      port: 0,
    });

    const client = new Client({
      name: "agentlint-http-test-stateless",
      version: "1.0.0",
    });
    const transport = new StreamableHTTPClientTransport(
      new URL(`${running.baseUrl}/mcp`),
      {
        requestInit: {
          headers: {
            Authorization: "Bearer test-token",
          },
        },
      },
    );

    try {
      await client.connect(transport);

      const listed = await client.listTools();
      expect(
        listed.tools.some((tool) => tool.name === "quality_gate_artifact"),
      ).toBe(true);

      const resources = await client.listResources();
      expect(
        resources.resources.some(
          (resource) => resource.uri === "agentlint://artifact-spec/agents",
        ),
      ).toBe(true);

      const qualityGate = await client.callTool({
        name: "quality_gate_artifact",
        arguments: {
          type: "agents",
          content:
            "# AGENTS.md\n\nNever run destructive commands automatically.",
          targetScore: 80,
          candidateContent:
            "# AGENTS.md\n\nNever run destructive commands automatically.\n\n## Verification\n- Run lint and tests before merge.",
          clientAssessment: {
            repositoryScanSummary:
              "Scanned AGENTS.md and docs for policy alignment.",
            metricScores: CLIENT_METRICS.map((metric) => ({
              metric,
              score: 86,
            })),
            metricEvidence: CLIENT_METRICS.map((metric) => ({
              metric,
              citations: [
                { filePath: "AGENTS.md", snippet: `Evidence for ${metric}` },
              ],
            })),
          },
        },
      });

      expect(qualityGate.isError).not.toBe(true);
      expect(qualityGate.structuredContent).toEqual(
        expect.objectContaining({
          initialScore: expect.any(Number),
          score: expect.any(Number),
          finalScore: expect.any(Number),
          scoreModel: "client_weighted_hybrid",
        }),
      );

      const strictWithoutAssessment = await client.callTool({
        name: "quality_gate_artifact",
        arguments: {
          type: "agents",
          content:
            "# AGENTS.md\n\nNever run destructive commands automatically.",
          targetScore: 80,
        },
      });
      expect(strictWithoutAssessment.isError).not.toBe(true);
      expect(strictWithoutAssessment.structuredContent).toEqual(
        expect.objectContaining({
          passed: false,
          enforcement: expect.objectContaining({
            violationCode: "CLIENT_ASSESSMENT_REQUIRED",
          }),
        }),
      );

      const submitAssessment = await client.callTool({
        name: "submit_client_assessment",
        arguments: {
          type: "agents",
          content:
            "# AGENTS.md\n\nNever run destructive commands automatically.",
          targetScore: 80,
          assessment: {
            repositoryScanSummary: "Scanned AGENTS.md and docs.",
            metricScores: CLIENT_METRICS.map((metric) => ({
              metric,
              score: 85,
            })),
            metricEvidence: CLIENT_METRICS.map((metric) => ({
              metric,
              citations: [
                { filePath: "AGENTS.md", snippet: `Citation ${metric}` },
              ],
            })),
          },
        },
      });
      expect(submitAssessment.isError).not.toBe(true);
      expect(submitAssessment.structuredContent).toEqual(
        expect.objectContaining({
          finalScore: expect.any(Number),
          policyVersion: "client-led-v1",
        }),
      );
    } finally {
      await client.close();
      await transport.close();
    }
  });

  it("binds stateful sessions to the authenticated client id", async () => {
    vi.stubEnv("MCP_BEARER_TOKENS", "client-a=token-a:*;client-b=token-b:*");
    running = await startMcpHttpServer({
      host: "127.0.0.1",
      port: 0,
      statelessMode: false,
    });

    const clientA = new Client({
      name: "agentlint-http-client-a",
      version: "1.0.0",
    });
    const transportA = new StreamableHTTPClientTransport(
      new URL(`${running.baseUrl}/mcp`),
      {
        requestInit: {
          headers: {
            Authorization: "Bearer token-a",
          },
        },
      },
    );

    const clientB = new Client({
      name: "agentlint-http-client-b",
      version: "1.0.0",
    });

    try {
      await clientA.connect(transportA);
      await clientA.listTools();

      const sessionId = transportA.sessionId;
      expect(typeof sessionId).toBe("string");
      expect(sessionId).toBeTruthy();

      const transportB = new StreamableHTTPClientTransport(
        new URL(`${running.baseUrl}/mcp`),
        {
          sessionId,
          requestInit: {
            headers: {
              Authorization: "Bearer token-b",
            },
          },
        },
      );

      await clientB.connect(transportB);
      await expect(clientB.listTools()).rejects.toBeTruthy();
      await Promise.allSettled([clientB.close(), transportB.close()]);
    } finally {
      await Promise.allSettled([clientA.close(), transportA.close()]);
    }
  });

  it("ignores x-forwarded-for for rate limiting unless proxy trust is enabled", async () => {
    running = await startMcpHttpServer({
      host: "127.0.0.1",
      port: 0,
      auth: {
        required: true,
        tokens: [
          { token: "test-token", clientId: "test-client", scopes: ["*"] },
        ],
        maxRequests: 1,
        windowMs: 60_000,
        enforceToolScopes: true,
        trustProxyHeaders: false,
      },
    });

    const first = await fetch(`${running.baseUrl}/mcp`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "content-type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
      body: JSON.stringify({}),
    });
    expect(first.status).not.toBe(429);

    const second = await fetch(`${running.baseUrl}/mcp`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "content-type": "application/json",
        "x-forwarded-for": "9.9.9.9",
      },
      body: JSON.stringify({}),
    });
    expect(second.status).toBe(429);
    expect(second.headers.get("retry-after")).toBeTruthy();

    await running.close();
    running = null;

    running = await startMcpHttpServer({
      host: "127.0.0.1",
      port: 0,
      auth: {
        required: true,
        tokens: [
          { token: "test-token", clientId: "test-client", scopes: ["*"] },
        ],
        maxRequests: 1,
        windowMs: 60_000,
        enforceToolScopes: true,
        trustProxyHeaders: true,
      },
    });

    const trustedFirst = await fetch(`${running.baseUrl}/mcp`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "content-type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
      body: JSON.stringify({}),
    });
    expect(trustedFirst.status).not.toBe(429);

    const trustedSecond = await fetch(`${running.baseUrl}/mcp`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "content-type": "application/json",
        "x-forwarded-for": "9.9.9.9",
      },
      body: JSON.stringify({}),
    });
    expect(trustedSecond.status).not.toBe(429);
  });

  it("returns 400 for malformed JSON payloads", async () => {
    running = await startMcpHttpServer({
      host: "127.0.0.1",
      port: 0,
      statelessMode: true,
    });

    const response = await fetch(`${running.baseUrl}/mcp`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "content-type": "application/json",
      },
      body: '{"jsonrpc":"2.0",',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: "Malformed JSON payload.",
      }),
    );
  });

  it("rejects oversized payload attempts", async () => {
    running = await startMcpHttpServer({
      host: "127.0.0.1",
      port: 0,
      statelessMode: true,
      maxBodyBytes: 64,
    });

    const response = await fetch(`${running.baseUrl}/healthz`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: {
            name: "oversized",
            version: "1.0.0",
          },
          pad: "x".repeat(1024),
        },
      }),
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("returns 401 for invalid bearer token", async () => {
    running = await startMcpHttpServer({
      host: "127.0.0.1",
      port: 0,
      statelessMode: true,
    });

    const response = await fetch(`${running.baseUrl}/mcp`, {
      method: "POST",
      headers: {
        Authorization: "Bearer wrong-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: "Invalid Bearer token.",
      }),
    );
  });

  it("returns 400 for stateful non-initialize request without session id", async () => {
    running = await startMcpHttpServer({
      host: "127.0.0.1",
      port: 0,
      statelessMode: false,
    });

    const response = await fetch(`${running.baseUrl}/mcp`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error:
          "Missing MCP session id. Initialize first or include Mcp-Session-Id header.",
      }),
    );
  });

  it("returns 404 for unknown stateful session id", async () => {
    running = await startMcpHttpServer({
      host: "127.0.0.1",
      port: 0,
      statelessMode: false,
    });

    const response = await fetch(`${running.baseUrl}/mcp`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "content-type": "application/json",
        "mcp-session-id": "missing-session",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: "Unknown MCP session.",
      }),
    );
  });

  it("serves oauth metadata endpoints based on env configuration", async () => {
    running = await startMcpHttpServer({
      host: "127.0.0.1",
      port: 0,
      statelessMode: true,
    });

    const protectedResource = await fetch(
      `${running.baseUrl}/.well-known/oauth-protected-resource`,
    );
    expect(protectedResource.status).toBe(200);
    const protectedResourcePayload = (await protectedResource.json()) as Record<
      string,
      unknown
    >;
    expect(protectedResourcePayload.resource).toBe("http://127.0.0.1:3333/mcp");

    const authServerMissing = await fetch(
      `${running.baseUrl}/.well-known/oauth-authorization-server`,
    );
    expect(authServerMissing.status).toBe(404);

    await running.close();
    running = null;

    vi.stubEnv("MCP_OAUTH_ISSUER", "https://auth.example.com");
    vi.stubEnv(
      "MCP_OAUTH_AUTHORIZATION_ENDPOINT",
      "https://auth.example.com/oauth/authorize",
    );
    vi.stubEnv(
      "MCP_OAUTH_TOKEN_ENDPOINT",
      "https://auth.example.com/oauth/token",
    );
    vi.stubEnv(
      "MCP_OAUTH_JWKS_URI",
      "https://auth.example.com/.well-known/jwks.json",
    );
    vi.stubEnv("MCP_SUPPORTED_SCOPES", "analyze,validate,patch");

    running = await startMcpHttpServer({
      host: "127.0.0.1",
      port: 0,
      statelessMode: true,
    });

    const authServerConfigured = await fetch(
      `${running.baseUrl}/.well-known/oauth-authorization-server`,
    );
    expect(authServerConfigured.status).toBe(200);
    await expect(authServerConfigured.json()).resolves.toEqual(
      expect.objectContaining({
        issuer: "https://auth.example.com",
        authorization_endpoint: "https://auth.example.com/oauth/authorize",
        token_endpoint: "https://auth.example.com/oauth/token",
      }),
    );
  });
});
