# Composio Integration Plan

OpenSEO can route DataForSEO requests through Composio while preserving the
existing OpenSEO feature services, response parsing, and hosted billing meter.

## Current Shape

- `DATAFORSEO_PROVIDER=dataforseo` is the default and keeps direct DataForSEO
  Basic-auth requests.
- `DATAFORSEO_PROVIDER=composio` routes the same raw DataForSEO HTTP requests
  through Composio proxy execution.
- The Composio DataForSEO toolkit is pinned to `20260429_00` by default because
  OpenSEO parses provider responses programmatically.
- If `COMPOSIO_DATAFORSEO_CONNECTED_ACCOUNT_ID` is set, OpenSEO uses that
  Composio connected account. Otherwise it decodes the existing
  `DATAFORSEO_API_KEY` into Basic auth credentials for Composio.

## Setup

Production uses the account-level Cloudflare Secrets Store binding
`COMPOSIO_API_KEY` from `default_secrets_store`. Local development and the smoke
script still need credentials from `.env.local`, `.env`, or the process
environment:

```sh
DATAFORSEO_PROVIDER=composio
COMPOSIO_API_KEY=...
DATAFORSEO_API_KEY=...
```

Optional production hardening:

```sh
COMPOSIO_DATAFORSEO_CONNECTED_ACCOUNT_ID=ca_...
COMPOSIO_DATAFORSEO_TOOLKIT_VERSION=20260429_00
```

## Why This Boundary

Composio's DataForSEO toolkit exposes hundreds of tools for SERP, backlinks,
keywords, Lighthouse/on-page, business data, app/merchant data, and AI/LLM SEO.
OpenSEO already has deterministic schemas and billing based on DataForSEO task
cost metadata, so the safest provider switch is below the raw DataForSEO helper
functions rather than inside product services or MCP tools.

## Verification

Run focused checks after changing this integration:

```sh
pnpm exec vitest run src/server/lib/dataProvider.test.ts src/server/lib/composioDataforseo.test.ts src/server/lib/dataforseoTransport.test.ts
pnpm run types:check
```

Live verification requires valid Composio and DataForSEO credentials. Use a
zero-cost DataForSEO endpoint before running billable SEO actions:

```sh
DATAFORSEO_PROVIDER=composio pnpm run composio:dataforseo:smoke
```
