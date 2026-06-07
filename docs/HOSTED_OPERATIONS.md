# Hosted Operations

This is the operator checklist for the hosted OpenSEO Worker.

## Current production surface

- Product Worker: `open-seo`
- Product URL: `https://open-seo.lingering-rain-68b6.workers.dev`
- Marketing/docs Worker: `open-seo-landing`
- Marketing/docs domains: `openseo.so`, `www.openseo.so`
- Auth mode: hosted Better Auth, allowlisted to `jeremy@ignitabull.com`
- Database: D1 `open-seo`
- Object/cache storage: R2 bucket `open-seo`, cache prefix `dataforseo-cache/`
- State storage: KV `open-seo-kv`, OAuth KV `open-seo-oauth-kv`
- Background work: `SITE_AUDIT_WORKFLOW`, `RANK_CHECK_WORKFLOW`

## Release checklist

Run from the repository root:

```sh
pnpm install
pnpm --dir web install
pnpm run ci:check
pnpm run test:ci
pnpm --dir web run types:check
pnpm --dir web run build
pnpm run release:verify
pnpm run deploy
pnpm run smoke:prod
pnpm run smoke:mcp
```

The production smoke command verifies:

- the hosted app loads
- hosted sign-up and sign-in reject non-allowlisted emails
- required Worker secrets are present
- the Jeremy hosted user exists in remote D1
- Wrangler can read the production deployment list

## Monitoring

Check these surfaces after deploys and during incidents:

- Worker errors and traces: Cloudflare dashboard, `open-seo` -> Observability.
- Worker logs: `wrangler tail open-seo`.
- D1 migrations: `wrangler d1 migrations list DB --remote`.
- D1 user sanity check: `wrangler d1 execute DB --remote --command "select email from user limit 5;"`.
- Workflow state: Cloudflare dashboard -> Workflows -> `site-audit-workflow` and `rank-check-workflow`.
- KV namespaces: dashboard namespace views for OAuth and app state drift.
- R2 cache storage: `pnpm run r2:cache -- info`.
- R2 known-key cleanup: `pnpm run r2:cache -- delete dataforseo-cache/<key>`.

## Generated files

Route trees and Cloudflare type files are checked by `pnpm run verify:generated` and `pnpm run verify:bindings`.

Regenerate them with:

```sh
pnpm run build
pnpm run cf-typegen
pnpm --dir web run build
pnpm --dir web run cf-typegen
```
