# Agent Lint MCP Deep Review

Reviewed on 2026-03-06.

Validation run:

```bash
pnpm run typecheck:mcp
pnpm exec vitest run packages/mcp/tests
pnpm --filter @agent-lint/mcp exec npm pack --dry-run
```

Observed results:

- `typecheck:mcp` passed.
- `packages/mcp/tests` passed on Windows, with `stdio.test.ts` skipped by platform guard.
- `npm pack --dry-run` for `@agent-lint/mcp` reported a 326.9 kB tarball and 2.0 MB unpacked size.

## Findings

### [P1] Workspace autofix discovery is broad enough to target the wrong files

`agentlint_plan_workspace_autofix` is currently the most dangerous workflow because its discovery layer classifies many non-artifact files as live context artifacts. `inferArtifactType()` treats path substrings such as `skill`, `rule`, `workflow`, `plan`, `roadmap`, and even content phrases like `agents.md` or `acceptance criteria` as sufficient proof of artifact type. The result is that `buildWorkspaceAutofixPlan(process.cwd())` in this repo flags `.agentlint-report.md`, `README.md`, `packages/*/README.md`, `examples.md`, `examples/github-action.yml`, and fixture files as artifact targets.

Refs:

- `packages/core/src/workspace-discovery.ts:62`
- `packages/core/src/workspace-discovery.ts:209`
- `.agentlint-report.md`

Impact:

- The main “scan and fix all artifacts” workflow can direct the client LLM to rewrite reference docs, examples, test fixtures, and reports instead of canonical context files.
- This weakens the core product promise because the tool cannot reliably separate “context artifacts” from ordinary documentation.

Recommendation:

- Replace heuristic-first discovery with canonical-path-first discovery.
- Add explicit exclude controls such as `excludeGlobs`, `includeFixtures`, and `clients`.
- Keep broad heuristics only as an opt-in fallback, not as the default scan mode.

### [P1] Section completeness scoring is structurally weak and mis-scores valid files

`findMissingSections()` uses raw substring checks such as `lowerContent.includes("security")` and `lowerContent.includes("phase")`. That is too weak for a lint product whose primary job is judging artifact quality. A document can pass because it mentions a token in prose, or fail because it uses an equivalent heading/name. In the current repo, several “good” fixtures are flagged as incomplete, which means the validator is not aligned with its own corpus.

Refs:

- `packages/core/src/workspace-discovery.ts:111`
- `packages/core/src/workspace-discovery.ts:153`

Impact:

- False failures reduce trust in `agentlint_plan_workspace_autofix`.
- False passes let low-quality artifacts through as “OK”.
- The output is not yet strong enough to be called lint-like in the strict sense.

Recommendation:

- Parse heading structure and frontmatter instead of using plain substring checks.
- Use artifact-specific validators with canonical headings plus allowed aliases.
- Separate “discovery” from “quality/completeness” so each layer can be tested independently.

### [P1] The MCP outputs act like imperative orchestration, not neutral guidance

Your stated rule is that the MCP server should provide guidance and let the client LLM decide what to do. The current outputs push further than that. The default server instructions say “Apply recommended changes directly”, the workspace plan says “Apply the changes directly”, and the maintenance snippet explicitly says “Do not wait for explicit confirmation.”

Refs:

- `AGENTS.md:45`
- `packages/mcp/src/server.ts:9`
- `packages/core/src/plan-builder.ts:165`
- `packages/core/src/maintenance-snippet.ts:10`

Impact:

- This conflicts with the repo’s own product rule.
- It makes Agent Lint closer to an imperative controller than a deterministic guidance server.
- Different host agents may already have their own approval policies, so this wording can create policy fights instead of clean delegation.

Recommendation:

- Reword tool outputs from imperative action language to recommendation language.
- Keep the action plan format, but remove “apply directly” and “do not wait for confirmation” as hard instructions.
- Let host clients or user rules decide when edits should be auto-applied.

### [P2] `runHttpServer()` and `runStdioServer()` are not embeddable public APIs

