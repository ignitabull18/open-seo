# Cloudflare Deployment

This document records the current Cloudflare deployment state for the hosted OpenSEO app.

## Current deployment

- Worker: `open-seo`
- URL: `https://open-seo.lingering-rain-68b6.workers.dev`
- Cloudflare account: `2b66aa2be0f7116c930a57acb4f0fc8e`
- Auth mode: hosted Better Auth
- Allowed hosted user: `jeremy@ignitabull.com`
- Compatibility date: `2026-05-28`
- Worker version: changes on each deploy; verify the current value with `wrangler deployments list` or the final `Current Version ID` line from `pnpm run deploy`.
- Domain decision: keep the current `workers.dev` URL for this deployment. See `adr/0004-hosted-custom-domain.md`.
- Preview URLs: disabled in `wrangler.jsonc`.

The deployed Worker uses Cloudflare storage primitives:

| Binding               | Resource                                                                |
| --------------------- | ----------------------------------------------------------------------- |
| `DB`                  | D1 database `open-seo`, ID `b97cb197-7518-44a2-a201-8cbd5b7475ec`       |
| `KV`                  | KV namespace `open-seo-kv`, ID `d55a051f42e54709a4762a2987daa72e`       |
| `OAUTH_KV`            | KV namespace `open-seo-oauth-kv`, ID `62deebe3a0d54b16ae659feb51869933` |
| `R2`                  | R2 bucket `open-seo`                                                    |
| `SITE_AUDIT_WORKFLOW` | Workflow `site-audit-workflow`                                          |
| `RANK_CHECK_WORKFLOW` | Workflow `rank-check-workflow`                                          |

## Hosted auth lock

Hosted auth is restricted in three layers:

- `wrangler.jsonc` sets `HOSTED_ALLOWED_EMAILS=jeremy@ignitabull.com`.
- `src/routes/api/auth/$.ts` rejects hosted email sign-up and sign-in API calls for non-allowlisted emails.
- `src/middleware/ensure-user/hosted.ts` rejects hosted sessions whose email is no longer allowlisted.

The sign-up UI also validates `jeremy@ignitabull.com` before submit. The server-side checks are the source of truth.

## Cloudflare platform review

Cloudflare published its Agents Week recap on April 20, 2026:
https://blog.cloudflare.com/agents-week-in-review/

The current deployment intentionally stays on Workers, D1, KV, R2, and Workflows because those match the app's current architecture. The newer agent platform features are useful reference points, but most are not required until OpenSEO runs untrusted user code, has autonomous hosted agents, or needs Cloudflare-native AI inference.

