## 2026-02-14 - Phase 6 MCP + CLI

### Delivered
- Added MCP server factory and tool registry for Agent Lint.
- Added local `stdio` MCP server entrypoint.
- Added remote `streamable-http` MCP server entrypoint with health/readiness routes.
- Added session store with TTL pruning and cleanup.
- Added bearer auth middleware with tool-scope enforcement and rate limiting.
- Added OAuth metadata endpoints for production auth migration path.
- Added CLI commands: `analyze`, `fix`, `score`.

### Tooling and contracts
- Implemented tools:
  - `analyze_artifact`
  - `analyze_context_bundle`
  - `suggest_patch`
  - `validate_export`
- Unified analysis logic via shared core service to avoid duplicate business logic.

### Tests
- Added integration tests:
  - `tests/integration/mcp-stdio.test.ts`
  - `tests/integration/mcp-http.test.ts`
  - `tests/integration/mcp-auth.test.ts`
  - `tests/integration/cli-smoke.test.ts`

### Ops and docs
- Added MCP env vars to `.env.example`.
- Added `Dockerfile.mcp` for remote deployment.
- Added `server.json` template for MCP registry remote metadata.
- Added docs:
  - `docs/mcp_phase6_contract.md`
  - `docs/mcp_remote_runbook.md`