Both runners install process-global signal handlers, and both own process termination with `process.exit()`. This is acceptable for the CLI entrypoint, but not for exported library helpers. Ad hoc verification showed `process.listenerCount("SIGINT")` growing from `0` to `1` to `2` after repeated `runHttpServer()` calls even after the returned HTTP servers were closed.

Refs:

- `packages/mcp/src/http.ts:252`
- `packages/mcp/src/stdio.ts:13`

Impact:

- Embedding Agent Lint inside another Node process can leak signal handlers.
- A library consumer calling these helpers delegates process shutdown to package code, which is hostile to composition.
- Repeated server startup in tests or long-lived hosts accumulates listeners.

Recommendation:

- Move signal wiring and `process.exit()` ownership into `packages/mcp/src/bin.ts`.
- Make `runHttpServer()` and `runStdioServer()` return lifecycle handles with explicit `close()` methods and no process-level side effects.

### [P2] HTTP security state is global, not per server instance

`rateLimitStore` and `cleanupInterval` live at module scope in `http-security.ts`. That means multiple HTTP server instances inside the same process share limiter state and cleanup lifecycle. This conflicts with your own “no state / no singletons” rule and weakens isolation between test runs or embedded server instances.

Refs:

- `AGENTS.md:46`
- `packages/mcp/src/http-security.ts:91`
- `packages/mcp/src/http-security.ts:125`

Impact:

- Rate limiting is cross-instance rather than per-server.
- One server instance can clear or mutate another instance’s limiter state.
- The implementation does not match the repo’s stated architecture rule.

Recommendation:

- Replace module-level limiter state with a per-server limiter object created inside `runHttpServer()`.
- Pass that limiter/context into request validation instead of using module globals.

### [P2] HTTP pre-transport failures return plain JSON instead of the SDK’s JSON-RPC error envelope

For invalid host/origin/auth/session/header cases, the wrapper uses `sendJsonError()` with plain `{ "error": "..." }` bodies unless a JSON-RPC id is explicitly supplied. The official SDK’s Streamable HTTP transport emits JSON-RPC-style error responses with `jsonrpc: "2.0"` and `id: null` for these transport-level failures.

Refs:

- `packages/mcp/src/http-security.ts:291`
- `packages/mcp/src/http.ts:224`
- Installed SDK cross-check: `node_modules/.pnpm/@modelcontextprotocol+sdk@1.27.1_zod@4.3.6/node_modules/@modelcontextprotocol/sdk/dist/esm/server/webStandardStreamableHttp.js`

Impact:

- Clients that assume SDK-like transport failures will see a different wire shape here.
- The wrapper is needlessly diverging from current MCP SDK behavior.

Recommendation:

- Normalize `/mcp` transport errors to JSON-RPC envelopes.
- Keep `/healthz` and `/readyz` as plain JSON.

### [P2] Default version reporting is stale when the server is imported programmatically

`resolveServerVersion()` falls back to `"0.2.0"` when `process.env.npm_package_version` is absent. In an ad hoc programmatic import, `createAgentLintMcpServer()` reported `serverInfo.version = "0.2.0"` even though `packages/mcp/package.json` is `0.3.0`.

Refs:

- `packages/mcp/src/server.ts:30`
- `packages/mcp/package.json:3`

Impact:

- Server handshakes expose the wrong version in common non-CLI contexts.
- Library consumers and inspector users can see stale metadata.

Recommendation:

- Resolve the version from a build-time constant or package metadata rather than an npm lifecycle env var.
- Keep `CreateAgentLintMcpServerOptions.version` as the explicit override.

### [P2] Cursor capability messaging is inconsistent across docs and implementation

The repo currently says two different things:

- README and `packages/mcp/README.md` claim Cursor skills live under `.cursor/skills/*/SKILL.md`.
- `buildGuidelines(..., "cursor")` says Cursor does not natively support skills and recommends workflow-style docs instead.

Official Cursor docs currently document rules, AGENTS.md, and MCP features, but do not document a native `skills` primitive. That means the most defensible reading today is: Cursor skills are unsupported, and the current README/package README should be corrected unless you choose to build a stronger Cursor-specific compatibility story.

