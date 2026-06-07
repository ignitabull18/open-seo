import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { verifyRelease } from "./lib/release";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  version: string;
};
const version = packageJson.version;
const tag = `v${version}`;
const releaseNotesPath = `release-notes/${tag}.md`;

const tagCheck = spawnSync("git", ["rev-parse", "--verify", tag], {
  encoding: "utf8",
});

const result = verifyRelease({
  version,
  hasReleaseNotes: existsSync(releaseNotesPath),
  hasDockerfile: existsSync("Dockerfile.selfhost"),
  tagExists: tagCheck.status === 0,
  deployConfig: readFileSync("wrangler.jsonc", "utf8"),
  deploymentState: existsSync("docs/deployment-state.json")
    ? (JSON.parse(readFileSync("docs/deployment-state.json", "utf8")) as {
        service?: string;
        url?: string;
        gitCommit?: string;
        workerVersionId?: string;
      })
    : null,
});

for (const warning of result.warnings) console.warn(warning);
for (const failure of result.failures) console.error(failure);

if (tagCheck.status === 0) {
  console.log(`Local git tag exists: ${tag}`);
}

console.log(`Release verification complete for ${tag}`);
if (result.failures.length > 0) process.exit(1);
