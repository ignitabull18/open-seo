# Docker auth boundary

## Status

Accepted: Docker self-hosting remains `local_noauth` and must be protected externally.

## Context

Docker self-hosting is designed for local or private-network use. The compose setup starts the app with `AUTH_MODE=local_noauth`, which injects a local admin user and disables in-app authentication checks.

The app already has secure hosted Better Auth and Cloudflare Access auth modes, but the Docker image is not a public-internet auth product by itself.

## Decision

Do not add a partial Docker-only auth mode.

A supported secure Docker deployment must run behind one of:

- Cloudflare Tunnel plus Cloudflare Access
- an identity-aware reverse proxy
- a private network or VPN

The Docker docs now treat external auth as a hard requirement for any non-local exposure.
