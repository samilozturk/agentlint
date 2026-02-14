import type { ArtifactType, ContextDocumentInput } from "@/lib/artifacts";
import type { JudgeResult } from "@/lib/judge";
import type {
  JudgeFallbackReason,
  JudgeProviderName,
} from "@/server/services/judge-pipeline";
import { validateMarkdownOrYaml } from "@/server/security/export-validation";
import { sanitizeUserInput } from "@/server/security/sanitize";

import { buildJudgeAnalysis } from "./artifact-analyzer";
import { buildContextBundle, type ContextBundleSummary } from "./context-bundle";
import { runJudgePipeline } from "./judge-pipeline";

export type AnalyzeArtifactCoreInput = {
  type: ArtifactType;
  content: string;
  contextDocuments?: ContextDocumentInput[];
  analysisEnabled?: boolean;
};

export type AnalyzeArtifactCoreOutput = {
  requestedProvider: JudgeProviderName;
  provider: JudgeProviderName;
  fallbackUsed: boolean;
  fallbackReason: JudgeFallbackReason | null;
  confidence: number;
  analysisMode: "v1" | "v2";
  warnings: string[];
  contextSummary: ContextBundleSummary;
  mergedContent: string;
  sanitizedContent: string;
  result: JudgeResult;
};

export async function analyzeArtifactCore(
  input: AnalyzeArtifactCoreInput,
): Promise<AnalyzeArtifactCoreOutput> {
  const sanitized = sanitizeUserInput(input.content);
  const sanitizedContextDocs: ContextDocumentInput[] = [];
  const contextWarnings: string[] = [];

  for (const contextDoc of input.contextDocuments ?? []) {
    const sanitizedDoc = sanitizeUserInput(contextDoc.content);
    sanitizedContextDocs.push({
      ...contextDoc,
      content: sanitizedDoc.sanitizedContent,
    });

    for (const warning of sanitizedDoc.warnings) {
      contextWarnings.push(`[Context: ${contextDoc.label}] ${warning}`);
    }
  }

  const contextBundle = buildContextBundle({
    primaryContent: sanitized.sanitizedContent,
    contextDocuments: sanitizedContextDocs,
  });

  const analysisEnabled = input.analysisEnabled ?? process.env.ANALYSIS_V2_ENABLED !== "false";
  const analysisMode = analysisEnabled ? "v2" : "v1";

  const judged = await runJudgePipeline({
    type: input.type,
    content: contextBundle.mergedContent,
  });

  const exportValidation = validateMarkdownOrYaml(judged.result.refinedContent);
  const analysis = analysisEnabled
    ? buildJudgeAnalysis({
        type: input.type,
        content: sanitized.sanitizedContent,
        dimensions: judged.result.dimensions,
      })
    : null;

  const warnings = [
    ...sanitized.warnings,
    ...contextWarnings,
    ...contextBundle.warnings,
    ...judged.result.warnings,
  ];

  if (contextBundle.summary.included > 0) {
    warnings.push(
      `Project Context Mode active: ${contextBundle.summary.included}/${contextBundle.summary.provided} context document(s) included.`,
    );
  }

  if (!exportValidation.valid && exportValidation.reason) {
    warnings.push(`Export validation failed: ${exportValidation.reason}`);
  }

  if (analysis) {
    const blockingItems = analysis.missingItems.filter(
      (item) => item.severity === "blocking",
    ).length;
    if (blockingItems > 0) {
      warnings.push(`Blocking checklist issues detected: ${blockingItems}`);
    }
  }

  const refinedContent = exportValidation.valid
    ? judged.result.refinedContent
    : sanitized.sanitizedContent;

  return {
    requestedProvider: judged.requestedProvider,
    provider: judged.provider,
    fallbackUsed: judged.fallbackUsed,
    fallbackReason: judged.fallbackReason,
    confidence: judged.confidence,
    analysisMode,
    warnings,
    contextSummary: contextBundle.summary,
    mergedContent: contextBundle.mergedContent,
    sanitizedContent: sanitized.sanitizedContent,
    result: {
      ...judged.result,
      refinedContent,
      warnings,
      analysis: analysis ?? undefined,
    },
  };
}
