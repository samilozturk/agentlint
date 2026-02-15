import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  qualityGateArtifactInputSchema,
  type QualityGateArtifactInput,
} from "@/mcp/types";

import { executeAnalyzeArtifactTool } from "./analyze-artifact";
import { executeSuggestPatchTool } from "./suggest-patch";
import { toToolResult } from "./tool-result";
import { executeValidateExportTool } from "./validate-export";

const DEFAULT_TARGET_SCORE = 90;

export type QualityGateArtifactToolOutput = {
  targetScore: number;
  passed: boolean;
  initialScore: number;
  score: number;
  warnings: string[];
  analysis: {
    provider: string;
    requestedProvider: string;
    fallbackUsed: boolean;
    fallbackReason: string | null;
    confidence: number;
    contextSummary: {
      provided: number;
      included: number;
      truncated: number;
      mergedChars: number;
    };
  };
  patch: {
    applied: boolean;
    segmentCount: number;
    selectedSegmentIndexes: number[];
    addedLines: number;
    removedLines: number;
  } | null;
  exportValidation: {
    valid: boolean;
    reason: string | null;
  };
  finalContent: string;
};

export async function executeQualityGateArtifactTool(
  input: QualityGateArtifactInput,
): Promise<QualityGateArtifactToolOutput> {
  const targetScore = input.targetScore ?? DEFAULT_TARGET_SCORE;
  const applyPatchWhenBelowTarget = input.applyPatchWhenBelowTarget ?? true;

  const initialAnalyzed = await executeAnalyzeArtifactTool({
    type: input.type,
    content: input.content,
    contextDocuments: input.contextDocuments,
    analysisEnabled: input.analysisEnabled,
  });

  let mergedContentCandidate = initialAnalyzed.refinedContent;
  let patch: QualityGateArtifactToolOutput["patch"] = null;

  if (
    applyPatchWhenBelowTarget &&
    initialAnalyzed.score < targetScore &&
    typeof input.candidateContent === "string" &&
    input.candidateContent.trim().length > 0
  ) {
    const suggested = executeSuggestPatchTool({
      originalContent: input.content,
      refinedContent: input.candidateContent,
      selectedSegmentIndexes: input.selectedSegmentIndexes,
    });

    mergedContentCandidate = suggested.suggestedContent;
    patch = {
      applied: true,
      segmentCount: suggested.segmentCount,
      selectedSegmentIndexes: suggested.selectedSegmentIndexes,
      addedLines: suggested.addedLines,
      removedLines: suggested.removedLines,
    };
  }

  const finalAnalyzed = patch
    ? await executeAnalyzeArtifactTool({
        type: input.type,
        content: mergedContentCandidate,
        contextDocuments: input.contextDocuments,
        analysisEnabled: input.analysisEnabled,
      })
    : initialAnalyzed;

  const finalContent = finalAnalyzed.refinedContent;

  const exportValidation = executeValidateExportTool({ content: finalContent });
  const passed = finalAnalyzed.score >= targetScore && exportValidation.valid;

  return {
    targetScore,
    passed,
    initialScore: initialAnalyzed.score,
    score: finalAnalyzed.score,
    warnings: finalAnalyzed.warnings,
    analysis: {
      provider: finalAnalyzed.provider,
      requestedProvider: finalAnalyzed.requestedProvider,
      fallbackUsed: finalAnalyzed.fallbackUsed,
      fallbackReason: finalAnalyzed.fallbackReason,
      confidence: finalAnalyzed.confidence,
      contextSummary: finalAnalyzed.contextSummary,
    },
    patch,
    exportValidation,
    finalContent,
  };
}

export function registerQualityGateArtifactTool(server: McpServer): void {
  server.registerTool(
    "quality_gate_artifact",
    {
      title: "Quality Gate Artifact",
      description:
        "Default artifact QA pipeline. Use when AGENTS.md/rules/skills/workflows/plans are created or updated. Runs deterministic analyze_artifact and validate_export, optionally merging client-generated candidate content through suggest_patch.",
      inputSchema: qualityGateArtifactInputSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        destructiveHint: false,
      },
    },
    async (args) => {
      try {
        const output = await executeQualityGateArtifactTool(args);
        return toToolResult({
          summary: `passed=${output.passed} score=${output.initialScore}->${output.score} target=${output.targetScore} exportValid=${output.exportValidation.valid}`,
          structuredContent: output,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return toToolResult({
          summary: `quality_gate_artifact failed: ${message}`,
          structuredContent: { error: message },
          isError: true,
        });
      }
    },
  );
}
