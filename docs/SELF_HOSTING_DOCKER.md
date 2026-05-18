# Docker Self-Hosting

Run OpenSEO locally or in Coolify with Docker.

Docker self-hosting is secure-by-default: `compose.yaml` defaults to
`AUTH_MODE=cloudflare_access` and passes Cloudflare Access settings into the
container so the app and MCP endpoint validate the `cf-access-jwt-assertion`
header before creating an OpenSEO user context.

Use `AUTH_MODE=local_noauth` only for trusted local development on a private
machine or private network. Do not expose `local_noauth` deployments directly to
the internet.

The default `compose.yaml` uses the published GHCR image:

- `ghcr.io/every-app/open-seo:latest`

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- A DataForSEO API credential encoded as base64 `email:password`
- For production/Coolify: a Cloudflare Access application in front of the OpenSEO route

## Secure quickstart: Docker or Coolify behind Cloudflare Access

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Set the required values in `.env`:

```bash
DATAFORSEO_API_KEY=base64-email-colon-password
AUTH_MODE=cloudflare_access
TEAM_DOMAIN=https://your-team.cloudflareaccess.com
POLICY_AUD=your-cloudflare-access-aud-tag
ALLOWED_HOST=seo.example.com
```

3. Start the container:

```bash
docker compose up -d
```

Docker Compose passes `.env` values into the container. `compose.yaml` also sets
`CLOUDFLARE_INCLUDE_PROCESS_ENV=true` so the Cloudflare Vite runtime can read
those values as Worker bindings during Docker self-hosting.

If `AUTH_MODE=cloudflare_access` is selected but `TEAM_DOMAIN` or `POLICY_AUD`
is missing, OpenSEO returns a clear configuration error instead of silently
falling back to unauthenticated mode.

## Coolify notes

For Coolify, configure these as service environment variables:

- `DATAFORSEO_API_KEY`: base64 `email:password`
- `AUTH_MODE=cloudflare_access`
- `TEAM_DOMAIN=https://your-team.cloudflareaccess.com`
- `POLICY_AUD`: Cloudflare Access application AUD tag
- `ALLOWED_HOST`: the public hostname Coolify/Cloudflare routes to OpenSEO
- `PORT=3001` unless you intentionally change the exposed app port

Keep Cloudflare Access enabled on the public route. OpenSEO validates Access JWTs
for both the browser app and the self-hosted MCP transport.

## Trusted local development mode

For local-only testing without Cloudflare Access, explicitly opt in:

```bash
AUTH_MODE=local_noauth docker compose up -d
```

`local_noauth` injects the local admin user `admin@localhost`. It is intended for
trusted local development only.

## Pin to a specific image tag

Set `OPEN_SEO_IMAGE` in `.env` and restart:

```bash
OPEN_SEO_IMAGE=ghcr.io/every-app/open-seo:v1.2.3
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

Check that the rendered config includes:

- `AUTH_MODE=cloudflare_access` for secure deployments, or an explicit
  `AUTH_MODE=local_noauth` only for trusted local development
- `TEAM_DOMAIN=https://your-team.cloudflareaccess.com`
- `POLICY_AUD=your-cloudflare-access-aud-tag`
- `CLOUDFLARE_INCLUDE_PROCESS_ENV=true`
- `DATAFORSEO_API_KEY` as the base64 encoded value of your DataForSEO email and
  API password in this format: `email:password`

If you changed `.env`, recreate the container so Compose reapplies it:

```bash
docker compose up -d --force-recreate open-seo
```

## Manual verification path

1. Start with `AUTH_MODE=cloudflare_access`, `TEAM_DOMAIN`, and `POLICY_AUD` set.
2. Access the app through the Cloudflare-protected hostname and confirm the UI
   loads after Access authentication.
3. Call the MCP route through the same protected hostname and confirm requests
   without a valid `cf-access-jwt-assertion` are rejected.
4. Temporarily remove `POLICY_AUD` and restart; the app should return a clear
   `AUTH_MODE=cloudflare_access requires TEAM_DOMAIN and POLICY_AUD` error.
5. Restore `POLICY_AUD` and recreate the container.
