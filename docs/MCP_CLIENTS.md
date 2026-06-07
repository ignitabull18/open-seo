# MCP Client Setup

OpenSEO exposes an OAuth-protected MCP endpoint at:

```text
https://open-seo.lingering-rain-68b6.workers.dev/mcp
```

Self-hosted Cloudflare Access deployments should expose the same `/mcp` path behind Cloudflare Access Managed OAuth.

## Claude Desktop

1. Open Settings -> Connectors.
2. Choose Add custom connector.
3. Paste the OpenSEO MCP URL.
4. Approve the OpenSEO OAuth login when prompted.

## Claude Code

```sh
claude mcp add --transport http --scope user openseo https://open-seo.lingering-rain-68b6.workers.dev/mcp
```

## Codex CLI

```sh
codex mcp add openseo --url https://open-seo.lingering-rain-68b6.workers.dev/mcp
```

## Codex Desktop

1. Open Settings -> Integrations & MCP.
2. Choose Add your own.
3. Paste the OpenSEO MCP URL.
4. Approve the OpenSEO OAuth login when prompted.

## Generic HTTP MCP Clients

Use HTTP transport, point the client at `/mcp`, and allow the OAuth flow to complete in the browser.

Hosted smoke verification:

```sh
pnpm run smoke:mcp
```
