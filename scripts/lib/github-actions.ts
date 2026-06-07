export interface WorkflowRun {
  headSha?: string;
  status?: string;
  conclusion?: string | null;
  displayTitle?: string;
  workflowName?: string;
  url?: string;
}

export function parseGithubTokenScopes(output: string) {
  const scopesLine = output
    .split(/\r?\n/)
    .find((line) => line.includes("Token scopes:"));
  return (
    scopesLine
      ?.match(/Token scopes:\s*(.+)$/)?.[1]
      ?.replace(/^'/, "")
      .replace(/'$/, "")
      ?.split(",")
      .map((scope) => scope.trim().replace(/^'/, "").replace(/'$/, ""))
      .filter(Boolean) ?? []
  );
}

export function hasActionsReadScope(scopes: string[]) {
  return scopes.includes("repo") || scopes.includes("actions:read");
}

export function hasWorkflowScope(scopes: string[]) {
  return scopes.includes("workflow");
}

export function selectRunsForCommit(runs: WorkflowRun[], commitSha: string) {
  return runs.filter((run) => run.headSha === commitSha);
}

export function summarizeRun(run: WorkflowRun) {
  return `${run.workflowName ?? "workflow"}: ${run.status ?? "unknown"}/${run.conclusion ?? "pending"} ${run.url ?? ""}`.trim();
}
