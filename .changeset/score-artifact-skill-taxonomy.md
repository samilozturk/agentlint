---
"@agent-lint/cli": minor
"@agent-lint/mcp": minor
---

Add `score` command, `agentlint_score_artifact` MCP tool, and 9-category skill linting taxonomy.

**`agent-lint score <file>`** scores any context artifact against 12 quality dimensions using pure static analysis. Artifact type is auto-detected from the filename or set with `--type agents|skills|rules|workflows|plans`. Prints a per-dimension score with targeted improvement suggestions. Useful in autoresearch loops: score, improve, compare, keep or revert.

**`agentlint_score_artifact`** is the MCP-native equivalent, accepting artifact content and type directly. Runs with a 30-second timeout and is read-only.

**Skill linting** now uses a 9-category taxonomy with Claude Code best practices, delivering richer and more targeted improvement suggestions across all skill quality dimensions.
