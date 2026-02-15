import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerAnalyzeArtifactTool } from "./analyze-artifact";
import { registerAnalyzeContextBundleTool } from "./analyze-context-bundle";
import {
  registerAnalyzeWorkspaceArtifactsTool,
  type RegisterAnalyzeWorkspaceArtifactsOptions,
} from "./analyze-workspace-artifacts";
import { registerQualityGateArtifactTool } from "./quality-gate-artifact";
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
export {
  executeAnalyzeWorkspaceArtifactsTool,
  type AnalyzeWorkspaceArtifactsToolOutput,
} from "./analyze-workspace-artifacts";
export {
  executeQualityGateArtifactTool,
  type QualityGateArtifactToolOutput,
} from "./quality-gate-artifact";
export { executeSuggestPatchTool, type SuggestPatchToolOutput } from "./suggest-patch";
export {
  executeValidateExportTool,
  type ValidateExportToolOutput,
} from "./validate-export";

export type RegisterAgentLintToolsOptions = {
  enableWorkspaceScan: boolean;
};

export function registerAgentLintTools(
  server: McpServer,
  options: RegisterAgentLintToolsOptions,
): void {
  registerAnalyzeArtifactTool(server);
  registerAnalyzeContextBundleTool(server);
  registerQualityGateArtifactTool(server);
  registerSuggestPatchTool(server);
  registerValidateExportTool(server);
  registerAnalyzeWorkspaceArtifactsTool(server, {
    enabled: options.enableWorkspaceScan,
  } satisfies RegisterAnalyzeWorkspaceArtifactsOptions);
}
