## 2026-02-15 - MCP enforced client-led flow and AGENTS guides

### Delivered
- Enforced client-led fix flow with strict quality gate behavior:
  - `quality_gate_artifact` requires `clientAssessment` by default.
  - Missing assessment now returns explicit enforcement status and violation code.
- Added `prepare_artifact_fix_context` as the mandatory first tool for fix/update workflows.
- Expanded scoring transparency outputs:
  - policy snapshot,
  - metric breakdown,
  - final score formula breakdown,
  - required flow hints.

### New AGENTS.md guides
- `src/mcp/AGENTS.md`
- `src/mcp/tools/AGENTS.md`
- `docs/AGENTS.md`

### Documentation sync
- Updated MCP docs and root AGENTS/README to reflect enforced flow:
  1. `prepare_artifact_fix_context`
  2. `submit_client_assessment`
  3. `quality_gate_artifact`
  4. `validate_export`

### Validation
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
