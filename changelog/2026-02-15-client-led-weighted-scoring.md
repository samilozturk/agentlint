## 2026-02-15 - MCP client-led weighted scoring rollout

### Delivered
- Added client-led scoring policy contract with artifact-specific metric weights.
- Added new MCP tool: `prepare_artifact_fix_context` to force policy visibility at fix start.
- Added new MCP tool: `submit_client_assessment`.
- Extended `quality_gate_artifact`:
  - accepts `clientAssessment`,
  - computes hybrid final score,
  - returns iteration metadata (`iterationIndex`, `delta`, `remainingGaps`),
  - emits next-best-action directives.
  - enforces `clientAssessment` by default (`requireClientAssessment=true`) with explicit enforcement status.

### New resources
- `agentlint://scoring-policy/<type>`
- `agentlint://assessment-schema/<type>`
- `agentlint://improvement-playbook/<type>`

### Scoring model
- Primary authority: client weighted score (90%).
- Secondary influence: server guardrail score (10%).
- Hard-fail still applies for export invalidity and critical safety signals.

### Validation
- Added unit tests for policy weights and hybrid scoring evaluation.
- Expanded MCP stdio/http/auth integration tests for prepare/submit/gate enforcement and score breakdown outputs.
