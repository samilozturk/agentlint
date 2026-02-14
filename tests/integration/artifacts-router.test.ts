import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { JudgeResult } from "@/lib/judge";

const mockJudgeResult: JudgeResult = {
  score: 82,
  dimensions: { clarity: 85, safety: 90, tokenEfficiency: 75, completeness: 78 },
  rationale: "Well-structured artifact.",
  warnings: [],
  refinedContent: "# Refined Artifact\n\nCleaner version.",
};

vi.mock("@/server/services/judge-pipeline", () => ({
  runJudgePipeline: vi.fn(() =>
    Promise.resolve({
      requestedProvider: "mock" as const,
      provider: "mock" as const,
      systemPrompt: "test prompt",
      fallbackUsed: false,
      fallbackReason: null,
      confidence: 55,
      result: { ...mockJudgeResult },
    }),
  ),
}));

vi.mock("@/server/db", () => {
  const rows: Array<Record<string, unknown>> = [];
  let nextId = 1;

  return {
    db: {
      select: () => ({
        from: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve(rows.slice().reverse().slice(0, 20)),
          }),
        }),
      }),
      insert: () => ({
        values: (val: Record<string, unknown>) => {
          const id = nextId++;
          rows.push({ id, ...val });
          return {
            returning: () => Promise.resolve([{ id }]),
          };
        },
      }),
    },
  };
});

vi.mock("@/server/security/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/security/rate-limit")>();
  return { ...actual };
});

import { runJudgePipeline } from "@/server/services/judge-pipeline";
import { artifactsRouter } from "@/server/api/routers/artifacts";
import {
  createTRPCContext,
  createTRPCRouter,
  createCallerFactory,
} from "@/server/api/trpc";

const mockedPipeline = vi.mocked(runJudgePipeline);

const appRouter = createTRPCRouter({ artifacts: artifactsRouter });
const callerFactory = createCallerFactory(appRouter);

async function createCaller() {
  const ctx = await createTRPCContext({
    headers: new Headers({ "x-forwarded-for": "test-ip-" + Math.random() }),
  });
  return callerFactory(ctx);
}

describe("artifactsRouter.analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RATE_LIMIT_MAX_REQUESTS", "100");
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "60000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns artifactId, score, refinedContent, and provider for valid input", async () => {
    const caller = await createCaller();
    const result = await caller.artifacts.analyze({
      type: "agents",
      content: "# AGENTS.md\n\nSome content here.",
    });

    expect(result.artifactId).toBeTypeOf("number");
    expect(result.provider).toBe("mock");
    expect(result.result.score).toBe(82);
    expect(result.result.refinedContent).toContain("Refined Artifact");
    expect(result.result.analysis).toBeTruthy();
    expect(result.result.analysis?.checklist.length).toBeGreaterThan(0);
  });

  it("sanitizes input with script tags and includes warning", async () => {
    mockedPipeline.mockResolvedValueOnce({
      requestedProvider: "mock",
      provider: "mock",
      systemPrompt: "test",
      fallbackUsed: false,
      fallbackReason: null,
      confidence: 55,
      result: {
        ...mockJudgeResult,
        warnings: [],
      },
    });

    const caller = await createCaller();
    const result = await caller.artifacts.analyze({
      type: "agents",
      content: "<script>alert('xss')</script> # Safe content",
    });

    expect(result.result.warnings).toContainEqual(
      expect.stringContaining("Script tags"),
    );
  });

  it("includes export validation warning when refined content has unclosed fence", async () => {
    mockedPipeline.mockResolvedValueOnce({
      requestedProvider: "mock",
      provider: "mock",
      systemPrompt: "test",
      fallbackUsed: false,
      fallbackReason: null,
      confidence: 55,
      result: {
        ...mockJudgeResult,
        refinedContent: "```js\nunclosed code block",
      },
    });

    const caller = await createCaller();
    const result = await caller.artifacts.analyze({
      type: "agents",
      content: "# Valid input content",
    });

    expect(result.result.warnings).toContainEqual(
      expect.stringContaining("Export validation failed"),
    );
  });

  it("falls back to sanitized content when export validation fails", async () => {
    mockedPipeline.mockResolvedValueOnce({
      requestedProvider: "mock",
      provider: "mock",
      systemPrompt: "test",
      fallbackUsed: false,
      fallbackReason: null,
      confidence: 55,
      result: {
        ...mockJudgeResult,
        refinedContent: "```orphan fence",
      },
    });

    const caller = await createCaller();
    const result = await caller.artifacts.analyze({
      type: "agents",
      content: "# My content",
    });

    expect(result.result.refinedContent).toBe("# My content");
  });

  it("returns remaining requests count", async () => {
    const caller = await createCaller();
    const result = await caller.artifacts.analyze({
      type: "agents",
      content: "# Content",
    });

    expect(result.remainingRequests).toBeTypeOf("number");
    expect(result.remainingRequests).toBeGreaterThanOrEqual(0);
  });

  it("returns standardized telemetry metadata", async () => {
    const caller = await createCaller();
    const result = await caller.artifacts.analyze({
      type: "agents",
      content: "# Content",
    });

    expect(result.durationMs).toBeTypeOf("number");
    expect(result.warnings).toBeTruthy();
    expect(result.requestedProvider).toBe("mock");
    expect(result.fallbackUsed).toBe(false);
    expect(result.confidence).toBeTypeOf("number");
  });

  it("merges context documents into judge input", async () => {
    const caller = await createCaller();
    await caller.artifacts.analyze({
      type: "agents",
      content: "# Primary\n\nBase artifact",
      contextDocuments: [
        {
          label: "AGENTS.md",
          path: "AGENTS.md",
          content: "# Agent rules\n\nNever force push.",
          priority: 10,
        },
      ],
    });

    expect(mockedPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("Context Document 1"),
      }),
    );
  });
});

describe("artifactsRouter.listRecent", () => {
  it("returns an array", async () => {
    const caller = await createCaller();
    const result = await caller.artifacts.listRecent();
    expect(Array.isArray(result)).toBe(true);
  });
});
