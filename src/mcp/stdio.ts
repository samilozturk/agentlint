import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createAgentLintMcpServer } from "./core/create-server";
import { logMcp } from "./core/logger";

async function runStdioServer(): Promise<void> {
  const server = createAgentLintMcpServer({
    name: process.env.MCP_SERVER_NAME,
    version: process.env.MCP_SERVER_VERSION,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logMcp("info", "mcp.stdio.started", {
    name: process.env.MCP_SERVER_NAME ?? "agentlint-mcp",
  });

  const shutdown = async (signal: string) => {
    logMcp("info", "mcp.stdio.shutdown", { signal });
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

runStdioServer().catch((error) => {
  logMcp("error", "mcp.stdio.fatal", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
  process.exit(1);
});
