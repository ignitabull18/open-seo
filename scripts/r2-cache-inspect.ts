import { cloudflareApi, getCloudflareAccountId } from "./lib/cloudflare-api";
import { runCommand } from "./lib/command";

const bucket = process.env.OPEN_SEO_R2_BUCKET ?? "open-seo";
const prefix = process.env.OPEN_SEO_R2_PREFIX ?? "dataforseo-cache/";
const command = process.argv[2] ?? "info";

function wrangler(args: string[]) {
  const result = runCommand("wrangler", args, { stdio: "inherit" });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (command === "info") {
  console.log(`Inspecting bucket ${bucket}; cache prefix is ${prefix}`);
  wrangler(["r2", "bucket", "info", bucket]);
} else if (command === "list") {
  const accountId = getCloudflareAccountId();
  const params = new URLSearchParams({ prefix });
  const objects = await cloudflareApi<
    Array<{
      key?: string;
      size?: number;
      last_modified?: string;
      http_metadata?: { cacheExpiry?: string };
    }>
  >(`/accounts/${accountId}/r2/buckets/${bucket}/objects?${params}`);
  const now = Date.now();
  for (const object of objects) {
    const ageMs = object.last_modified
      ? now - new Date(object.last_modified).getTime()
      : undefined;
    const ttlMs = object.http_metadata?.cacheExpiry
      ? new Date(object.http_metadata.cacheExpiry).getTime() - now
      : undefined;
    console.log(
      [
        object.key,
        object.size === undefined ? "" : `${object.size} bytes`,
        object.last_modified
          ? `age=${Math.max(0, Math.round((ageMs ?? 0) / 86_400_000))}d`
          : "",
        object.http_metadata?.cacheExpiry
          ? `ttl=${Math.round((ttlMs ?? 0) / 86_400_000)}d`
          : "",
      ]
        .filter(Boolean)
        .join("\t"),
    );
  }
  console.log(`Listed ${objects.length} object(s) under ${prefix}`);
} else if (command === "delete") {
  const key = process.argv[3];
  if (!key) {
    console.error("Usage: pnpm run r2:cache -- delete <object-key>");
    process.exit(1);
  }
  if (!key.startsWith(prefix)) {
    console.error(`Refusing to delete key outside ${prefix}: ${key}`);
    process.exit(1);
  }
  wrangler(["r2", "object", "delete", `${bucket}/${key}`]);
} else {
  console.error(
    [
      "Usage:",
      "  pnpm run r2:cache -- info",
      "  pnpm run r2:cache -- list",
      "  pnpm run r2:cache -- delete dataforseo-cache/<key>",
    ].join("\n"),
  );
  process.exit(1);
}
