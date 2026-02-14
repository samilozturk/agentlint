import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerAgentLintTools } from "../tools";

export const DEFAULT_MCP_SERVER_NAME = "agentlint-mcp";

const DEFAULT_MCP_INSTRUCTIONS =
  "Agent Lint MCP exposes artifact analysis and patch helper tools for AGENTS.md/skills/rules/workflows/plans content.";

export type CreateAgentLintMcpServerOptions = {
  name?: string;
  version?: string;
  instructions?: string;
};

function resolveServerVersion(): string {
  return process.env.npm_package_version ?? "0.1.0";
}

export function createAgentLintMcpServer(
  options: CreateAgentLintMcpServerOptions = {},
): McpServer {
  const server = new McpServer(
    {
      name: options.name ?? DEFAULT_MCP_SERVER_NAME,
      version: options.version ?? resolveServerVersion(),
    },
    {
      instructions: options.instructions ?? DEFAULT_MCP_INSTRUCTIONS,
      capabilities: {
        tools: {
          listChanged: true,
        },
      },
    },
  );

  registerAgentLintTools(server);
  return server;
}
