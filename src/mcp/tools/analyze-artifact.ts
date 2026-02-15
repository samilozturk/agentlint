import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { analyzeArtifactMcpCore } from "@/server/services/analyze-artifact-mcp-core";

import { analyzeArtifactInputSchema, type AnalyzeArtifactInput } from "../types";
import { toToolResult } from "./tool-result";

export type AnalyzeArtifactToolOutput = {
  score: number;
  requestedProvider: string;
  provider: string;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  confidence: number;
  warnings: string[];
  refinedContent: string;
  contextSummary: {
    provided: number;
    included: number;
    truncated: number;
    mergedChars: number;
  };
  analysisMode: "deterministic";
};

export async function executeAnalyzeArtifactTool(
  input: AnalyzeArtifactInput,
): Promise<AnalyzeArtifactToolOutput> {
  const analyzed = await analyzeArtifactMcpCore({
    type: input.type,
    content: input.content,
    contextDocuments: input.contextDocuments,
    analysisEnabled: input.analysisEnabled,
  });

  return {
    score: analyzed.result.score,
    requestedProvider: analyzed.requestedProvider,
    provider: analyzed.provider,
    fallbackUsed: analyzed.fallbackUsed,
    fallbackReason: analyzed.fallbackReason,
    confidence: analyzed.confidence,
    warnings: analyzed.warnings,
    refinedContent: analyzed.result.refinedContent,
    contextSummary: analyzed.contextSummary,
    analysisMode: analyzed.analysisMode,
  };
}

export function registerAnalyzeArtifactTool(server: McpServer): void {
  server.registerTool(
    "analyze_artifact",
    {
      title: "Analyze Artifact",
      description:
        "Use when AGENTS.md, skills, rules, workflows, or plans are created/edited/reviewed. Runs deterministic quality analysis and returns score, warnings, and sanitized content.",
      inputSchema: analyzeArtifactInputSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        destructiveHint: false,
      },
    },
    async (args) => {
      try {
        const output = await executeAnalyzeArtifactTool(args);
        const fallbackLabel = output.fallbackUsed
          ? ` fallback=${output.fallbackReason ?? "unknown"}`
          : "";

        return toToolResult({
          summary: `score=${output.score} provider=${output.provider}${fallbackLabel} warnings=${output.warnings.length}`,
          structuredContent: output,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return toToolResult({
          summary: `analyze_artifact failed: ${message}`,
          structuredContent: { error: message },
          isError: true,
        });
      }
    },
  );
}
