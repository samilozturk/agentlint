# MCP Tools Guide

This directory contains MCP tool handlers used by coding-agent clients.

## Primary tools

- `prepare_artifact_fix_context`: mandatory first step for fix/update requests.
- `submit_client_assessment`: primary scoring authority input (metric scores + evidence).
- `quality_gate_artifact`: final gate using hybrid scoring and guardrails.
- `validate_export`: final hard guardrail for markdown/yaml safety.

## Advisory tools

- `analyze_artifact`: deterministic diagnostics only.
- `analyze_context_bundle`: cross-document diagnostics only.
- `suggest_patch`: segment-level patch helper.
- `analyze_workspace_artifacts`: local stdio discovery helper.

## Contract expectations

- For fix/update flows, `quality_gate_artifact` requires `clientAssessment` by default.
- Tool outputs must expose scoring transparency fields:
  - policy snapshot
  - metric breakdown
  - final score breakdown
  - enforcement status
