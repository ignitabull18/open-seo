import type { BillingCustomerContext } from "@/server/billing/subscription";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { AppError } from "@/server/lib/errors";

export type McpAuth = {
  userId: string;
  userEmail: string;
  organizationId: string;
  scopes: string[];
};

// Extras are stuffed onto the transport's authInfo so tool callbacks can read
// them without us having to thread them through every server.registerTool call.
type AuthInfoExtra = {
  mcp?: {
    auth: McpAuth;
    baseUrl: string;
  };
};

export type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

export function getAuth(extra: ToolExtra): McpAuth {
  const info = extra.authInfo as
    | (typeof extra.authInfo & { extra?: AuthInfoExtra })
    | undefined;
  const mcp = info?.extra?.mcp;
  if (!mcp) {
    throw new AppError("UNAUTHENTICATED", "MCP auth context missing");
  }
  return mcp.auth;
}

export function getBaseUrl(extra: ToolExtra): string {
  const info = extra.authInfo as
    | (typeof extra.authInfo & { extra?: AuthInfoExtra })
    | undefined;
  const baseUrl = info?.extra?.mcp?.baseUrl;
  if (!baseUrl) {
    throw new AppError("INTERNAL_ERROR", "Base URL missing from MCP context");
  }
  return baseUrl;
}

export function buildBillingCustomer(
  auth: McpAuth,
  projectId: string,
): BillingCustomerContext {
  return {
    userId: auth.userId,
    userEmail: auth.userEmail,
    organizationId: auth.organizationId,
    projectId,
  };
}

export function packAuthInfo(
  auth: McpAuth,
  baseUrl: string,
): { token: string; clientId: string; scopes: string[]; extra: AuthInfoExtra } {
  return {
    token: auth.userId, // Opaque to the SDK; we use extra for real data.
    clientId: auth.userId,
    scopes: auth.scopes,
    extra: { mcp: { auth, baseUrl } },
  };
}
