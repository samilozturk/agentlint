import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { JudgeResult } from "@/lib/judge";

const mockJudgeResult: JudgeResult = {
  score: 85,
  dimensions: { clarity: 90, safety: 80, tokenEfficiency: 85, completeness: 85 },
  rationale: "Test rationale from provider.",
  warnings: [],
  refinedContent: "# Refined\n\nProvider-refined content.",
};

const mockFallbackResult: JudgeResult = {
  score: 78,
  dimensions: { clarity: 86, safety: 86, tokenEfficiency: 88, completeness: 82 },
  rationale: "Mock Judge evaluated structure, safety hints, and context size. Replace this engine with provider-backed LLM scoring in Phase 4.",
  warnings: [],
  refinedContent: "# Refined Artifact\n\n- Type: agents\n- Score Target: 78",
};

vi.mock("@/server/ai/judge-provider", () => ({
  runOpenAIJudge: vi.fn(),
  runAnthropicJudge: vi.fn(),
  runGeminiJudge: vi.fn(),
}));

vi.mock("@/server/services/mock-judge", () => ({
  runMockJudge: vi.fn(() => ({ ...mockFallbackResult })),
}));

import { runOpenAIJudge, runAnthropicJudge, runGeminiJudge } from "@/server/ai/judge-provider";
import { runMockJudge } from "@/server/services/mock-judge";
import { runJudgePipeline } from "@/server/services/judge-pipeline";

const mockedOpenAI = vi.mocked(runOpenAIJudge);
const mockedAnthropic = vi.mocked(runAnthropicJudge);
const mockedGemini = vi.mocked(runGeminiJudge);
const mockedMock = vi.mocked(runMockJudge);

const input = { type: "agents" as const, content: "# AGENTS.md\n\nTest content." };

describe("runJudgePipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses mock provider by default (no LLM_PROVIDER set)", async () => {
    vi.stubEnv("LLM_PROVIDER", "mock");
    const output = await runJudgePipeline(input);

    expect(output.provider).toBe("mock");
    expect(mockedMock).toHaveBeenCalledOnce();
    expect(mockedOpenAI).not.toHaveBeenCalled();
  });

  it("uses gemini provider when LLM_PROVIDER is unset", async () => {
    delete process.env.LLM_PROVIDER;
    mockedGemini.mockResolvedValueOnce(mockJudgeResult);
    const output = await runJudgePipeline(input);

    expect(output.provider).toBe("gemini");
    expect(mockedGemini).toHaveBeenCalledOnce();
  });

  it("routes to OpenAI when LLM_PROVIDER=openai and succeeds", async () => {
    vi.stubEnv("LLM_PROVIDER", "openai");
    mockedOpenAI.mockResolvedValueOnce(mockJudgeResult);

    const output = await runJudgePipeline(input);

    expect(output.provider).toBe("openai");
    expect(output.fallbackUsed).toBe(false);
    expect(output.result.score).toBe(85);
    expect(mockedOpenAI).toHaveBeenCalledOnce();
    expect(mockedMock).not.toHaveBeenCalled();
  });

  it("falls back to mock when OpenAI fails", async () => {
    vi.stubEnv("LLM_PROVIDER", "openai");
    mockedOpenAI.mockRejectedValueOnce(new Error("API key invalid"));

    const output = await runJudgePipeline(input);

    expect(output.provider).toBe("mock");
    expect(output.fallbackUsed).toBe(true);
    expect(output.fallbackReason).toBeTruthy();
    expect(output.result.warnings).toContainEqual(
      expect.stringContaining("OpenAI judge failed"),
    );
    expect(mockedMock).toHaveBeenCalledOnce();
  });

  it("routes to Anthropic when LLM_PROVIDER=anthropic and succeeds", async () => {
    vi.stubEnv("LLM_PROVIDER", "anthropic");
    mockedAnthropic.mockResolvedValueOnce(mockJudgeResult);

    const output = await runJudgePipeline(input);

    expect(output.provider).toBe("anthropic");
    expect(output.result.score).toBe(85);
    expect(mockedAnthropic).toHaveBeenCalledOnce();
  });

  it("falls back to mock when Anthropic fails", async () => {
    vi.stubEnv("LLM_PROVIDER", "anthropic");
    mockedAnthropic.mockRejectedValueOnce(new Error("Rate limited"));

    const output = await runJudgePipeline(input);

    expect(output.provider).toBe("mock");
    expect(output.fallbackUsed).toBe(true);
    expect(output.result.warnings).toContainEqual(
      expect.stringContaining("Anthropic judge failed"),
    );
  });

  it("routes to Gemini when LLM_PROVIDER=gemini and succeeds", async () => {
    vi.stubEnv("LLM_PROVIDER", "gemini");
    mockedGemini.mockResolvedValueOnce(mockJudgeResult);

    const output = await runJudgePipeline(input);

    expect(output.provider).toBe("gemini");
    expect(output.result.score).toBe(85);
    expect(mockedGemini).toHaveBeenCalledOnce();
  });

  it("falls back to mock when Gemini fails", async () => {
    vi.stubEnv("LLM_PROVIDER", "gemini");
    mockedGemini.mockRejectedValueOnce(new Error("Quota exceeded"));

    const output = await runJudgePipeline(input);

    expect(output.provider).toBe("mock");
    expect(output.fallbackUsed).toBe(true);
    expect(output.result.warnings).toContainEqual(
      expect.stringContaining("Gemini judge failed"),
    );
  });

  it("falls through to mock for unknown provider string", async () => {
    vi.stubEnv("LLM_PROVIDER", "unknown-provider");

    const output = await runJudgePipeline(input);

    expect(output.provider).toBe("mock");
    expect(output.fallbackReason).toBe("unknown_provider");
    expect(mockedMock).toHaveBeenCalledOnce();
    expect(mockedOpenAI).not.toHaveBeenCalled();
    expect(mockedAnthropic).not.toHaveBeenCalled();
    expect(mockedGemini).not.toHaveBeenCalled();
  });

  it("includes correct systemPrompt in output", async () => {
    vi.stubEnv("LLM_PROVIDER", "mock");
    const output = await runJudgePipeline(input);

    expect(output.systemPrompt).toContain("AGENTS.md");
    expect(output.systemPrompt).toContain("progressive disclosure");
  });

  it("passes correct systemPrompt to provider", async () => {
    vi.stubEnv("LLM_PROVIDER", "openai");
    mockedOpenAI.mockResolvedValueOnce(mockJudgeResult);

    await runJudgePipeline({ type: "skills", content: "# Skill" });

    expect(mockedOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining("frontmatter"),
      }),
    );
  });
});
