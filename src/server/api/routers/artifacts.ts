import { TRPCError } from "@trpc/server";
import { desc } from "drizzle-orm";

import { artifactSubmissionSchema } from "@/lib/artifacts";
import { artifacts } from "@/server/db/schema";
import { db } from "@/server/db";
import { validateMarkdownOrYaml } from "@/server/security/export-validation";
import { checkRateLimit } from "@/server/security/rate-limit";
import { sanitizeUserInput } from "@/server/security/sanitize";
import { buildJudgeAnalysis } from "@/server/services/artifact-analyzer";
import { runJudgePipeline } from "@/server/services/judge-pipeline";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

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
    const analysisEnabled = process.env.ANALYSIS_V2_ENABLED !== "false";
    const analysisMode = analysisEnabled ? "v2" : "v1";

    const judged = await runJudgePipeline({
      type: input.type,
      content: sanitized.sanitizedContent,
    });

    const exportValidation = validateMarkdownOrYaml(judged.result.refinedContent);
    const analysis = analysisEnabled
      ? buildJudgeAnalysis({
          type: input.type,
          content: sanitized.sanitizedContent,
          dimensions: judged.result.dimensions,
        })
      : null;

    const warnings = [...sanitized.warnings, ...judged.result.warnings];

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
      `[JudgeMetrics] mode=${analysisMode} type=${input.type} provider=${judged.provider} score=${judged.result.score} missing=${missingCount} blocking=${blockingCount} durationMs=${durationMs}`,
    );

    return {
      artifactId: inserted[0]?.id ?? null,
      provider: judged.provider,
      analysisMode,
      remainingRequests: limit.remaining,
      result: {
        ...judged.result,
        refinedContent,
        warnings,
        analysis: analysis ?? undefined,
      },
    };
  }),
});
