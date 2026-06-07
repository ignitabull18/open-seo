# Web Zod compatibility

## Status

Accepted: keep `web/` on Zod 3 until Fumadocs supports this package set on Zod 4.

## Context

The standalone marketing/docs site uses `fumadocs-mdx`. Upgrading `web/` from Zod 3 to Zod 4 caused the web production build to fail while validating guide frontmatter:

```text
[fumadocs-mdx] keyValidator._parse is not a function
```

## Decision

Do not ship the Zod 4 upgrade for `web/` yet.

Root OpenSEO already uses Zod 4. The `web/` package keeps Zod 3 because its current Fumadocs dependency path is not compatible.

## Revisit

Retry after upgrading Fumadocs and rerunning:

```sh
pnpm --dir web run types:check
pnpm --dir web run build
```
