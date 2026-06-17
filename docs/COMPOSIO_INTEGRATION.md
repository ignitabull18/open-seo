# Composio Integration

OpenSEO uses its built-in DataForSEO integration for SEO data. DataForSEO calls
continue to use `DATAFORSEO_API_KEY` directly so the app keeps its existing
schemas, billing metadata, and cost verification logic.

Composio is used for connected external tools exposed in the Tools hub and the
Settings integration section.

## Toolkits

OpenSEO provisions and displays Composio auth configs for:

- Google Search Console
- Google Analytics
- Google Sheets
- Gmail
- Google Docs
- Slack
- Notion
- WordPress
- LinkedIn
- HubSpot
- GitHub
- Jira

The connected-tools catalog lives in
`src/server/features/integrations/composioCatalog.ts`. The server functions in
`src/serverFunctions/composio-integrations.ts` read the catalog, create auth
configs when needed, and start Composio connection flows for users.

## Setup

Production uses the account-level Cloudflare Secrets Store binding
`COMPOSIO_API_KEY` from `default_secrets_store`. Local development can provide
the same key from `.env.local`, `.env`, or the process environment:

```sh
COMPOSIO_API_KEY=...
```

DataForSEO remains separate:

```sh
DATAFORSEO_API_KEY=...
```

## Verification

Run the normal app checks after changing connected-tools behavior:

```sh
pnpm run ci:check
pnpm run test:ci
```

Use the direct DataForSEO smoke test when validating SEO credentials:

```sh
pnpm run dataforseo:smoke
```
