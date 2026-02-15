import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { applySelectedSegments, buildDiffSegments } from "@/lib/selective-diff";

import { suggestPatchInputSchema, type SuggestPatchInput } from "../types";
import { toToolResult } from "./tool-result";

export type SuggestPatchToolOutput = {
  suggestedContent: string;
  segmentCount: number;
  selectedSegmentIndexes: number[];
  addedLines: number;
  removedLines: number;
  segments: Array<{
    index: number;
    kind: "added" | "removed" | "unchanged";
    count: number;
  }>;
};

export function executeSuggestPatchTool(input: SuggestPatchInput): SuggestPatchToolOutput {
  const segments = buildDiffSegments(input.originalContent, input.refinedContent);
  const defaultSelection = segments
    .filter((segment) => segment.kind !== "unchanged")
    .map((segment) => segment.index);
  const selectedSegmentIndexes = input.selectedSegmentIndexes ?? defaultSelection;
  const selectedSet = new Set<number>(selectedSegmentIndexes);

  const suggestedContent = applySelectedSegments({
    original: input.originalContent,
    refined: input.refinedContent,
    selectedSegmentIndexes: selectedSet,
  });

  const addedLines = segments
    .filter((segment) => segment.kind === "added")
    .reduce((sum, segment) => sum + segment.count, 0);
  const removedLines = segments
    .filter((segment) => segment.kind === "removed")
    .reduce((sum, segment) => sum + segment.count, 0);

  return {
    suggestedContent,
    segmentCount: segments.length,
    selectedSegmentIndexes: [...selectedSet].sort((a, b) => a - b),
    addedLines,
    removedLines,
    segments: segments.map((segment) => ({
      index: segment.index,
      kind: segment.kind,
      count: segment.count,
    })),
  };
}

export function registerSuggestPatchTool(server: McpServer): void {
  server.registerTool(
    "suggest_patch",
    {
      title: "Suggest Patch",
      description:
        "Use when analyze results need a concrete edit plan. Builds selective patch output from original and refined content.",
      inputSchema: suggestPatchInputSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        destructiveHint: false,
      },
    },
    async (args) => {
      try {
        const output = executeSuggestPatchTool(args);
        return toToolResult({
          summary: `segments=${output.segmentCount} selected=${output.selectedSegmentIndexes.length} added=${output.addedLines} removed=${output.removedLines}`,
          structuredContent: output,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return toToolResult({
          summary: `suggest_patch failed: ${message}`,
          structuredContent: { error: message },
          isError: true,
        });
      }
    },
  );
}
