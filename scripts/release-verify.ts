import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  version: string;
};
const version = packageJson.version;
const tag = `v${version}`;
const releaseNotesPath = `release-notes/${tag}.md`;

function fail(message: string) {
  console.error(message);
  process.exitCode = 1;
}

if (!existsSync(releaseNotesPath)) {
  fail(`Missing release notes: ${releaseNotesPath}`);
}

if (!existsSync("Dockerfile.selfhost")) {
  fail("Missing Dockerfile.selfhost");
}

const tagCheck = spawnSync("git", ["rev-parse", "--verify", tag], {
  encoding: "utf8",
});
if (tagCheck.status !== 0) {
  console.warn(`Local git tag ${tag} does not exist yet`);
} else {
  console.log(`Local git tag exists: ${tag}`);
}

const deployConfig = readFileSync("wrangler.jsonc", "utf8");
for (const marker of ["open-seo", "workers_dev", "AUTH_MODE", "hosted"]) {
  if (!deployConfig.includes(marker)) {
    fail(`wrangler.jsonc is missing expected release marker: ${marker}`);
  }
}

console.log(`Release verification complete for ${tag}`);