| Area                     | Cloudflare release                                                                                                                                                                                                                                                     | OpenSEO decision                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full-stack app runtime   | The Cloudflare Vite plugin supports full-stack apps, SSR, static assets, and TanStack Start on Workers. Docs: https://developers.cloudflare.com/workers/vite-plugin/                                                                                                   | Adopted. The product app already builds through Vite and deploys as a Worker.                                                                                          |
| Static assets            | Workers Static Assets are handled by the Vite plugin build output. Docs: https://developers.cloudflare.com/workers/vite-plugin/reference/static-assets/                                                                                                                | Adopted. No separate Pages project is needed for the product app.                                                                                                      |
| Database                 | D1 is the relational store already used by Drizzle and Better Auth.                                                                                                                                                                                                    | Adopted. The hosted deployment uses Cloudflare D1, not Supabase/Postgres.                                                                                              |
| Object/cache storage     | R2 and KV remain appropriate for cached DataForSEO responses, workflow progress, and OAuth state.                                                                                                                                                                      | Adopted. The deployment provisions both KV namespaces and an R2 bucket.                                                                                                |
| Durable background work  | Workflows raised paid-plan limits to 50,000 concurrent instances, 300 creations per second per account, and 2 million queued instances per Workflow on April 15, 2026. Changelog: https://developers.cloudflare.com/changelog/post/2026-04-15-workflows-limits-raised/ | Adopted. Existing audit and rank-check Workflows remain the right primitive.                                                                                           |
| Agent compute            | Agents Week introduced Sandboxes GA, Dynamic Workers patterns, Dynamic Worker Durable Object Facets, and a reworked Workflows control plane for agent workloads.                                                                                                       | Defer. OpenSEO does not currently execute untrusted/generated code or long-lived user agents.                                                                          |
| Runtime-loaded workflows | On May 1, 2026, Cloudflare shipped `@cloudflare/dynamic-workflows` to run Workflows inside Dynamic Workers. Workers changelog: https://developers.cloudflare.com/changelog/product/workers/                                                                            | Defer. OpenSEO workflows are static app code, not tenant-provided automation code.                                                                                     |
| Agents SDK               | Post-Agents-Week releases added chat recovery, routing retries, durable Think submissions, Voice connection control, and prior MCP RPC transport work. Workers changelog: https://developers.cloudflare.com/changelog/product/workers/                                 | Defer. OpenSEO exposes MCP tooling but does not need to run a Cloudflare Agent runtime for the hosted product app yet.                                                 |
| AI toolbox               | Agents Week announced Project Think, Voice pipeline, Email Service public beta, AI Search, Agent Memory, Browser Run, and expanded AI platform/provider support.                                                                                                       | Defer. These are candidates for future AI search or browser-based audit features, but not required for the current deployment.                                         |
| Security and identity    | Agents Week announced Cloudflare Mesh, Managed OAuth for Access, scoped non-human identity controls, and MCP governance guidance.                                                                                                                                      | Partial. This deployment uses hosted Better Auth with a strict email allowlist. Cloudflare Access/Managed OAuth is not needed for the public hosted app URL right now. |
| Observability            | On May 7, 2026, Workers added automatic tracing across Worker-to-Worker and Durable Object subrequests when tracing is enabled. Workers changelog: https://developers.cloudflare.com/changelog/product/workers/                                                        | Partial. Observability is enabled in Wrangler; deeper trace routing can be added if OpenSEO gains service bindings or Durable Objects.                                 |
| Local development        | On May 18, 2026, Wrangler and the Cloudflare Vite plugin added shareable local dev tunnels. Workers changelog: https://developers.cloudflare.com/changelog/product/workers/                                                                                            | Optional. Useful for webhook and cross-device testing, but not required for this hosted deployment.                                                                    |
| Domains                  | On May 14, 2026, the Workers dashboard added a Domains tab for Worker routing, workers.dev, preview URLs, and Access controls. Workers changelog: https://developers.cloudflare.com/changelog/product/workers/                                                         | Optional. The current deployment uses `workers.dev`; move to a custom domain later if requested.                                                                       |
| Secrets                  | Cloudflare Secrets Store is beta for centralized account-level Worker secrets. Changelog: https://developers.cloudflare.com/changelog/product/secrets-store/                                                                                                           | Defer. This deployment uses Worker secrets for runtime secrets and still requires 1Password for operator credentials.                                                  |
| Artifacts                | Agents Week announced Git-compatible Artifacts storage; May 18, 2026 added Wrangler commands for namespaces, repos, and repo-scoped tokens. Changelog: https://developers.cloudflare.com/changelog/                                                                    | Defer. OpenSEO does not need agent-owned Git workspaces today.                                                                                                         |
| Agentic web controls     | Agents Week announced Agent Readiness, Redirects for AI Training, performance updates, and shared dictionary compression.                                                                                                                                              | Defer. These apply more to the marketing/docs site and future crawler-facing optimization work than the deployed product Worker.                                       |

## Operational status

Completed:

- Created the D1, KV, OAuth KV, and R2 resources in the target Cloudflare account.
- Applied all D1 migrations to the remote database.
- Uploaded the `BETTER_AUTH_SECRET` Worker secret.
- Uploaded the `DATAFORSEO_API_KEY` Worker secret from the `DataForSEO API` 1Password item.
- Verified the deployed Worker secret list currently contains `BETTER_AUTH_SECRET` and `DATAFORSEO_API_KEY`.
- Verified the stored DataForSEO credential returns HTTP 200 from DataForSEO's account-status endpoint.
- Deployed the Worker to `workers.dev`.
- Verified `/sign-up` returns HTTP 200.
- Verified a non-allowlisted sign-up attempt returns HTTP 403.
- Verified a non-allowlisted sign-in attempt returns HTTP 403.
- Created the `OpenSEO Jeremy Hosted Account` 1Password login item in the `Hermes Agent PC` vault.
- Created the hosted `jeremy@ignitabull.com` Better Auth account.
- Verified Jeremy can sign in with the password stored in 1Password.
- Added and verified the R2 lifecycle rule `dataforseo-cache-expiry`, which expires `dataforseo-cache/` objects after 7 days.
- Deployed the final hardening config using Wrangler with the authenticated `cf` CLI token context.

Automated verification entrypoints now live in `docs/HOSTED_OPERATIONS.md`.

Latest full verification: June 7, 2026.
