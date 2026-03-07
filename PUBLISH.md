# Publishing Agent Lint

Agent Lint uses independent package versioning:

- `@agent-lint/cli`
- `@agent-lint/mcp`

GitHub is the public home for discovery. GitLab CI is the authoritative release and npm publish path.

## Release Rules

- Tags are package-scoped: `cli-vX.Y.Z` and `mcp-vX.Y.Z`
- The tag must match the target package version exactly
- Update package-level release notes before tagging
- Run `npm pack --dry-run` before every release

## Pre-Release Checklist

```bash
pnpm install
pnpm run build
pnpm run typecheck
pnpm run lint
pnpm run test
```

Dry-run both published packages:

```bash
cd packages/cli && npm pack --dry-run
cd ../mcp && npm pack --dry-run
```

Check:

- `dist/` is included
- `README.md` is included
- `CHANGELOG.md` is included
- no source or test files leak into the tarball

## Releasing `@agent-lint/cli`

1. Update `packages/cli/package.json`
2. Update [packages/cli/CHANGELOG.md](packages/cli/CHANGELOG.md)
3. Update [CHANGELOG.md](CHANGELOG.md) if the workspace-level story changed
4. Commit the release change
5. Create tag `cli-vX.Y.Z`
6. Push the tag to the GitLab authoritative remote
7. Mirror the same tag to the GitHub public remote

## Releasing `@agent-lint/mcp`

1. Update `packages/mcp/package.json`
2. Update [packages/mcp/CHANGELOG.md](packages/mcp/CHANGELOG.md)
3. Update [CHANGELOG.md](CHANGELOG.md) if the workspace-level story changed
4. Commit the release change
5. Create tag `mcp-vX.Y.Z`
6. Push the tag to the GitLab authoritative remote
7. Mirror the same tag to the GitHub public remote

## CI Responsibilities

### GitHub Actions

- verify-only
- runs install, build, typecheck, lint, test, and pack dry-runs
- validates package-scoped tags
- does not publish to npm

### GitLab CI

- authoritative publish path
- validates that the pushed tag matches the target package version
- publishes only the tagged package
- uses provenance-enabled npm publishing

## npm Metadata Policy

- `repository` points to GitLab because that is the authoritative publish source
- `homepage` points to GitHub because that is the public landing page
- `bugs` points to GitHub Issues

## Manual npm Auth

If you publish outside OIDC trusted publishing, use a granular npm token with write access to `@agent-lint/*` and store it as `NPM_TOKEN` in GitLab CI/CD variables.

Recommended GitLab setup:

1. Open `Settings > CI/CD > Variables`
2. Add variable `NPM_TOKEN`
3. Paste a granular npm token with publish rights for `@agent-lint/cli` and `@agent-lint/mcp`
4. Mark it `Masked`
5. Mark it `Protected` only if your release tags are protected too
6. Retry the failed `publish-cli` or `publish-mcp` job from the tag pipeline

Current behavior:

- if `NPM_TOKEN` is present, GitLab CI publishes with token-based auth
- both plain variables and file-type variables are supported
- token-based jobs run `npm whoami` before publish so auth failures fail fast
- if `NPM_TOKEN` is missing, GitLab CI attempts npm trusted publishing with provenance
- if npm trusted publishing is not configured on npm, the job will fail and the log will point you back to `NPM_TOKEN`
