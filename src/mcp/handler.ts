import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { resolveMcpAuth } from "@/mcp/auth";
import { packAuthInfo } from "@/mcp/context";
import { deriveBaseUrlFromRequest } from "@/mcp/urls";
import { whoamiTool } from "@/mcp/tools/whoami";
import { listProjectsTool } from "@/mcp/tools/list-projects";

const SERVER_INFO = {
  name: "OpenSEO",
  version: "0.1.0",
  title: "OpenSEO MCP Server",
} as const;

function buildServer() {
  const server = new McpServer(SERVER_INFO);
  // Each tool's schema/handler is checked individually so generics resolve.
  server.registerTool(whoamiTool.name, whoamiTool.config, whoamiTool.handler);
  server.registerTool(
    listProjectsTool.name,
    listProjectsTool.config,
    listProjectsTool.handler,
  );
  return server;
}

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS, DELETE",
  "access-control-allow-headers":
    "authorization, content-type, mcp-session-id, mcp-protocol-version",
  "access-control-max-age": "86400",
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonError(status: number, message: string): Response {
  return withCors(
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
}

export async function mcpFetch(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  const auth = await resolveMcpAuth(request);
  if (!auth.ok) {
    return jsonError(auth.status, auth.message);
  }

  const baseUrl = deriveBaseUrlFromRequest(request);

  // Stateless: new transport + server per request. The McpServer is light to
  // construct (it's a thin wrapper around request handlers). This avoids any
  // shared mutable state between concurrent requests.
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
    enableJsonResponse: true,
  });
  const server = buildServer();
  await server.connect(transport);

  try {
    return withCors(
      await transport.handleRequest(request, {
        authInfo: packAuthInfo(auth.auth, baseUrl),
      }),
    );
  } finally {
    void transport.close().catch(() => {
      // The transport may already be closed; ignore.
    });
  }
}
