import { existsSync, readFileSync } from "node:fs";
import { latestDeployment } from "./lib/deployments";
import { runRequired } from "./lib/command";
import { loadJsonc } from "./lib/jsonc";

const baseUrl =
  process.env.OPEN_SEO_PROD_URL ??
  "https://open-seo.lingering-rain-68b6.workers.dev";
const wranglerConfig = loadJsonc("wrangler.jsonc") as { account_id?: string };
const wranglerEnv = {
  ...process.env,
  CLOUDFLARE_ACCOUNT_ID:
    process.env.CLOUDFLARE_ACCOUNT_ID ?? wranglerConfig.account_id,
};

function wrangler(args: string[]) {
  return runRequired("wrangler", args, wranglerEnv);
}

async function expectStatus(
  path: string,
  expected: number | ((status: number) => boolean),
  init?: RequestInit,
) {
  const response = await fetch(new URL(path, baseUrl), init);
  const pass =
    typeof expected === "number"
      ? response.status === expected
      : expected(response.status);

  if (!pass) {
    throw new Error(`${path} returned ${response.status}`);
  }

  console.log(`${response.status} ${path}`);
}

await expectStatus("/", 200);
await expectStatus("/sign-up", 200);
await expectStatus("/sign-in", 200);
await expectStatus("/api/auth/get-session", (status) =>
  [200, 401].includes(status),
);

const healthResponse = await fetch(new URL("/health", baseUrl));
if (healthResponse.status !== 200) {
  throw new Error(`/health returned ${healthResponse.status}`);
}
const health = (await healthResponse.json()) as {
  ok?: boolean;
  service?: string;
  commitSha?: string;
  bindings?: Record<string, boolean>;
};
if (!health.ok || health.service !== "open-seo") {
  throw new Error(
    `/health returned unexpected payload: ${JSON.stringify(health)}`,
  );
}
for (const [binding, available] of Object.entries(health.bindings ?? {})) {
  if (!available) throw new Error(`/health reports missing binding ${binding}`);
}
console.log(`200 /health commit=${health.commitSha ?? "unknown"}`);

for (const path of ["/api/auth/sign-up/email", "/api/auth/sign-in/email"]) {
  await expectStatus(path, 403, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "not-jeremy@example.com",
      password: "this-is-only-a-smoke-test",
    }),
  });
}

const secrets = wrangler(["secret", "list"]);
for (const secret of ["BETTER_AUTH_SECRET", "DATAFORSEO_API_KEY"]) {
  if (!secrets.includes(secret)) {
    throw new Error(`Missing expected Worker secret: ${secret}`);
  }
}
console.log("Worker secrets include required production entries");

const jeremyUser = wrangler([
  "d1",
  "execute",
  "DB",
  "--remote",
  "--command",
  "select email from user where email = 'jeremy@ignitabull.com' limit 1;",
]);
if (!jeremyUser.includes("jeremy@ignitabull.com")) {
  throw new Error("Production D1 did not return the Jeremy user row");
}
console.log("Production D1 contains the hosted Jeremy account");

const migrations = wrangler(["d1", "migrations", "list", "DB", "--remote"]);
if (
  !migrations.includes("No migrations to apply") &&
  !migrations.includes("0014_tag_color.sql")
) {
  throw new Error("Remote D1 migrations are not up to date");
}
console.log("Remote D1 migrations are up to date");

const lifecycle = wrangler(["r2", "bucket", "lifecycle", "list", "open-seo"]);
if (
  !lifecycle.includes("dataforseo-cache-expiry") ||
  !lifecycle.includes("dataforseo-cache/")
) {
  throw new Error("R2 lifecycle rule dataforseo-cache-expiry was not found");
}
console.log("R2 lifecycle rule dataforseo-cache-expiry is present");

const wranglerConfigText = readFileSync("wrangler.jsonc", "utf8");
for (const marker of [
  '"observability"',
  '"enabled": true',
  "site-audit-workflow",
  "rank-check-workflow",
]) {
  if (!wranglerConfigText.includes(marker)) {
    throw new Error(`wrangler.jsonc missing operational marker ${marker}`);
  }
}
console.log("Wrangler config includes observability and workflow bindings");

const deploymentsOutput = wrangler([
  "deployments",
  "list",
  "--name",
  "open-seo",
]);
const latest = latestDeployment(deploymentsOutput);
if (!latest) {
  throw new Error("Could not parse latest deployment from Wrangler output");
}
if (existsSync("docs/deployment-state.json")) {
  const state = JSON.parse(
    readFileSync("docs/deployment-state.json", "utf8"),
  ) as { workerVersionId?: string };
  if (state.workerVersionId && state.workerVersionId !== latest.versionId) {
    throw new Error(
      `Deployment metadata version ${state.workerVersionId} does not match latest Worker deployment ${latest.versionId}`,
    );
  }
}
console.log(
  `Latest deployment ${latest.versionId} created ${latest.createdAt}`,
);
console.log(`Production smoke checks passed for ${baseUrl}`);
