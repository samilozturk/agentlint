import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerAnalyzeArtifactTool } from "./analyze-artifact";
import { registerAnalyzeContextBundleTool } from "./analyze-context-bundle";
import {
  registerAnalyzeWorkspaceArtifactsTool,
  type RegisterAnalyzeWorkspaceArtifactsOptions,
} from "./analyze-workspace-artifacts";
import { registerPrepareArtifactFixContextTool } from "./prepare-artifact-fix-context";
import { registerQualityGateArtifactTool } from "./quality-gate-artifact";
import { registerSubmitClientAssessmentTool } from "./submit-client-assessment";
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
  executePrepareArtifactFixContextTool,
  type PrepareArtifactFixContextToolOutput,
} from "./prepare-artifact-fix-context";
export {
  executeQualityGateArtifactTool,
  type QualityGateArtifactToolOutput,
} from "./quality-gate-artifact";
export {
  executeSubmitClientAssessmentTool,
  type SubmitClientAssessmentToolOutput,
} from "./submit-client-assessment";
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
  registerPrepareArtifactFixContextTool(server);
  registerAnalyzeArtifactTool(server);
  registerAnalyzeContextBundleTool(server);
  registerSubmitClientAssessmentTool(server);
  registerQualityGateArtifactTool(server);
  registerSuggestPatchTool(server);
  registerValidateExportTool(server);
  registerAnalyzeWorkspaceArtifactsTool(server, {
    enabled: options.enableWorkspaceScan,
  } satisfies RegisterAnalyzeWorkspaceArtifactsOptions);
}