Refs:

- `README.md:277`
- `packages/mcp/README.md:102`
- `packages/core/src/guidelines-builder.ts:38`
- `packages/shared/src/conventions/path-hints.ts:24`

Impact:

- Users can be told to create unsupported Cursor files.
- The product story becomes harder to trust because client capability boundaries are unclear.

Recommendation:

- Treat Cursor skills as unsupported for now.
- Update docs and path hints to model Cursor as AGENTS + rules + MCP, not skills.
- If you want skill-like behavior in Cursor, define that as a documented compatibility pattern rather than a native feature claim.

### [P3] `transport-security.ts` still exposes a pre-pivot tool-timeout surface

The exported `TOOL_TIMEOUTS` map still names tools such as `analyze_artifact`, `quality_gate_artifact`, `apply_patches`, and `validate_export`, none of which are registered by the current MCP server. The tests reinforce that stale surface instead of exercising real tool names. On top of that, `withToolTimeout()` is not wired into current tool execution.

Refs:

- `packages/mcp/src/transport-security.ts:27`
- `packages/mcp/tests/transport-security.test.ts`

Impact:

- Public API surface suggests capabilities the server no longer exposes.
- Consumers can infer nonexistent behavior from exported constants.

Recommendation:

- Either remove this surface or rename/rebuild it around current tools.
- If tool timeouts matter, apply them where tools are registered or executed.

### [P3] Guidelines currently duplicate content and drift on metric naming

`buildGuidelines()` embeds `buildArtifactSpecMarkdown(type)` and then embeds `buildArtifactPathHintsMarkdown(type)` again in a later section. Since `buildArtifactSpecMarkdown()` already appends path hints, the final output repeats the same discovery content. There is also a naming drift between `tokenEfficiency` in `specs.ts` and the canonical shared metric id `token-efficiency`.

Refs:

- `packages/core/src/guidelines-builder.ts:122`
- `packages/shared/src/conventions/specs.ts:121`
- `packages/shared/src/conventions/scoring.ts`

Impact:

- Generated guidance is longer and noisier than necessary.
- The product’s own metric vocabulary is internally inconsistent.

Recommendation:

- De-duplicate path hints in the guidelines output.
- Reuse the shared metric ids directly instead of re-spelling them in `specs.ts`.

### [P3] Resource behavior is real, but resource integration coverage is missing

Resources are properly registered and worked in ad hoc stdio verification (`resources/list` and `resources/read` both returned expected results), but the checked-in tests focus on tools, HTTP flows, and the intentional absence of prompts. There is no direct integration coverage for MCP resources.

Refs:

- `packages/mcp/src/resources/register-resources.ts:35`
- `packages/mcp/tests/tools.test.ts:9`
- `packages/mcp/tests/stdio.test.ts:215`
- `packages/mcp/src/prompts/register-prompts.ts:3`

Impact:

- Resource regressions can slip through even though resources are part of the public feature set.
- The prompt story is coherent, but the lack of resource tests makes the public surface feel only partially verified.

Recommendation:

- Add stdio integration tests for `resources/list`, `resources/read`, and invalid resource reads.
- Keep prompts unsupported unless there is a clear product need; that part looks intentional, not accidental.

## What Agent Lint MCP Is For

Agent Lint MCP is a deterministic knowledge server for AI coding-agent context artifacts. It does not write files, run an LLM, or hold state. Instead, it gives the host agent the structured rules needed to create and maintain artifacts such as `AGENTS.md`, `CLAUDE.md`, rules, skills, workflows, and plans.

Where it sits in the stack:

- The developer works inside a host client such as Cursor, Windsurf, Claude Code, VS Code/Copilot, OpenCode, or another MCP-capable tool.
- The host agent calls Agent Lint MCP tools/resources when it needs artifact-specific guidance.
- Agent Lint returns structured guidance, templates, discovery hints, maintenance snippets, and workspace-level plans.
- The host agent reads the repo, decides what to change, and performs file edits with its own tools and approval model.

