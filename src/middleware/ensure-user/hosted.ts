import { getAuth, hasHostedAuthConfig } from "@/lib/auth";
import { getActiveOrganizationId } from "@/lib/auth-session";
import {
  HOSTED_SIGNUP_FORBIDDEN_MESSAGE,
  isHostedEmailAllowed,
} from "@/lib/hosted-allowlist";
import { getOrCreateDefaultHostedOrganization } from "@/server/auth/default-hosted-organization";
import { AppError } from "@/server/lib/errors";
import { env } from "cloudflare:workers";
import type { EnsuredUserContext } from "./types";

async function requireHostedSession(headers: Headers) {
  if (!hasHostedAuthConfig()) {
    throw new AppError(
      "AUTH_CONFIG_MISSING",
      "Missing Better Auth hosted configuration",
    );
  }

  const session = await getAuth().api.getSession({ headers });

  if (!session?.user?.id || !session.user.email) {
    throw new AppError("UNAUTHENTICATED");
  }

  return session;
}

export async function resolveHostedContext(
  headers: Headers,
): Promise<EnsuredUserContext> {
  const session = await requireHostedSession(headers);

  if (!isHostedEmailAllowed(session.user.email, env.HOSTED_ALLOWED_EMAILS)) {
    throw new AppError("FORBIDDEN", HOSTED_SIGNUP_FORBIDDEN_MESSAGE);
  }

  const activeOrganizationId = getActiveOrganizationId(session);

  if (activeOrganizationId) {
    return {
      userId: session.user.id,
      userEmail: session.user.email,
      organizationId: activeOrganizationId,
    };
  }

  const authApi = getAuth().api;
  const organizationId = await getOrCreateDefaultHostedOrganization(
    session.user.id,
    (body) => authApi.createOrganization({ body }),
  );

  await authApi.setActiveOrganization({
    headers,
    body: { organizationId },
  });

  return {
    userId: session.user.id,
    userEmail: session.user.email,
    organizationId,
  };
}
