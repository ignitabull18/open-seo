import { describe, expect, it } from "vitest";
import {
  hasActionsReadScope,
  hasWorkflowScope,
  parseGithubTokenScopes,
  selectRunsForCommit,
  summarizeRun,
} from "./github-actions";

describe("github actions helpers", () => {
  it("parses token scopes from gh auth status output", () => {
    expect(
      parseGithubTokenScopes("  - Token scopes: 'gist', 'read:org', 'repo'"),
    ).toEqual(["gist", "read:org", "repo"]);
  });

  it("checks actions and workflow scopes independently", () => {
    expect(hasActionsReadScope(["repo"])).toBe(true);
    expect(hasWorkflowScope(["repo"])).toBe(false);
    expect(hasWorkflowScope(["repo", "workflow"])).toBe(true);
  });

  it("selects and summarizes runs for a commit", () => {
    const runs = selectRunsForCommit(
      [
        {
          headSha: "abc",
          workflowName: "CI",
          status: "completed",
          conclusion: "success",
        },
        { headSha: "def", workflowName: "CI", status: "queued" },
      ],
      "abc",
    );

    expect(runs).toHaveLength(1);
    expect(summarizeRun(runs[0])).toBe("CI: completed/success");
  });
});
