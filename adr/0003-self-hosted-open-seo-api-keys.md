# Self-hosted access to hosted OpenSEO data

## Status

Accepted: do not add general hosted API-key proxying yet.

## Context

Self-hosted users may want hosted OpenSEO to provide expensive or subscription-gated DataForSEO datasets, especially Backlinks and AI Optimization data. The README previously said an OpenSEO API key would be added soon.

Adding this now would create a new paid API surface that needs authentication, metering, abuse controls, quota UX, key rotation, billing support, public API docs, and compatibility guarantees.

## Decision

Self-hosted OpenSEO continues to use the user's own `DATAFORSEO_API_KEY`.

Hosted DataForSEO access remains available inside the hosted OpenSEO app and remains metered through Autumn. The public docs no longer promise an imminent hosted API key for self-hosted instances.

## Follow-up trigger

Revisit this only when OpenSEO has a versioned hosted API with:

- API-key create/revoke UI
- request-level rate limiting
- Autumn metering for API usage
- abuse monitoring
- documented endpoint stability
