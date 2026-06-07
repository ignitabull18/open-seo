import { runCommand, runRequired } from "./lib/command";

const commitSha = runRequired("git", ["rev-parse", "HEAD"]).trim();
const branch = process.argv[2] ?? "main";
const result = runCommand("gh", [
  "run",
  "list",
  "--branch",
  branch,
  "--limit",
  "10",
  "--json",
  "databaseId,headSha,status,conclusion,displayTitle,workflowName,url",
]);

if (result.status !== 0) {
  console.warn("GitHub workflow lookup is unavailable in this environment.");
  console.warn(result.stderr || result.error?.message || "gh run list failed");
  process.exit(0);
}

const runs = JSON.parse(result.stdout || "[]") as Array<{
  headSha?: string;
  status?: string;
  conclusion?: string;
  displayTitle?: string;
  workflowName?: string;
  url?: string;
}>;
const matching = runs.filter((run) => run.headSha === commitSha);

if (matching.length === 0) {
  console.warn(
    `No GitHub Actions runs were returned for ${commitSha} on ${branch}. This can happen before GitHub indexes a fresh push or when the token cannot read Actions.`,
  );
  process.exit(0);
}

for (const run of matching) {
  console.log(
    `${run.workflowName}: ${run.status}/${run.conclusion ?? "pending"} ${run.url ?? ""}`,
  );
}