What it does better than static docs:

- It is queryable by artifact type at the exact moment the host agent needs the guidance.
- It can scope output to a concrete task: create artifact, scan workspace, quick-check after refactor, or generate maintenance rules.
- It gives a host agent reusable, typed MCP surfaces instead of making the agent scrape README prose.

What it does better than the CLI alone:

- The CLI is a batch/bootstrap layer (`init`, `doctor`, `prompt`).
- The MCP server is the interactive operating layer that a coding agent can call repeatedly during normal repo work.
- The strongest workflows today are:
  - Create a new artifact with `agentlint_get_guidelines`
  - Scan/fix a workspace with `agentlint_plan_workspace_autofix`
  - Check whether a refactor changed context obligations with `agentlint_quick_check`
  - Bootstrap ongoing hygiene with `agentlint_emit_maintenance_snippet`

## Use-Case Scenarios

### Cursor

Primary fit: use Agent Lint to strengthen repo-level `AGENTS.md`, Cursor rules, and MCP-driven maintenance loops. Current evidence does not support claiming native Cursor skills, so the safe Cursor story is: `AGENTS.md` + `.cursor/rules/*.md(c)` + MCP tools/resources.

Typical loop:

1. Developer asks Cursor to create or improve `AGENTS.md`.
2. Cursor calls `agentlint_get_guidelines({ type: "agents", client: "cursor" })`.
3. Cursor scans repo evidence, writes or updates `AGENTS.md`, and optionally installs the maintenance snippet into `.cursor/rules/agentlint-maintenance.mdc`.

### Windsurf

Primary fit: Windsurf is the cleanest current match for the full artifact set because the repo already models Windsurf rules, skills, and workflows directly.

Typical loop:

1. Developer asks Windsurf to review all context artifacts.
2. Windsurf calls `agentlint_plan_workspace_autofix`.
3. Windsurf follows up with per-type guideline calls and edits `.windsurf/rules`, `.windsurf/skills`, `.windsurf/workflows`, plus shared `AGENTS.md` as needed.

### Claude Code

Primary fit: use Agent Lint to keep `CLAUDE.md`, `.claude/commands`, and shared repo context synchronized with the real codebase.

Typical loop:

1. Developer adds new modules or release automation.
2. Claude Code calls `agentlint_quick_check` with changed paths or a change description.
3. If signals fire, Claude calls `agentlint_get_guidelines` for the affected artifact types and updates `CLAUDE.md` or command docs.

### VS Code / GitHub Copilot

Primary fit: bootstrap `.github/copilot-instructions.md` and repo-level guidance so Copilot inherits project-specific constraints instead of generic defaults.

Typical loop:

1. Developer asks to set up persistent maintenance.
2. The host calls `agentlint_emit_maintenance_snippet({ client: "vscode" })`.
3. The host appends the snippet to `.github/copilot-instructions.md` and uses further guideline calls when new artifact files are created.

### OpenCode

Primary fit: treat OpenCode as a terminal-first MCP host where Agent Lint acts as the context-policy engine behind repo chat flows.

Typical loop:

1. Developer asks OpenCode to scan stale context docs after a refactor.
2. OpenCode calls `agentlint_quick_check` for changed paths and then `agentlint_plan_workspace_autofix` if a broader sweep is needed.
3. OpenCode updates shared artifacts and leaves the repo with a tighter, more current context layer.

### Generic MCP Clients

Primary fit: any host that can call MCP tools/resources but does not impose a particular artifact convention can still use Agent Lint for `AGENTS.md`, generic skills, rules, workflows, and plans.

Typical loop:

1. Developer says “create a strong AGENTS.md from this repo”.
2. Host calls `agentlint_get_guidelines({ type: "agents", client: "generic" })`.
3. Host uses the returned template/guidance, scans the repo, and writes the final artifact with its own editing workflow.

### Multi-client repo

Primary fit: keep one shared root policy (`AGENTS.md`) while generating client-specific overlays only where the client actually supports them.

