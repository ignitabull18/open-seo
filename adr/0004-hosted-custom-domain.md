# Hosted product domain

## Status

Accepted: keep the product app on `workers.dev` for now.

## Context

The marketing/docs site already uses `openseo.so` and `www.openseo.so`. The hosted product app currently runs at `https://open-seo.lingering-rain-68b6.workers.dev`.

The product Worker's `wrangler.jsonc` includes commented custom-domain routes for `app.openseo.so`, but enabling them requires zone access in the deployment Cloudflare account.

## Decision

Do not move the product app to a custom domain in this release.

Reasons:

- The current hosted URL is working and documented.
- `BETTER_AUTH_URL` is pinned to the current workers.dev origin.
- Enabling `app.openseo.so` without confirmed zone ownership blocks deploys.
- Moving auth origins should be a planned release with login callback verification.

## Implementation note

When the zone is available in the deployment account, update:

- `wrangler.jsonc` routes
- `BETTER_AUTH_URL`
- docs and smoke-test `OPEN_SEO_PROD_URL`
- OAuth/MCP callback verification
