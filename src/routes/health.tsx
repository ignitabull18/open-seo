import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

function handleHealth() {
  return Response.json({
    ok: true,
    service: "open-seo",
    commitSha: import.meta.env.VITE_COMMIT_SHA ?? "unknown",
    authMode: env.AUTH_MODE ?? "unknown",
    bindings: {
      DB: Boolean(env.DB),
      KV: Boolean(env.KV),
      OAUTH_KV: Boolean(env.OAUTH_KV),
      R2: Boolean(env.R2),
      SITE_AUDIT_WORKFLOW: Boolean(env.SITE_AUDIT_WORKFLOW),
      RANK_CHECK_WORKFLOW: Boolean(env.RANK_CHECK_WORKFLOW),
    },
  });
}

export const Route = createFileRoute("/health")({
  server: {
    handlers: {
      GET: handleHealth,
    },
  },
});
