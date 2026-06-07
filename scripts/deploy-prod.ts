import { writeFileSync } from "node:fs";
import { runCommand, runRequired } from "./lib/command";
import { parseWranglerDeployVersion } from "./lib/deployments";

const commitSha = runRequired("git", ["rev-parse", "HEAD"]).trim();
const deployedAt = new Date().toISOString();
const baseUrl =
  process.env.OPEN_SEO_PROD_URL ??
  "https://open-seo.lingering-rain-68b6.workers.dev";

runRequired("pnpm", ["run", "db:migrate:prod"]);
runRequired("pnpm", ["run", "build"], {
  ...process.env,
  VITE_COMMIT_SHA: commitSha,
});

const deploy = runCommand("wrangler", ["deploy"], {
  env: { ...process.env, VITE_COMMIT_SHA: commitSha },
});
process.stdout.write(deploy.stdout ?? "");
process.stderr.write(deploy.stderr ?? "");

if (deploy.status !== 0) {
  process.exit(deploy.status ?? 1);
}

const workerVersionId = parseWranglerDeployVersion(deploy.stdout ?? "");
if (!workerVersionId) {
  throw new Error(
    "Could not parse Current Version ID from wrangler deploy output",
  );
}

writeFileSync(
  "docs/deployment-state.json",
  `${JSON.stringify(
    {
      service: "open-seo",
      url: baseUrl,
      gitCommit: commitSha,
      workerVersionId,
      deployedAt,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `Deployment metadata written for Worker version ${workerVersionId}`,
);
