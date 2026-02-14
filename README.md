# Agent Lint

Agent Lint evaluates and improves AI coding agent context artifacts:

- skills
- AGENTS.md / CLAUDE.md
- rules
- workflows
- plans

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4 + shadcn/ui
- tRPC + React Query
- Drizzle ORM + SQLite
- MCP server + CLI tooling

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure env vars:

```bash
cp .env.example .env
```

3. Start web app:

```bash
npm run dev
```

## Scripts

- `npm run dev` - start Next.js app
- `npm run lint` - run ESLint
- `npm run test` - run Vitest unit/integration tests
- `npm run test:e2e` - run Playwright tests
- `npm run build` - production build
- `npm run cli` - Agent Lint CLI entrypoint
- `npm run mcp:stdio` - local MCP stdio server
- `npm run mcp:http` - Streamable HTTP MCP server
- `npm run mcp:inspector` - launch MCP inspector against stdio server

## CLI

Examples:

```bash
npm run cli -- analyze --type agents --file AGENTS.md --json
npm run cli -- fix --type rules --file docs/rules.md
npm run cli -- score --type workflows --content "# Workflow\n\n1. Run lint" --json
```

## MCP Server

### Local stdio

Run:

```bash
npm run mcp:stdio
```

Use this in local desktop/IDE integrations that spawn a process (Claude Desktop, Cursor, etc).

### Remote streamable HTTP

Run:

```bash
npm run mcp:http
```

Default endpoint: `http://127.0.0.1:3333/mcp`

Health endpoints:

- `GET /healthz`
- `GET /readyz`

OAuth metadata endpoints:

- `GET /.well-known/oauth-protected-resource`
- `GET /.well-known/oauth-authorization-server` (enabled when OAuth env vars are set)

### Remote auth model (beta)

- Bearer token auth is enabled by default (`MCP_REQUIRE_AUTH=true`)
- Configure tokens with scope mappings via `MCP_BEARER_TOKENS`
- Example:

```env
MCP_BEARER_TOKENS=friend1=my-token-1:*;friend2=my-token-2:analyze,validate
```

## Public Deployment

Use `Dockerfile.mcp` for remote deployment. Minimum required env vars:

- `MCP_REQUIRE_AUTH=true`
- `MCP_BEARER_TOKENS=...`
- `MCP_PUBLIC_BASE_URL=https://your-domain.example.com`

Optional MCP registry metadata template is provided at `server.json`.

See `docs/mcp_remote_runbook.md` for a complete go-live checklist.
