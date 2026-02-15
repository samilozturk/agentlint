# Agent Lint - Project Context

## Purpose
Agent Lint evaluates and improves AI coding agent context artifacts:
- Skills
- AGENTS.md / CLAUDE.md
- Rules
- Workflows
- Plans

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS v4 + Shadcn UI
- tRPC + React Query
- Drizzle ORM + SQLite (libSQL compatible)

## Rules
- Prefer server components; use client components only for interactivity.
- Keep strict typing; no `any`.
- Use Drizzle for all data access.
- Route all mutations through tRPC procedures.
- Never auto-execute destructive commands.

## Judge Pipeline
Web/API path:
1. Sanitize user input.
2. Select artifact-specific system prompt.
3. Run model provider (OpenAI/Anthropic) or fallback Mock Judge.
4. Validate export format (markdown/yaml safety checks).
5. Store original/refined content and score.

MCP path (LLM-free):
1. Sanitize user input.
2. Expose client-led scoring policy (metrics + weights + evidence schema) and artifact guidance resources.
3. Start fix loops with `prepare_artifact_fix_context`, then let MCP client LLM scan repository and produce evidence-backed scores.
4. Run `submit_client_assessment`, then low-weight server guardrails (safety/export/checklist) with hybrid final score.
5. Iterate rewrite -> `quality_gate_artifact` (clientAssessment required by default) until target score and guardrails pass.

## Environment
See `.env.example` for required variables.

## Roadmap Execution
- Follow roadmap docs in this order:
  1. `docs/roadmap_master.md`
  2. `docs/engineering_guardrails.md`
  3. `docs/phased_implementation_plan.md`
  4. `docs/agent_execution_backlog.md`
- Implement phases sequentially and run tests after each phase boundary.
- Keep this file and roadmap docs aligned when execution priorities change.
- Current execution snapshot is tracked in `docs/agent_execution_backlog.md`.
- Current status: roadmap implementation is complete through Faz 6 (MCP + CLI), with MCP path in client-led weighted scoring mode and remote stateless compatibility hardened.