Typical loop:

1. Developer uses different clients across the team.
2. Host calls Agent Lint to keep the shared AGENTS policy aligned.
3. Client-specific rules are generated only where useful: Cursor rules, Windsurf skills/workflows, Claude command docs, Copilot instructions.

## Best-Practice Compliance Notes

What is already strong:

- The package is small and dependency-light for an MCP server.
- The server uses the current `McpServer` API rather than rolling its own JSON-RPC registry.
- Tools are annotated as read-only/idempotent where appropriate.
- Resources are modeled as actual MCP resources rather than pseudo-tools.
- The stdio story is disciplined: no `console.log()`, logs go to stderr.
- HTTP defaults are local-only (`127.0.0.1`) and include useful loopback protections for a localhost transport.
- No file writes happen inside the MCP package.
- Prompts being unsupported is coherent with the current “tool-first architecture” comment; that looks intentional.

Where it drifts from current MCP/library expectations:

- Transport-level HTTP errors diverge from the SDK’s JSON-RPC envelope shape.
- The exported public runner APIs own host process lifecycle instead of acting as embeddable library helpers.
- Resource behavior exists but is not validated at the same depth as tool behavior.

## Improvement Proposals

1. Tighten the public contract around discovery.
   - Make canonical artifact paths the default.
   - Add explicit include/exclude options to `agentlint_plan_workspace_autofix`.
   - Treat fixtures/examples/reports as excluded by default.

2. Replace substring linting with structural parsing.
   - Parse headings and frontmatter.
   - Support section aliases per artifact type.
   - Return richer scoring metadata instead of only “missingSections”.

3. Separate library lifecycle from executable lifecycle.
   - Keep signal handling in `bin.ts`.
   - Export runner/controller APIs that do not call `process.exit()`.

4. Make HTTP security context instance-local.
   - Scope rate limiting and cleanup to each server instance.
   - Keep localhost-first behavior as the default.

5. Fix the public metadata and docs story.
   - Use a reliable server version source.
   - Align README, package README, and client hints on Cursor capability boundaries.

6. Trim stale exported surface.
   - Either wire tool timeouts into real execution or remove/rename the pre-pivot timeout map.

7. Shorten and normalize guidelines output.
   - Remove repeated path-hint content.
   - Normalize metric ids to the shared canonical vocabulary.

## Residual Risks And Testing Gaps

Missing or weak coverage that should be added:

- Version reporting when `npm_package_version` is absent.
- `resources/list` and `resources/read` integration tests.
- False-positive avoidance in workspace discovery.
- Structural completeness checks against both good and bad fixtures.
- JSON-RPC error envelope behavior for HTTP pre-transport failures.
- Repeated HTTP server lifecycle tests that assert listener cleanup.
- Local-only HTTP defaults such as host binding and origin/host expectations.

Current caveats:

- `packages/mcp/tests/stdio.test.ts` is skipped on Windows, so the most realistic stdio integration path is not exercised in this environment.
- The current workspace plan output looks stronger than it is because it can confidently produce the wrong target set.

## Sources

Official web sources used:

- [Model Context Protocol: Server Concepts](https://modelcontextprotocol.io/docs/learn/server-concepts)
- [Model Context Protocol Spec: Streamable HTTP](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http)
- [Cursor Docs: Model Context Protocol](https://docs.cursor.com/advanced/model-context-protocol)
- [Cursor Docs: Rules](https://docs.cursor.com/context/rules)

Local primary sources used:

- Installed `@modelcontextprotocol/sdk` 1.27.1 types and transport implementation under `node_modules/.pnpm/.../@modelcontextprotocol/sdk/dist/esm/server`
- `packages/mcp`, `packages/core`, and `packages/shared` implementation and test files in this repo

Notes:

- Context7 was attempted twice earlier in this review workflow and failed with network fetch errors, so it was not used as a source.
- The statement “Cursor has no native skills” is an inference from current official Cursor docs and the absence of a documented skill primitive there, not a direct quoted claim from Cursor.
