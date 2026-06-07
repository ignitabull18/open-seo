# Operation Runbooks

## GitHub Actions status lookup

Use:

```sh
pnpm run ci:status
```

If no rows are returned, the GitHub CLI token may not have Actions read access or GitHub may not have indexed the latest push yet. This is non-fatal for local deploy verification; rely on local `pnpm run verify:all` plus live smoke checks until Actions are visible.

## Authenticated Jeremy login smoke

The automated `pnpm run smoke:prod` intentionally does not read or print Jeremy's password.

Manual procedure:

1. Read the `OpenSEO Jeremy Hosted Account` item from 1Password.
2. Open `https://open-seo.lingering-rain-68b6.workers.dev/sign-in`.
3. Sign in as `jeremy@ignitabull.com`.
4. Confirm the workspace redirects to a project route.
5. Run `pnpm run smoke:prod` after logout to confirm unauthenticated and non-allowlisted paths still behave correctly.

## Authenticated MCP smoke

The automated MCP smoke verifies OAuth metadata and confirms unauthenticated `/mcp` is protected.

Authenticated MCP verification requires a browser OAuth grant:

1. Add the MCP endpoint to Claude Desktop, Claude Code, Codex, or another HTTP MCP client.
2. Complete the OpenSEO OAuth login as `jeremy@ignitabull.com`.
3. Run `whoami` and `list_projects`.
4. Confirm tool responses identify Jeremy's hosted organization and do not expose another tenant.

## Rollback

1. List deployments:

```sh
pnpm exec wrangler deployments list --name open-seo
```

2. Pick the previous known-good Worker version ID.
3. Roll back from the Cloudflare dashboard deployment view, or redeploy the previous Git commit with:

```sh
git checkout <known-good-sha>
pnpm run deploy
```

4. Run:

```sh
pnpm run smoke:prod
pnpm run smoke:mcp
```

5. Return to `main` after the incident branch is handled.

## Better Auth account recovery

1. Confirm the account row exists:

```sh
pnpm exec wrangler d1 execute DB --remote --command "select id,email,emailVerified from user where email = 'jeremy@ignitabull.com';"
```

2. If password reset email is unavailable, rotate the hosted password through the app's reset flow after Loops email config is confirmed.
3. Keep `HOSTED_ALLOWED_EMAILS=jeremy@ignitabull.com`.
4. Do not create a second hosted admin account unless the allowlist and docs are updated in the same change.

## DataForSEO credential rotation

1. Generate a new DataForSEO API password.
2. Base64 encode `login:password`.
3. Update the Worker secret:

```sh
pnpm exec wrangler secret put DATAFORSEO_API_KEY
```

4. Verify account access through the DataForSEO account-state endpoint or an app workflow.
5. Run `pnpm run smoke:prod`.

## Autumn billing validation

1. Confirm `AUTUMN_SECRET_KEY` is available in the operator environment before local billing tests that require it.
2. Use `pnpm run test:ci` for metering regression coverage.
3. In hosted production, run a small paid DataForSEO action and confirm Autumn usage moves on the expected feature.
4. Check PostHog for `usage:credits_consume` events with `provider=dataforseo`.

## Alerts and monitoring

Monitor:

- Worker errors and traces in Cloudflare Observability.
- Workflow failures for `site-audit-workflow` and `rank-check-workflow`.
- D1 query errors and migration failures during deploy.
- R2 cache growth under `dataforseo-cache/`.
- OAuth/MCP token errors in Worker logs.

Minimum alert policy:

- Page on repeated Worker 5xx responses.
- Page on repeated Workflow failures.
- Triage on D1 migration failure.
- Triage on DataForSEO credential or billing failures.

## Worker secret drift

Production currently requires these Worker secrets:

- `BETTER_AUTH_SECRET`
- `DATAFORSEO_API_KEY`

`pnpm run smoke:prod` verifies both without printing secret values.

## Generated type file policy

`worker-configuration.d.ts` and `web/worker-configuration.d.ts` are committed generated files. They are noisy but valuable because CI can verify Cloudflare bindings without requiring a deploy.

Do not replace them with hand-written stubs. If repo size becomes a problem, revisit this with a new ADR and a CI-only generation strategy.

## Fumadocs Zod 4 blocker

`web/` stays on Zod 3 until `fumadocs-mdx` builds with Zod 4 in this package set. Retry by upgrading Fumadocs first, then running:

```sh
pnpm --dir web run types:check
pnpm --dir web run build
```

## Marketing site smoke

The marketing/docs Worker should get a dedicated `smoke:web` command before the next marketing-site deployment. Minimum checks:

- `https://openseo.so/` returns 200.
- `/pricing`, `/features/mcp`, `/guides`, and `/guides/seo-for-startups` return 200.
- `https://www.openseo.so/` redirects or serves as intended.

## Verify everything

Run:

```sh
pnpm run verify:all
pnpm run smoke:prod
pnpm run smoke:mcp
```
