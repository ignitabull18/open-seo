# Project Structure

This document maps the OpenSEO repository for contributors and coding agents.

## Top-level directories

| Path                 | Purpose                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| `src/`               | Product application source.                                                     |
| `web/`               | Separate marketing/docs site with its own dependencies and lockfile.            |
| `docs/`              | Public setup docs and maintainer notes.                                         |
| `adr/`               | Architecture decision records.                                                  |
| `drizzle/`           | D1 migration SQL and Drizzle metadata.                                          |
| `scripts/`           | Maintenance scripts, release note generation, cost profiling, and data seeding. |
| `public/`            | Static assets for the product app.                                              |
| `release-notes/`     | Final GitHub release notes by version tag.                                      |
| `.github/workflows/` | CI, Docker image publishing, and sourcemap upload workflows.                    |
| `.opencode/`         | OpenCode configuration and slash commands.                                      |

## Product app

The product app is a TanStack Start application served from Cloudflare Workers.

| Path                     | Purpose                                                   |
| ------------------------ | --------------------------------------------------------- |
| `src/routes/`            | File-based routes and API route handlers.                 |
| `src/client/components/` | Reusable client UI primitives and table helpers.          |
| `src/client/features/`   | Feature-specific UI and client behavior.                  |
| `src/client/hooks/`      | Reusable client hooks, mostly local search/history state. |
| `src/client/layout/`     | App shell and layout parts.                               |
| `src/client/navigation/` | Navigation item definitions.                              |
| `src/client/styles/`     | Global app styling.                                       |
| `src/serverFunctions/`   | TanStack Start server functions consumed by the client.   |
| `src/server/features/`   | Server-side feature services and repositories.            |
| `src/server/lib/`        | Infrastructure and integration helpers.                   |
| `src/server/mcp/`        | MCP server, OAuth provider, tools, and transport.         |
| `src/server/workflows/`  | Cloudflare Workflow entrypoints and workflow logic.       |
| `src/db/`                | Drizzle schemas and D1 database access.                   |
| `src/shared/`            | Shared pure utilities and types used on both sides.       |
| `src/types/`             | Cross-boundary TypeScript types and Zod schemas.          |
| `src/middleware/`        | Auth and error-handling middleware.                       |

## Feature flow

Most product features follow this path:

1. `src/routes/*` defines the route and loads a feature screen.
2. `src/client/features/<feature>` owns UI state, forms, tables, and query hooks.
3. `src/serverFunctions/<feature>.ts` exposes the server boundary.
4. `src/server/features/<feature>` owns business logic and repository calls.
5. `src/server/lib/dataforseo*.ts`, `src/server/lib/r2*.ts`, or other integration helpers do external work.

Keep new code close to the feature it serves. Promote code to `src/client/components`, `src/shared`, or `src/server/lib` only when more than one feature needs it.

## Data and storage

- D1 is the primary relational database.
- Drizzle schema for app tables lives in `src/db/app.schema.ts`.
- Better Auth schema lives in `src/db/better-auth-schema.ts` and is generated.
- Migrations live in `drizzle/`.
- KV is used for short-lived workflow progress and OAuth-related storage.
- R2 stores cached DataForSEO responses and larger audit payloads.
- Cloudflare Workflows run site audits and rank checks.
- Current deployed Cloudflare resource IDs and hosted-auth restrictions are recorded in `docs/CLOUDFLARE_DEPLOYMENT.md`.

## Website

`web/` is intentionally separate from the product app. Run its commands with `pnpm --dir web ...`.

Key paths:

- `web/src/routes/`: website routes.
- `web/src/components/`: website components.
- `web/content/`: Markdown legal and guide content.
- `web/scripts/`: website-only scripts such as sitemap generation.

## Generated files

Do not edit these by hand:

- `src/routeTree.gen.ts`
- `worker-configuration.d.ts`
- `src/db/better-auth-schema.ts`

Regenerate them with the appropriate package scripts when their inputs change.
