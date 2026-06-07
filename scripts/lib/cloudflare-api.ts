import { loadJsonc } from "./jsonc";

interface WranglerConfig {
  account_id?: string;
  r2_buckets?: Array<{ binding?: string; bucket_name?: string }>;
}

export function getCloudflareAccountId() {
  return (
    process.env.CLOUDFLARE_ACCOUNT_ID ??
    (loadJsonc("wrangler.jsonc") as WranglerConfig).account_id
  );
}

export async function cloudflareApi<T>(path: string) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error(
      "CLOUDFLARE_API_TOKEN is required for Cloudflare API calls",
    );
  }

  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  });
  const body = (await response.json()) as {
    success: boolean;
    result?: T;
    errors?: Array<{ message?: string }>;
  };

  if (!response.ok || !body.success) {
    throw new Error(
      body.errors?.map((error) => error.message).join("; ") ||
        `Cloudflare API request failed with HTTP ${response.status}`,
    );
  }

  return body.result as T;
}
