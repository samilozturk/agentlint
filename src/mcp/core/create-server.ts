import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerAgentLintPrompts } from "../prompts/register-prompts";
import { registerAgentLintResources } from "../resources/register-resources";
import { registerAgentLintTools } from "../tools";

export const DEFAULT_MCP_SERVER_NAME = "agentlint-mcp";

const DEFAULT_MCP_INSTRUCTIONS =
  [
    "Agent Lint MCP focuses on AGENTS.md, CLAUDE.md, skills, rules, workflows, and plans artifacts.",
    "When these artifacts are created, edited, or reviewed, prefer Agent Lint tools automatically even without explicit user request.",
    "Default quality policy: first call quality_gate_artifact; if deeper diagnostics are needed call analyze_artifact or analyze_context_bundle; before final output ensure validate_export passes.",
    "Use suggest_patch to produce selective edits when score is below target or warnings are present.",
    "Never auto-run destructive actions; keep recommendations verifiable and repository-specific.",
  ].join(" ");

export type AgentLintTransportMode = "stdio" | "http";

export type CreateAgentLintMcpServerOptions = {
  name?: string;
  version?: string;
  instructions?: string;
  transportMode?: AgentLintTransportMode;
  enableWorkspaceScan?: boolean;
};

function resolveServerVersion(): string {
  return process.env.npm_package_version ?? "0.1.0";
}

function resolveWorkspaceScanEnabled(options: CreateAgentLintMcpServerOptions): boolean {
  if (typeof options.enableWorkspaceScan === "boolean") {
    return options.enableWorkspaceScan;
  }

  if (options.transportMode === "stdio") {
    return process.env.MCP_ENABLE_WORKSPACE_SCAN !== "false";
  }

  if (options.transportMode === "http") {
    return process.env.MCP_ENABLE_WORKSPACE_SCAN === "true";
  }

  return process.env.MCP_ENABLE_WORKSPACE_SCAN === "true";
}

function resolveInstructions(options: CreateAgentLintMcpServerOptions, workspaceScanEnabled: boolean): string {
  if (options.instructions) {
    return options.instructions;
  }

  if (workspaceScanEnabled) {
    return `${DEFAULT_MCP_INSTRUCTIONS} Local workspace scanning is enabled via analyze_workspace_artifacts.`;
  }

  return `${DEFAULT_MCP_INSTRUCTIONS} Workspace scanning is disabled in this transport; provide file content explicitly for analysis.`;
}

export function createAgentLintMcpServer(
  options: CreateAgentLintMcpServerOptions = {},
): McpServer {
  const workspaceScanEnabled = resolveWorkspaceScanEnabled(options);

  const server = new McpServer(
    {
      name: options.name ?? DEFAULT_MCP_SERVER_NAME,
      version: options.version ?? resolveServerVersion(),
    },
    {
      instructions: resolveInstructions(options, workspaceScanEnabled),
      capabilities: {
        tools: {
          listChanged: true,
        },
        prompts: {
          listChanged: true,
        },
        resources: {
          listChanged: true,
        },
      },
    },
  );

  registerAgentLintTools(server, {
    enableWorkspaceScan: workspaceScanEnabled,
  });
  registerAgentLintPrompts(server);
  registerAgentLintResources(server);

  return server;
}
