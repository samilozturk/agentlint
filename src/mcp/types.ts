import { z } from "zod";

import {
  artifactTypeSchema,
  contextDocumentSchema,
  type ContextDocumentInput,
} from "@/lib/artifacts";

export const MCP_TOOL_NAMES = [
  "analyze_artifact",
  "analyze_context_bundle",
  "quality_gate_artifact",
  "suggest_patch",
  "validate_export",
  "analyze_workspace_artifacts",
] as const;

export type McpToolName = (typeof MCP_TOOL_NAMES)[number];

export const MCP_TOOL_SCOPE_REQUIREMENTS: Record<McpToolName, string> = {
  analyze_artifact: "analyze",
  analyze_context_bundle: "analyze",
  quality_gate_artifact: "analyze",
  suggest_patch: "patch",
  validate_export: "validate",
  analyze_workspace_artifacts: "analyze",
};

export const mcpContextDocumentSchema = contextDocumentSchema;

export type McpContextDocument = ContextDocumentInput;

export const analyzeArtifactInputSchema = z.object({
  type: artifactTypeSchema.describe(
    "Artifact type. Use for AGENTS/skills/rules/workflows/plans creation, review, or edit validation.",
  ),
  content: z
    .string()
    .min(1)
    .max(1_000_000)
    .describe("Current artifact markdown/yaml content to analyze."),
  contextDocuments: z
    .array(mcpContextDocumentSchema)
    .max(20)
    .optional()
    .describe("Optional supporting docs (architecture, rules, roadmap) to improve cross-doc validation."),
  analysisEnabled: z
    .boolean()
    .optional()
    .describe("Enable enhanced analyzer signals/checklist mode."),
});

export type AnalyzeArtifactInput = z.infer<typeof analyzeArtifactInputSchema>;

export const analyzeContextBundleInputSchema = z.object({
  type: artifactTypeSchema.describe("Primary artifact type for context-aware analysis."),
  content: z
    .string()
    .min(1)
    .max(1_000_000)
    .describe("Primary artifact content."),
  contextDocuments: z
    .array(mcpContextDocumentSchema)
    .min(1)
    .max(20)
    .describe("Context bundle documents to merge and evaluate for conflicts."),
  analysisEnabled: z.boolean().optional().describe("Enable enhanced analyzer mode."),
  includeMergedContentPreview: z
    .boolean()
    .optional()
    .describe("Include merged content preview in response for debugging context assembly."),
});

export type AnalyzeContextBundleInput = z.infer<typeof analyzeContextBundleInputSchema>;

export const suggestPatchInputSchema = z.object({
  originalContent: z.string().describe("Original source content before lint/fix pass."),
  refinedContent: z.string().describe("Improved candidate content."),
  selectedSegmentIndexes: z
    .array(z.number().int().min(0))
    .optional()
    .describe("Optional list of diff segment indexes to apply. Omit to apply all changed segments."),
});

export type SuggestPatchInput = z.infer<typeof suggestPatchInputSchema>;

export const validateExportInputSchema = z.object({
  content: z
    .string()
    .min(1)
    .describe("Final markdown/yaml candidate to validate before presenting to users."),
});

export type ValidateExportInput = z.infer<typeof validateExportInputSchema>;

export const qualityGateArtifactInputSchema = z.object({
  type: artifactTypeSchema.describe("Artifact type for the quality gate pass."),
  content: z
    .string()
    .min(1)
    .max(1_000_000)
    .describe("Artifact content to gate with analyze -> (optional patch merge) -> validate pipeline."),
  contextDocuments: z
    .array(mcpContextDocumentSchema)
    .max(20)
    .optional()
    .describe("Optional context documents used during analysis."),
  targetScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .describe("Quality threshold used to determine pass/fail. Patch merge runs only when candidateContent is provided."),
  applyPatchWhenBelowTarget: z
    .boolean()
    .optional()
    .describe("Whether to apply patch generation when score is below target."),
  candidateContent: z
    .string()
    .optional()
    .describe(
      "Optional client-generated improved content. When provided and score is below target, suggest_patch can derive a selective merged output.",
    ),
  selectedSegmentIndexes: z
    .array(z.number().int().min(0))
    .optional()
    .describe("Optional diff segment selection for patch output."),
  analysisEnabled: z.boolean().optional().describe("Enable enhanced analyzer mode."),
});

export type QualityGateArtifactInput = z.infer<typeof qualityGateArtifactInputSchema>;

export const analyzeWorkspaceArtifactsInputSchema = z.object({
  rootPath: z
    .string()
    .optional()
    .describe("Workspace root path. Defaults to current working directory."),
  maxFiles: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Maximum number of candidate artifact files to analyze."),
  includePatterns: z
    .array(z.string().min(1).max(120))
    .max(20)
    .optional()
    .describe("Optional filename/path regex hints to include."),
  analysisEnabled: z.boolean().optional().describe("Enable enhanced analyzer mode."),
});

export type AnalyzeWorkspaceArtifactsInput = z.infer<typeof analyzeWorkspaceArtifactsInputSchema>;
