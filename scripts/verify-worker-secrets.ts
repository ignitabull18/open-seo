import { runRequired } from "./lib/command";
import { loadJsonc } from "./lib/jsonc";

const requiredSecrets = ["BETTER_AUTH_SECRET", "DATAFORSEO_API_KEY"];
const config = loadJsonc("wrangler.jsonc") as { account_id?: string };
const env = {
  ...process.env,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ?? config.account_id,
};

const output = runRequired("wrangler", ["secret", "list"], env);
const missing = requiredSecrets.filter((secret) => !output.includes(secret));

if (missing.length > 0) {
  console.error(`Missing Worker secrets: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Worker secrets verified: ${requiredSecrets.join(", ")}`);
