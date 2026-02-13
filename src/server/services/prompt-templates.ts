import type { ArtifactType } from "@/lib/artifacts";

const baseGuidelines = [
  "Use progressive disclosure and keep context minimal.",
  "Block dangerous command execution without explicit user approval.",
  "Favor deterministic, testable instructions over vague guidance.",
  "Optimize for token efficiency without losing critical constraints.",
  "Return strict JSON only with keys: score, dimensions, rationale, warnings, refinedContent.",
].join(" ");

export const judgeSystemPrompts: Record<ArtifactType, string> = {
  skills: `${baseGuidelines} Review SKILL.md for required frontmatter (name/description), invocation clarity, side-effect gating, verification commands, and output evidence format. Penalize vague triggers and unsafe auto-execution.`,
  agents: `${baseGuidelines} Review AGENTS.md/CLAUDE.md for minimal operational guidance only: quick commands, constraints, verification loop, and safety boundaries. Penalize README duplication and oversized context blocks.`,
  rules: `${baseGuidelines} Review rules docs for scope + activation definition, do/dont clarity, verification commands, and explicit prompt-injection guardrails. Penalize broad or ambiguous rules.`,
  workflows: `${baseGuidelines} Review slash commands/workflows for preconditions, ordered steps, failure handling, evidence output, and destructive-action confirmation gates. Penalize non-deterministic instructions.`,
  plans: `${baseGuidelines} Review plans for phased structure, risks/dependencies, checklists, acceptance criteria, and measurable verification commands. Penalize shallow or non-testable plans.`,
};
