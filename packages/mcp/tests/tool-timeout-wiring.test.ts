import { describe, expect, it, vi } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const { withToolTimeoutMock } = vi.hoisted(() => ({
  withToolTimeoutMock: vi.fn(
    async (_toolName: string, fn: () => Promise<unknown>) => fn(),
  ),
}));

vi.mock("../src/transport-security.js", () => ({
  withToolTimeout: withToolTimeoutMock,
}));

import { registerAgentLintTools } from "../src/tools/index.js";

type RegisteredToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

function createFakeServer() {
  const handlers = new Map<string, RegisteredToolHandler>();

  const server = {
    registerTool(name: string, _definition: unknown, handler: RegisteredToolHandler) {
      handlers.set(name, handler);
    },
  } as unknown as McpServer;

  return { server, handlers };
}

describe("tool timeout wiring", () => {
  it("wraps every current tool handler with withToolTimeout", async () => {
    const { server, handlers } = createFakeServer();

    registerAgentLintTools(server, { enableWorkspaceScan: true });

    await handlers.get("agentlint_get_guidelines")?.({ type: "agents" });
    await handlers.get("agentlint_plan_workspace_autofix")?.({ rootPath: process.cwd() });
    await handlers.get("agentlint_quick_check")?.({ changedPaths: ["package.json"] });
    await handlers.get("agentlint_emit_maintenance_snippet")?.({ client: "cursor" });

    expect(withToolTimeoutMock).toHaveBeenCalledWith(
      "agentlint_get_guidelines",
      expect.any(Function),
    );
    expect(withToolTimeoutMock).toHaveBeenCalledWith(
      "agentlint_plan_workspace_autofix",
      expect.any(Function),
    );
    expect(withToolTimeoutMock).toHaveBeenCalledWith(
      "agentlint_quick_check",
      expect.any(Function),
    );
    expect(withToolTimeoutMock).toHaveBeenCalledWith(
      "agentlint_emit_maintenance_snippet",
      expect.any(Function),
    );
  });
});
