import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { artifactTypeSchema } from "@/lib/artifacts";
import { getPromptPack } from "@/server/services/prompt-pack";
import { judgeSystemPrompts } from "@/server/services/prompt-templates";

export function registerAgentLintPrompts(server: McpServer): void {
  server.registerPrompt(
    "artifact_create_prompt",
    {
      title: "Artifact Create Prompt",
      description:
        "Guided prompt to create AGENTS/skills/rules/workflows/plans content with Agent Lint quality criteria.",
      argsSchema: {
        type: artifactTypeSchema,
        projectContext: z
          .string()
          .optional()
          .describe("Optional project context summary (stack, constraints, architecture)."),
      },
    },
    ({ type, projectContext }) => {
      const pack = getPromptPack(type);
      const rubric = judgeSystemPrompts[type];

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: [
                `Create a ${type} artifact for this repository.`,
                projectContext ? `Project context: ${projectContext}` : "",
                "",
                `Prompt pack title: ${pack.title}`,
                `Prompt pack summary: ${pack.summary}`,
                "",
                "Prompt pack body:",
                pack.prompt,
                "",
                "Judge rubric:",
                rubric,
                "",
                "Use concise, actionable content and include explicit verification and safety gates.",
              ]
                .filter(Boolean)
                .join("\n"),
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "artifact_review_prompt",
    {
      title: "Artifact Review Prompt",
      description:
        "Prompt for reviewing existing artifact content and enforcing Agent Lint quality standards.",
      argsSchema: {
        type: artifactTypeSchema,
        content: z.string().min(1),
      },
    },
    ({ type, content }) => {
      const rubric = judgeSystemPrompts[type];

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: [
                `Review this ${type} artifact for quality and safety.`,
                "If MCP tools are available, prefer this order:",
                "1) quality_gate_artifact",
                "2) analyze_artifact (if extra diagnostics needed)",
                "3) validate_export before final response",
                "",
                "Review rubric:",
                rubric,
                "",
                "Artifact content:",
                content,
              ].join("\n"),
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "artifact_fix_prompt",
    {
      title: "Artifact Fix Prompt",
      description:
        "Prompt for fixing low-scoring artifact content using Agent Lint quality metrics and patch flow.",
      argsSchema: {
        type: artifactTypeSchema,
        originalContent: z.string().min(1),
        score: z.number().int().min(0).max(100).optional(),
        warnings: z.array(z.string()).max(50).optional(),
      },
    },
    ({ type, originalContent, score, warnings }) => {
      const rubric = judgeSystemPrompts[type];
      const warningBlock = warnings && warnings.length > 0 ? warnings.map((item) => `- ${item}`).join("\n") : "- none";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: [
                `Improve this ${type} artifact to meet quality requirements.`,
                typeof score === "number" ? `Current score: ${score}` : "Current score: unknown",
                "Warnings:",
                warningBlock,
                "",
                "Repair flow:",
                "1) Run quality_gate_artifact to inspect score and warnings.",
                "2) Revise content in your editor/client LLM; pass it as candidateContent to quality_gate_artifact for merged output.",
                "3) Use suggest_patch when fine-grained segment selection is needed.",
                "4) Run validate_export before returning final content.",
                "",
                "Quality rubric:",
                rubric,
                "",
                "Original content:",
                originalContent,
              ].join("\n"),
            },
          },
        ],
      };
    },
  );
}
