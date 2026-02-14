import type { ArtifactType } from "@/lib/artifacts";
import type { JudgeResult } from "@/lib/judge";
import {
  runAnthropicJudge,
  runGeminiJudge,
  runOpenAIJudge,
} from "@/server/ai/judge-provider";

import { runMockJudge } from "./mock-judge";
import { judgeSystemPrompts } from "./prompt-templates";

type JudgePipelineInput = {
  type: ArtifactType;
  content: string;
};

export type JudgeProviderName = "mock" | "openai" | "anthropic" | "gemini";
export type JudgeFallbackReason =
  | "none"
  | "quota"
  | "timeout"
  | "invalid_output"
  | "provider_unavailable"
  | "unknown_provider";

export type JudgePipelineOutput = {
  requestedProvider: JudgeProviderName;
  provider: JudgeProviderName;
  systemPrompt: string;
  fallbackUsed: boolean;
  fallbackReason: JudgeFallbackReason | null;
  confidence: number;
  result: JudgeResult;
};

const PROVIDER_TIMEOUT_MS = Number(process.env.JUDGE_PROVIDER_TIMEOUT_MS ?? 12_000);

async function withProviderTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${PROVIDER_TIMEOUT_MS}ms`));
    }, PROVIDER_TIMEOUT_MS);

    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function normalizeRequestedProvider(raw: string): JudgeProviderName {
  if (raw === "openai" || raw === "anthropic" || raw === "gemini" || raw === "mock") {
    return raw;
  }
  return "mock";
}

function classifyProviderError(error: unknown): JudgeFallbackReason {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("timed out")) {
    return "timeout";
  }
  if (message.includes("429") || message.includes("quota") || message.includes("rate limit")) {
    return "quota";
  }
  if (message.includes("parse") && message.includes("json")) {
    return "invalid_output";
  }

  return "provider_unavailable";
}

function buildFallbackOutput(input: {
  requestedProvider: JudgeProviderName;
  fallbackReason: JudgeFallbackReason;
  systemPrompt: string;
  judgeInput: JudgePipelineInput;
}): JudgePipelineOutput {
  const fallback = runMockJudge(input.judgeInput);
  const providerLabel =
    input.requestedProvider === "openai"
      ? "OpenAI"
      : input.requestedProvider === "anthropic"
        ? "Anthropic"
        : input.requestedProvider === "gemini"
          ? "Gemini"
          : "Mock";

  return {
    requestedProvider: input.requestedProvider,
    provider: "mock",
    systemPrompt: input.systemPrompt,
    fallbackUsed: true,
    fallbackReason: input.fallbackReason,
    confidence: 62,
    result: {
      ...fallback,
      warnings: [
        `${providerLabel} judge failed. Falling back to Mock Judge (${input.fallbackReason}).`,
        ...fallback.warnings,
      ],
    },
  };
}

export async function runJudgePipeline(
  input: JudgePipelineInput,
): Promise<JudgePipelineOutput> {
  const systemPrompt = judgeSystemPrompts[input.type];
  const rawProvider = (process.env.LLM_PROVIDER ?? "gemini").toLowerCase();
  const provider = normalizeRequestedProvider(rawProvider);

  console.info(
    `[JudgePipeline] type=${input.type} provider=${provider} contentChars=${input.content.length}`,
  );

  if (!["openai", "anthropic", "gemini", "mock"].includes(rawProvider)) {
    const fallback = runMockJudge(input);

    return {
      requestedProvider: provider,
      provider: "mock",
      systemPrompt,
      fallbackUsed: true,
      fallbackReason: "unknown_provider",
      confidence: 55,
      result: {
        ...fallback,
        warnings: [
          `Unknown LLM_PROVIDER '${rawProvider}'. Mock Judge used.`,
          ...fallback.warnings,
        ],
      },
    };
  }

  if (provider === "mock") {
    return {
      requestedProvider: "mock",
      provider: "mock",
      systemPrompt,
      fallbackUsed: false,
      fallbackReason: null,
      confidence: 55,
      result: runMockJudge(input),
    };
  }

  if (provider === "openai") {
    try {
      const result = await withProviderTimeout(
        runOpenAIJudge({
          type: input.type,
          content: input.content,
          systemPrompt,
        }),
        "OpenAI judge",
      );

      return {
        requestedProvider: "openai",
        provider: "openai",
        systemPrompt,
        fallbackUsed: false,
        fallbackReason: null,
        confidence: 88,
        result,
      };
    } catch (error) {
      console.error("OpenAI judge failed, falling back to mock", error);
      return buildFallbackOutput({
        requestedProvider: "openai",
        fallbackReason: classifyProviderError(error),
        systemPrompt,
        judgeInput: input,
      });
    }
  }

  if (provider === "anthropic") {
    try {
      const result = await withProviderTimeout(
        runAnthropicJudge({
          type: input.type,
          content: input.content,
          systemPrompt,
        }),
        "Anthropic judge",
      );

      return {
        requestedProvider: "anthropic",
        provider: "anthropic",
        systemPrompt,
        fallbackUsed: false,
        fallbackReason: null,
        confidence: 88,
        result,
      };
    } catch (error) {
      console.error("Anthropic judge failed, falling back to mock", error);
      return buildFallbackOutput({
        requestedProvider: "anthropic",
        fallbackReason: classifyProviderError(error),
        systemPrompt,
        judgeInput: input,
      });
    }
  }

  if (provider === "gemini") {
    try {
      const result = await withProviderTimeout(
        runGeminiJudge({
          type: input.type,
          content: input.content,
          systemPrompt,
        }),
        "Gemini judge",
      );

      return {
        requestedProvider: "gemini",
        provider: "gemini",
        systemPrompt,
        fallbackUsed: false,
        fallbackReason: null,
        confidence: 86,
        result,
      };
    } catch (error) {
      console.error("Gemini judge failed, falling back to mock", error);
      return buildFallbackOutput({
        requestedProvider: "gemini",
        fallbackReason: classifyProviderError(error),
        systemPrompt,
        judgeInput: input,
      });
    }
  }

  return {
    requestedProvider: "mock",
    provider: "mock",
    systemPrompt,
    fallbackUsed: true,
    fallbackReason: "unknown_provider",
    confidence: 55,
    result: runMockJudge(input),
  };
}
