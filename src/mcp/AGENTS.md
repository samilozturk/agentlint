# MCP Contributor Guide

This folder implements the Agent Lint MCP server surface for stdio and HTTP transports.

## Core policy

- Client LLM is the primary worker for repository scan, scoring evidence, and artifact rewrite.
- Server enforces low-weight guardrails and export validation.
- Fix/update loops must follow client-led flow.

## Required fix flow

1. `prepare_artifact_fix_context`
2. read `agentlint://scoring-policy/{type}` and `agentlint://assessment-schema/{type}`
3. `submit_client_assessment`
4. `quality_gate_artifact` with `candidateContent` and `clientAssessment`
5. `validate_export`

## Transport notes

- HTTP mode should expose tools, prompts, and resources in `/readyz`.
- Workspace scanning is local-first; remote HTTP keeps it disabled unless explicitly enabled.
