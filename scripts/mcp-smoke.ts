const baseUrl =
  process.env.OPEN_SEO_PROD_URL ??
  "https://open-seo.lingering-rain-68b6.workers.dev";

async function fetchStatus(path: string, init?: RequestInit) {
  const response = await fetch(new URL(path, baseUrl), init);
  console.log(`${response.status} ${path}`);
  return response;
}

const metadataCandidates = [
  "/.well-known/oauth-authorization-server",
  "/.well-known/oauth-protected-resource/mcp",
  "/.well-known/oauth-protected-resource",
];

let metadataReachable = false;
for (const path of metadataCandidates) {
  const response = await fetchStatus(path);
  if (response.status >= 200 && response.status < 400) {
    metadataReachable = true;
    break;
  }
}

if (!metadataReachable) {
  throw new Error("No hosted MCP OAuth metadata endpoint returned 2xx/3xx");
}

const unauthenticatedMcp = await fetchStatus("/mcp", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {},
  }),
});

if (![401, 403].includes(unauthenticatedMcp.status)) {
  throw new Error(
    `Unauthenticated hosted /mcp should be protected, got ${unauthenticatedMcp.status}`,
  );
}

console.log(`Hosted MCP smoke checks passed for ${baseUrl}`);

export {};
