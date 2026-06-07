import { runCommand, runRequired } from "./lib/command";
import {
  hasActionsReadScope,
  hasWorkflowScope,
  parseGithubTokenScopes,
  selectRunsForCommit,
  summarizeRun,
  type WorkflowRun,
} from "./lib/github-actions";

const commitSha = runRequired("git", ["rev-parse", "HEAD"]).trim();
const branch = process.argv[2] ?? "main";

const authStatus = runCommand("gh", ["auth", "status", "-h", "github.com"]);
if (authStatus.stdout || authStatus.stderr) {
  const scopes = parseGithubTokenScopes(
    `${authStatus.stdout ?? ""}\n${authStatus.stderr ?? ""}`,
  );
  if (scopes.length > 0) {
    console.log(`GitHub token scopes: ${scopes.join(", ")}`);
    if (!hasWorkflowScope(scopes)) {
      console.warn(
        "GitHub token is missing workflow scope; workflow file pushes require `gh auth refresh -h github.com -s workflow`.",
      );
    }
    if (!hasActionsReadScope(scopes)) {
      console.warn("GitHub token may not be able to read Actions runs.");
    }
  }
}

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

let runs: WorkflowRun[] = [];
if (result.status === 0) {
  runs = JSON.parse(result.stdout || "[]") as WorkflowRun[];
} else {
  console.warn("GitHub workflow lookup via `gh run list` is unavailable.");
  console.warn(result.stderr || result.error?.message || "gh run list failed");
}

if (runs.length === 0) {
  const api = runCommand("gh", [
    "api",
    `repos/ignitabull18/open-seo/actions/runs?branch=${encodeURIComponent(branch)}&head_sha=${encodeURIComponent(commitSha)}&per_page=10`,
  ]);
  if (api.status === 0) {
    const body = JSON.parse(api.stdout || "{}") as {
      workflow_runs?: Array<{
        head_sha?: string;
        status?: string;
        conclusion?: string | null;
        display_title?: string;
        name?: string;
        html_url?: string;
      }>;
    };
    runs = (body.workflow_runs ?? []).map((run) => ({
      headSha: run.head_sha,
      status: run.status,
      conclusion: run.conclusion,
      displayTitle: run.display_title,
      workflowName: run.name,
      url: run.html_url,
    }));
  } else {
    console.warn("GitHub workflow lookup via REST API is unavailable.");
    console.warn(api.stderr || api.error?.message || "gh api failed");
  }
}

const matching = selectRunsForCommit(runs, commitSha);

if (matching.length === 0) {
  console.warn(
    `No GitHub Actions runs were returned for ${commitSha} on ${branch}. This can happen before GitHub indexes a fresh push or when the token cannot read Actions.`,
  );
  process.exit(0);
}

for (const run of matching) {
  console.log(summarizeRun(run));
}
