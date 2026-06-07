import {
  HOSTED_SIGNUP_FORBIDDEN_MESSAGE,
  isHostedEmailAllowed,
} from "./hosted-allowlist";

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

export async function getHostedAuthAllowlistResponse(
  request: Request,
  rawAllowlist: string | undefined,
) {
  if (!RESTRICTED_AUTH_PATHS.has(getAuthApiPath(request))) {
    return null;
  }

  const email = await getRequestEmail(request);
  if (isHostedEmailAllowed(email, rawAllowlist)) {
    return null;
  }

  return jsonAuthError(HOSTED_SIGNUP_FORBIDDEN_MESSAGE, 403);
}
