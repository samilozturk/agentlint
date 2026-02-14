import { TRPCError } from "@trpc/server";
import { desc } from "drizzle-orm";

import type { ContextDocumentInput } from "@/lib/artifacts";
import { artifactSubmissionSchema } from "@/lib/artifacts";
import { artifacts } from "@/server/db/schema";
import { db } from "@/server/db";
import { validateMarkdownOrYaml } from "@/server/security/export-validation";
import { checkRateLimit } from "@/server/security/rate-limit";
import { sanitizeUserInput } from "@/server/security/sanitize";
import { buildJudgeAnalysis } from "@/server/services/artifact-analyzer";
import { runJudgePipeline } from "@/server/services/judge-pipeline";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const CONTEXT_BUNDLE_CHAR_BUDGET = Number(process.env.CONTEXT_BUNDLE_CHAR_BUDGET ?? 120_000);

type ContextBundleResult = {
  mergedContent: string;
  summary: {
    provided: number;
    included: number;
    truncated: number;
    mergedChars: number;
  };
  warnings: string[];
};

function buildContextBundle(input: {
  primaryContent: string;
  contextDocuments: ContextDocumentInput[];
}): ContextBundleResult {
  const warnings: string[] = [];
  const deduped = new Set<string>();
  const sortedDocuments = [...input.contextDocuments].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
  );

  const sections: string[] = [
    "# Primary Artifact",
    input.primaryContent,
  ];

  let consumedChars = sections.join("\n\n").length;
  let included = 0;
  let truncated = 0;

  for (let index = 0; index < sortedDocuments.length; index++) {
    const doc = sortedDocuments[index];
    const normalized = doc.content.trim();

    if (!normalized) {
      continue;
    }

    if (deduped.has(normalized)) {
      continue;
    }

    deduped.add(normalized);

    const titleBits = [doc.label.trim()];
    if (doc.path) {
      titleBits.push(doc.path.trim());
    }
    if (doc.type) {
      titleBits.push(doc.type);
    }

    const block = [
      `## Context Document ${included + 1}: ${titleBits.join(" | ")}`,
      normalized,
    ].join("\n");

    const candidateSize = consumedChars + block.length + 2;
    if (candidateSize > CONTEXT_BUNDLE_CHAR_BUDGET) {
      truncated += 1;
      continue;
    }

    sections.push(block);
    consumedChars = candidateSize;
    included += 1;
  }

  if (truncated > 0) {
    warnings.push(`Context bundle truncated: ${truncated} document(s) excluded by size budget.`);
  }

  return {
    mergedContent: sections.join("\n\n"),
    summary: {
      provided: input.contextDocuments.length,
      included,
      truncated,
      mergedChars: consumedChars,
    },
    warnings,
  };
}

export const artifactsRouter = createTRPCRouter({
  listRecent: publicProcedure.query(async () => {
    return db.select().from(artifacts).orderBy(desc(artifacts.id)).limit(20);
  }),

  analyze: publicProcedure.input(artifactSubmissionSchema).mutation(async ({ ctx, input }) => {
    const startedAt = Date.now();
    const limit = checkRateLimit(
      `judge:${ctx.ip}`,
      Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 30),
      Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
    );

    if (!limit.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Retry in ${Math.ceil(limit.retryAfterMs / 1000)}s.`,
      });
    }

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

    const analysisEnabled = process.env.ANALYSIS_V2_ENABLED !== "false";
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

    const inserted = await db
      .insert(artifacts)
      .values({
        type: input.type,
        originalContent: sanitized.sanitizedContent,
        refinedContent,
        analysisJson: analysis ? JSON.stringify(analysis) : null,
        score: judged.result.score,
        userId: input.userId ?? null,
      })
      .returning({ id: artifacts.id });

    const durationMs = Date.now() - startedAt;
    const missingCount = analysis?.missingItems.length ?? 0;
    const blockingCount =
      analysis?.missingItems.filter((item) => item.severity === "blocking").length ?? 0;

    console.info(
      `[JudgeMetrics] mode=${analysisMode} type=${input.type} requestedProvider=${judged.requestedProvider} provider=${judged.provider} fallbackUsed=${judged.fallbackUsed} fallbackReason=${judged.fallbackReason ?? "none"} confidence=${judged.confidence} score=${judged.result.score} missing=${missingCount} blocking=${blockingCount} durationMs=${durationMs}`,
    );

    return {
      artifactId: inserted[0]?.id ?? null,
      requestedProvider: judged.requestedProvider,
      provider: judged.provider,
      fallbackUsed: judged.fallbackUsed,
      fallbackReason: judged.fallbackReason,
      confidence: judged.confidence,
      analysisMode,
      durationMs,
      remainingRequests: limit.remaining,
      warnings,
      contextSummary: contextBundle.summary,
      result: {
        ...judged.result,
        refinedContent,
        warnings,
        analysis: analysis ?? undefined,
      },
    };
  }),
});
