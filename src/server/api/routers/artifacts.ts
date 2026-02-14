import { TRPCError } from "@trpc/server";
import { desc } from "drizzle-orm";

import { artifactSubmissionSchema } from "@/lib/artifacts";
import { artifacts } from "@/server/db/schema";
import { db } from "@/server/db";
import { checkRateLimit } from "@/server/security/rate-limit";
import { analyzeArtifactCore } from "@/server/services/analyze-artifact-core";
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

    const analyzed = await analyzeArtifactCore({
      type: input.type,
      content: input.content,
      contextDocuments: input.contextDocuments,
    });
    const analysis = analyzed.result.analysis;

    const inserted = await db
      .insert(artifacts)
      .values({
        type: input.type,
        originalContent: analyzed.sanitizedContent,
        refinedContent: analyzed.result.refinedContent,
        analysisJson: analysis ? JSON.stringify(analysis) : null,
        score: analyzed.result.score,
        userId: input.userId ?? null,
      })
      .returning({ id: artifacts.id });

    const durationMs = Date.now() - startedAt;
    const missingCount = analysis?.missingItems.length ?? 0;
    const blockingCount =
      analysis?.missingItems.filter((item) => item.severity === "blocking").length ?? 0;

    console.info(
      `[JudgeMetrics] mode=${analyzed.analysisMode} type=${input.type} requestedProvider=${analyzed.requestedProvider} provider=${analyzed.provider} fallbackUsed=${analyzed.fallbackUsed} fallbackReason=${analyzed.fallbackReason ?? "none"} confidence=${analyzed.confidence} score=${analyzed.result.score} missing=${missingCount} blocking=${blockingCount} durationMs=${durationMs}`,
    );

    return {
      artifactId: inserted[0]?.id ?? null,
      requestedProvider: analyzed.requestedProvider,
      provider: analyzed.provider,
      fallbackUsed: analyzed.fallbackUsed,
      fallbackReason: analyzed.fallbackReason,
      confidence: analyzed.confidence,
      analysisMode: analyzed.analysisMode,
      durationMs,
      remainingRequests: limit.remaining,
      warnings: analyzed.warnings,
      contextSummary: analyzed.contextSummary,
      result: analyzed.result,
    };
  }),
});
