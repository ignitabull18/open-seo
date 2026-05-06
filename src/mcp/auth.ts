import { eq } from "drizzle-orm";
import { db } from "@/db";
import { delegatedUsers, user } from "@/db/schema";
import { TokenService } from "@/server/features/tokens/services/TokenService";
import type { McpAuth } from "@/mcp/context";

async function lookupUserEmail(userId: string): Promise<string | null> {
  // Better Auth user table first (hosted mode).
  const hostedUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { email: true },
  });
  if (hostedUser?.email) return hostedUser.email;
  // Fall back to delegated_users (cloudflare_access / local_noauth).
  const delegated = await db.query.delegatedUsers.findFirst({
    where: eq(delegatedUsers.id, userId),
    columns: { email: true },
  });
  return delegated?.email ?? null;
}

const BEARER_PREFIX = "Bearer ";

type AuthResolution =
  | { ok: true; auth: McpAuth }
  | { ok: false; status: number; message: string };

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  if (!header.startsWith(BEARER_PREFIX)) return null;
  const token = header.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

export async function resolveMcpAuth(
  request: Request,
): Promise<AuthResolution> {
  const token = extractBearerToken(request);
  if (!token) {
    return {
      ok: false,
      status: 401,
      message: "Missing Authorization: Bearer <token> header",
    };
  }
  const validated = await TokenService.validate(token);
  if (!validated) {
    return { ok: false, status: 401, message: "Invalid or expired token" };
  }
  const email = await lookupUserEmail(validated.userId);
  return {
    ok: true,
    auth: {
      userId: validated.userId,
      userEmail: email ?? `${validated.userId}@mcp.openseo.so`,
      organizationId: validated.organizationId,
      scopes: validated.scopes,
    },
  };
}
