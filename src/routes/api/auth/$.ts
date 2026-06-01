import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { getAuth, hasHostedAuthConfig } from "@/lib/auth";
import { isHostedAuthMode } from "@/lib/auth-mode";
import {
  HOSTED_SIGNUP_FORBIDDEN_MESSAGE,
  isHostedEmailAllowed,
} from "@/lib/hosted-allowlist";

const RESTRICTED_AUTH_PATHS = new Set(["/sign-up/email", "/sign-in/email"]);

function getAuthApiPath(request: Request) {
  const pathname = new URL(request.url).pathname;
  const prefix = "/api/auth";
  return pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
}

function jsonAuthError(message: string, status: number) {
  return new Response(
    JSON.stringify({
      code: "FORBIDDEN",
      message,
    }),
    {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
}

async function getRequestEmail(request: Request) {
  try {
    const body: unknown = await request.clone().json();

    if (!body || typeof body !== "object" || !("email" in body)) {
      return null;
    }

    const email = (body as { email?: unknown }).email;
    return typeof email === "string" ? email : null;
  } catch {
    return null;
  }
}

async function getHostedAuthAllowlistResponse(request: Request) {
  if (!RESTRICTED_AUTH_PATHS.has(getAuthApiPath(request))) {
    return null;
  }

  const email = await getRequestEmail(request);
  if (isHostedEmailAllowed(email, env.HOSTED_ALLOWED_EMAILS)) {
    return null;
  }

  return jsonAuthError(HOSTED_SIGNUP_FORBIDDEN_MESSAGE, 403);
}

async function handleAuthRequest(request: Request) {
  if (!isHostedAuthMode(env.AUTH_MODE)) {
    return new Response("Not found", {
      status: 404,
    });
  }

  if (!hasHostedAuthConfig()) {
    return new Response("Missing Better Auth hosted configuration", {
      status: 500,
    });
  }

  if (request.method === "POST") {
    const allowlistResponse = await getHostedAuthAllowlistResponse(request);
    if (allowlistResponse) {
      return allowlistResponse;
    }
  }

  const auth = getAuth();
  return auth.handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return handleAuthRequest(request);
      },
      POST: async ({ request }: { request: Request }) => {
        return handleAuthRequest(request);
      },
    },
  },
});
