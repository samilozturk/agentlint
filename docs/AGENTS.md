# Docs Maintenance Guide

Use this guide when updating MCP-facing documentation.

## Keep in sync

- `README.md`
- `AGENTS.md` (repo root)
- `docs/mcp_client_conventions.md`
- `docs/mcp_remote_runbook.md`
- `docs/mcp_phase6_contract.md`
- `docs/agent_execution_backlog.md`
- `docs/phased_implementation_plan.md`

## Required MCP wording

- State that scoring is client-led weighted scoring.
- State that server guardrail weight is low and hard-fail checks still apply.
- State required fix flow:
  1. `prepare_artifact_fix_context`
  2. `submit_client_assessment`
  3. `quality_gate_artifact`
  4. `validate_export`

## Changelog rule

When tool contracts, scoring formulas, or required flow changes, add a changelog entry under `changelog/`.
