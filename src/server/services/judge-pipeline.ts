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

type JudgeProviderName = "mock" | "openai" | "anthropic" | "gemini";

export type JudgePipelineOutput = {
  provider: JudgeProviderName;
  systemPrompt: string;
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

export async function runJudgePipeline(
  input: JudgePipelineInput,
): Promise<JudgePipelineOutput> {
  const systemPrompt = judgeSystemPrompts[input.type];
  const provider = (process.env.LLM_PROVIDER ?? "gemini").toLowerCase();

  console.info(
    `[JudgePipeline] type=${input.type} provider=${provider} contentChars=${input.content.length}`,
  );

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
        provider: "openai",
        systemPrompt,
        result,
      };
    } catch (error) {
      console.error("OpenAI judge failed, falling back to mock", error);
      const fallback = runMockJudge(input);

      return {
        provider: "mock",
        systemPrompt,
        result: {
          ...fallback,
          warnings: [
            "OpenAI judge failed. Falling back to Mock Judge.",
            ...fallback.warnings,
          ],
        },
      };
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
        provider: "anthropic",
        systemPrompt,
        result,
      };
    } catch (error) {
      console.error("Anthropic judge failed, falling back to mock", error);
      const fallback = runMockJudge(input);

      return {
        provider: "mock",
        systemPrompt,
        result: {
          ...fallback,
          warnings: [
            "Anthropic judge failed. Falling back to Mock Judge.",
            ...fallback.warnings,
          ],
        },
      };
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
        provider: "gemini",
        systemPrompt,
        result,
      };
    } catch (error) {
      console.error("Gemini judge failed, falling back to mock", error);
      const fallback = runMockJudge(input);

      return {
        provider: "mock",
        systemPrompt,
        result: {
          ...fallback,
          warnings: [
            "Gemini judge failed. Falling back to Mock Judge.",
            ...fallback.warnings,
          ],
        },
      };
    }
  }

  return {
    provider: "mock",
    systemPrompt,
    result: runMockJudge(input),
  };
}
