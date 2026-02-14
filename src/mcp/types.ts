import { z } from "zod";

import {
  artifactTypeSchema,
  contextDocumentSchema,
  type ContextDocumentInput,
} from "@/lib/artifacts";

export const MCP_TOOL_NAMES = [
  "analyze_artifact",
  "analyze_context_bundle",
  "suggest_patch",
  "validate_export",
] as const;

export type McpToolName = (typeof MCP_TOOL_NAMES)[number];

export const MCP_TOOL_SCOPE_REQUIREMENTS: Record<McpToolName, string> = {
  analyze_artifact: "analyze",
  analyze_context_bundle: "analyze",
  suggest_patch: "patch",
  validate_export: "validate",
};

export const mcpContextDocumentSchema = contextDocumentSchema;

export type McpContextDocument = ContextDocumentInput;

export const analyzeArtifactInputSchema = z.object({
  type: artifactTypeSchema,
  content: z.string().min(1).max(1_000_000),
  contextDocuments: z.array(mcpContextDocumentSchema).max(20).optional(),
  analysisEnabled: z.boolean().optional(),
});

export type AnalyzeArtifactInput = z.infer<typeof analyzeArtifactInputSchema>;

export const analyzeContextBundleInputSchema = z.object({
  type: artifactTypeSchema,
  content: z.string().min(1).max(1_000_000),
  contextDocuments: z.array(mcpContextDocumentSchema).min(1).max(20),
  analysisEnabled: z.boolean().optional(),
  includeMergedContentPreview: z.boolean().optional(),
});

export type AnalyzeContextBundleInput = z.infer<typeof analyzeContextBundleInputSchema>;

export const suggestPatchInputSchema = z.object({
  originalContent: z.string(),
  refinedContent: z.string(),
  selectedSegmentIndexes: z.array(z.number().int().min(0)).optional(),
});

export type SuggestPatchInput = z.infer<typeof suggestPatchInputSchema>;

export const validateExportInputSchema = z.object({
  content: z.string().min(1),
});

export type ValidateExportInput = z.infer<typeof validateExportInputSchema>;
