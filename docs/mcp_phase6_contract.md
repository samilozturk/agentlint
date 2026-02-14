# Faz 6 MCP + CLI Contract

Bu dokuman Faz 6 icin teknik kontrati kilitler.

## Scope

- Iki transport ayni kod tabaninda:
  - local: `stdio`
  - remote: `streamable-http`
- MCP tools:
  - `analyze_artifact`
  - `analyze_context_bundle`
  - `suggest_patch`
  - `validate_export`
- CLI komutlari:
  - `analyze`
  - `fix`
  - `score`

## Runtime Design

- MCP server factory: `src/mcp/core/create-server.ts`
- Tool wrappers: `src/mcp/tools/*.ts`
- Local stdio entrypoint: `src/mcp/stdio.ts`
- Remote HTTP entrypoint: `src/mcp/http/server.ts`

## Shared Business Logic

Duplicate logic engeli icin ortak analiz akisi:

- `src/server/services/analyze-artifact-core.ts`
- `src/server/services/context-bundle.ts`

Hem tRPC router hem MCP tool hem CLI ayni analiz cekirdegini kullanir.

## Remote Security Baseline

- Bearer auth middleware (`MCP_REQUIRE_AUTH=true` varsayilan)
- Tool scope enforcement (`analyze`, `validate`, `patch`)
- Token/IP rate limit
- Request body limit
- Timeout guard
- Max concurrent request guard
- Session TTL + periodic cleanup
- DNS rebinding guard (`createMcpExpressApp`)

## OAuth Migration Path

Beta auth aktifken, production OAuth gecisi icin metadata endpointleri eklendi:

- `/.well-known/oauth-protected-resource`
- `/.well-known/oauth-authorization-server`

Gerekli issuer/token endpoint env degiskenleri eklendiginde metadata endpointi aktif olur.

## Tests

- `tests/integration/mcp-stdio.test.ts`
- `tests/integration/mcp-http.test.ts`
- `tests/integration/mcp-auth.test.ts`
- `tests/integration/cli-smoke.test.ts`

## Operational Scripts

- `npm run mcp:stdio`
- `npm run mcp:http`
- `npm run mcp:inspector`
- `npm run cli -- <command>`
