import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerAnalyzeArtifactTool } from "./analyze-artifact";
import { registerAnalyzeContextBundleTool } from "./analyze-context-bundle";
import { registerSuggestPatchTool } from "./suggest-patch";
import { registerValidateExportTool } from "./validate-export";

export {
  executeAnalyzeArtifactTool,
  type AnalyzeArtifactToolOutput,
} from "./analyze-artifact";
export {
  executeAnalyzeContextBundleTool,
  type AnalyzeContextBundleToolOutput,
} from "./analyze-context-bundle";
export { executeSuggestPatchTool, type SuggestPatchToolOutput } from "./suggest-patch";
export {
  executeValidateExportTool,
  type ValidateExportToolOutput,
} from "./validate-export";

export function registerAgentLintTools(server: McpServer): void {
  registerAnalyzeArtifactTool(server);
  registerAnalyzeContextBundleTool(server);
  registerSuggestPatchTool(server);
  registerValidateExportTool(server);
}
