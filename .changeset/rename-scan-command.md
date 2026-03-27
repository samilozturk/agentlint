---
"@agent-lint/cli": minor
---

Rename the workspace scan command to `scan`.

**BREAKING CHANGE:** the workspace scan command is now `agent-lint scan`. All flags (`--stdout`, `--json`, `--save-report`) work the same way. The command scans the workspace for missing, incomplete, stale, conflicting, and weak context artifacts and generates a maintenance report.

Update scripts or CI pipelines to use `agent-lint scan`.
