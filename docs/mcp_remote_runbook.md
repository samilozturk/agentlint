# MCP Remote Runbook

Bu runbook, Agent Lint MCP server'ini internetten erisilebilir sekilde yayinlamak icindir.

## 1) Preflight

- Domain ve TLS hazir
- Secrets manager veya guvenli env paneli hazir
- Production token politikasi hazir

## 2) Required Env Vars

Minimum:

```env
MCP_HTTP_HOST=0.0.0.0
MCP_HTTP_PORT=3333
MCP_PUBLIC_BASE_URL=https://your-domain.example.com
MCP_REQUIRE_AUTH=true
MCP_BEARER_TOKENS=friend1=token-1:*;friend2=token-2:analyze,validate
MCP_ENFORCE_TOOL_SCOPES=true
MCP_RATE_LIMIT_MAX_REQUESTS=120
MCP_RATE_LIMIT_WINDOW_MS=60000
MCP_MAX_BODY_BYTES=1000000
MCP_REQUEST_TIMEOUT_MS=30000
MCP_MAX_CONCURRENT_REQUESTS=64
MCP_SESSION_TTL_MS=1800000
MCP_SESSION_SWEEP_INTERVAL_MS=60000
```

Opsiyonel OAuth metadata:

```env
MCP_OAUTH_ISSUER=https://auth.example.com
MCP_OAUTH_AUTHORIZATION_ENDPOINT=https://auth.example.com/oauth/authorize
MCP_OAUTH_TOKEN_ENDPOINT=https://auth.example.com/oauth/token
MCP_OAUTH_JWKS_URI=https://auth.example.com/.well-known/jwks.json
MCP_SUPPORTED_SCOPES=analyze,validate,patch
```

## 3) Deploy

### Container

```bash
docker build -f Dockerfile.mcp -t agentlint-mcp:latest .
docker run --rm -p 3333:3333 --env-file .env agentlint-mcp:latest
```

### Process

```bash
npm run mcp:http
```

## 4) Post-Deploy Validation

- `GET /healthz` 200
- `GET /readyz` 200
- MCP initialize + listTools + callTool akisi basarili
- Unauthorized request 401 donuyor
- Scope ihlali 403 donuyor

## 5) Client Connector Example

Remote MCP URL:

```text
https://your-domain.example.com/mcp
```

Auth header:

```text
Authorization: Bearer <token>
```

## 6) Monitoring

Takip edilmesi gereken metrikler:

- P95 latency
- 4xx/5xx oranlari
- Session count ve session prune olaylari
- Rate limit hit oranlari

## 7) Incident and Rollback

- Yeni release sorunluysa onceki image/tag'e don
- Tum tokenlari rotate et (sizinti suphesinde)
- Scope setini daralt (`*` yerine minimal scope)

## 8) MCP Registry Prep (Optional)

- `server.json` icindeki `url` alanini production URL ile guncelle
- Registry onboarding gereksinimlerine gore metadata tamamla
