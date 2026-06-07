# Docker Self-Hosting

Run OpenSEO locally with Docker.

In Docker mode, OpenSEO uses `AUTH_MODE=local_noauth` (no auth checks, local admin user `admin@localhost`). Only expose it behind your own auth-protected reverse proxy, tunnel, or private network.

Docker self-hosting is not safe to expose directly to the public internet. A supported secure Docker deployment must sit behind Cloudflare Tunnel + Cloudflare Access, an identity-aware reverse proxy, a VPN, or a private network boundary. See `adr/0005-docker-auth-boundary.md` for the decision record.

The default `compose.yaml` uses the published GHCR image:

- `ghcr.io/every-app/open-seo:latest`

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)

## Quickstart

```bash
cp .env.example .env
docker compose up -d
```

Set `DATAFORSEO_API_KEY` in `.env`, then open `http://localhost:<PORT>` (default `3001`).

Docker Compose passes `.env` values into the container, and `compose.yaml` enables `CLOUDFLARE_INCLUDE_PROCESS_ENV=true` so the Cloudflare Vite runtime can read them as Worker bindings during local self-hosting.

Optional env values:

- `PORT` (defaults to `3001`)
- `ALLOWED_HOST` (single reverse-proxy hostname to allow in Vite preview)
- `AUTH_MODE=local_noauth` (already set in compose)
- `OPEN_SEO_IMAGE` (defaults to `ghcr.io/every-app/open-seo:latest`)

If you are putting Docker behind a reverse proxy or a temporary tunnel, remember that Docker self-hosting runs with app auth disabled. Only expose it behind your own auth-protected reverse proxy, tunnel, or private network, and add the public hostname before restarting:

```bash
ALLOWED_HOST=yourdomain.com docker compose up -d
```

You can also persist it in `.env`.

## Secure exposure pattern

Recommended public exposure:

1. Keep `AUTH_MODE=local_noauth` inside Docker.
2. Terminate HTTPS and authentication before traffic reaches the container.
3. Restrict the upstream to authenticated users only.
4. Set `ALLOWED_HOST` to the external hostname.
5. Confirm unauthenticated browser requests are denied by the proxy before they reach OpenSEO.

Do not rely on Docker OpenSEO itself to challenge public users for credentials.

## Pin to a specific image tag

Set `OPEN_SEO_IMAGE` in `.env` and restart:

```bash
OPEN_SEO_IMAGE=ghcr.io/every-app/open-seo:v0.0.12
docker compose up -d
```

## Build your own image locally

If you are testing local code changes, build and run a local tag:

```bash
docker build -f Dockerfile.selfhost -t open-seo:local .
OPEN_SEO_IMAGE=open-seo:local docker compose up -d
```

## Common commands

- Restart service after env changes:

```bash
docker compose up -d open-seo
```

- Pull latest published image and restart:

```bash
docker compose pull && docker compose up -d
```

- Stop:

```bash
docker compose down
```

- Stop and remove volumes:

```bash
docker compose down -v
```

## Troubleshooting environment variables

To confirm Docker Compose is using the expected environment variables:

```bash
docker compose config
```

Check that `AUTH_MODE=local_noauth`, and that `DATAFORSEO_API_KEY` is the base64
encoded value of your DataForSEO email and API password in this format:
`email:password`.

If you changed `.env`, recreate the container so Compose reapplies it:

```bash
docker compose up -d --force-recreate open-seo
```
