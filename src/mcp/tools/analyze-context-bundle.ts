import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { analyzeArtifactMcpCore } from "@/server/services/analyze-artifact-mcp-core";

import {
  analyzeContextBundleInputSchema,
  type AnalyzeContextBundleInput,
} from "../types";
import { toToolResult } from "./tool-result";

const DEFAULT_PREVIEW_CHARS = 1_500;

export type AnalyzeContextBundleToolOutput = {
  score: number;
  warnings: string[];
  contextSummary: {
    provided: number;
    included: number;
    truncated: number;
    mergedChars: number;
  };
  mergedContentPreview?: string;
};

export async function executeAnalyzeContextBundleTool(
  input: AnalyzeContextBundleInput,
): Promise<AnalyzeContextBundleToolOutput> {
  const analyzed = await analyzeArtifactMcpCore({
    type: input.type,
    content: input.content,
    contextDocuments: input.contextDocuments,
    analysisEnabled: input.analysisEnabled,
  });

  return {
    score: analyzed.result.score,
    warnings: analyzed.warnings,
    contextSummary: analyzed.contextSummary,
    mergedContentPreview: input.includeMergedContentPreview
      ? analyzed.mergedContent.slice(0, DEFAULT_PREVIEW_CHARS)
      : undefined,
  };
}

export function registerAnalyzeContextBundleTool(server: McpServer): void {
  server.registerTool(
    "analyze_context_bundle",
    {
      title: "Analyze Context Bundle",
      description:
        "Use when artifact quality depends on multiple docs (for example AGENTS + rules + roadmap). Runs merged context analysis and reports bundle diagnostics.",
      inputSchema: analyzeContextBundleInputSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        destructiveHint: false,
      },
    },
    async (args) => {
      try {
        const output = await executeAnalyzeContextBundleTool(args);

        return toToolResult({
          summary: `score=${output.score} context=${output.contextSummary.included}/${output.contextSummary.provided} warnings=${output.warnings.length}`,
          structuredContent: output,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return toToolResult({
          summary: `analyze_context_bundle failed: ${message}`,
          structuredContent: { error: message },
          isError: true,
        });
      }
    },
  );
}
