# Agent Lint

Static analysis & quality scoring for AI coding agent context artifacts.

**Zero dependencies on LLMs.** Fully deterministic. Local-first.

## What It Does

Agent Lint evaluates and improves AI-agent context artifacts:

- `AGENTS.md` / `CLAUDE.md`
- Skills
- Rules
- Workflows
- Plans

It provides reproducible quality scoring across **12 metrics**, evidence-backed assessment, guardrail checks, and repeatable improvement loops.

## Quick Start

### MCP Server (for Cursor, Claude Desktop, VS Code, Windsurf)

```bash
npx -y @agent-lint/mcp
```

### CLI

```bash
npx @agent-lint/cli analyze AGENTS.md
npx @agent-lint/cli scan .
npx @agent-lint/cli score --type agents --file AGENTS.md --json
```

## MCP Client Configuration

### Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "agent-lint": {
      "command": "npx",
      "args": ["-y", "@agent-lint/mcp"]
    }
  }
}
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "agent-lint": {
      "command": "npx",
      "args": ["-y", "@agent-lint/mcp"]
    }
  }
}
```

## Packages

| Package | Description | Public |
|---------|-------------|--------|
| `@agent-lint/shared` | Common types, parser, conventions | No (internal) |
| `@agent-lint/core` | Deterministic analysis engine + rules | No (internal) |
| `@agent-lint/mcp` | MCP server (stdio transport) | **Yes** |
| `@agent-lint/cli` | CLI interface | **Yes** |

## MCP Tools

| Tool | Description |
|------|-------------|
| `analyze_artifact` | Single artifact analysis |
| `analyze_workspace_artifacts` | Workspace scanning |
| `analyze_context_bundle` | Multi-artifact consistency analysis |
| `prepare_artifact_fix_context` | Fix loop context |
| `submit_client_assessment` | Submit client LLM assessment |
| `quality_gate_artifact` | Quality gate (target score check) |
| `suggest_patch` | Patch suggestion |
| `validate_export` | Final output validation |

## Quality Metrics (12)

`clarity`, `specificity`, `scope-control`, `completeness`, `actionability`, `verifiability`, `safety`, `injection-resistance`, `secret-hygiene`, `token-efficiency`, `platform-fit`, `maintainability`

## Development

```bash
pnpm install
pnpm run typecheck      # tsc --build
pnpm run test           # vitest
pnpm run mcp:stdio      # Run MCP server locally
pnpm run mcp:inspector  # MCP Inspector
```

## License

MIT
