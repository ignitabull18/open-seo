import { describe, expect, it } from "vitest";
import {
  authSessionSmokePath,
  remoteMigrationsAreCurrent,
  workflowInstancesHealthy,
  workflowListHasOpenSeoWorkflows,
} from "./prod-smoke";

describe("prod smoke helpers", () => {
  it("uses the Better Auth get-session endpoint", () => {
    expect(authSessionSmokePath).toBe("/api/auth/get-session");
  });

  it("accepts current remote migration output", () => {
    expect(
      remoteMigrationsAreCurrent("No migrations to apply!", "0014_x.sql"),
    ).toBe(true);
    expect(remoteMigrationsAreCurrent("0014_x.sql", "0014_x.sql")).toBe(true);
    expect(remoteMigrationsAreCurrent("0013_x.sql", "0014_x.sql")).toBe(false);
  });

  it("finds OpenSEO workflows in Wrangler output", () => {
    expect(
      workflowListHasOpenSeoWorkflows(
        "site-audit-workflow open-seo\nrank-check-workflow open-seo",
      ),
    ).toBe(true);
  });

  it("flags failed workflow instance output", () => {
    expect(workflowInstancesHealthy("There are no instances")).toBe(true);
    expect(workflowInstancesHealthy("status failed")).toBe(false);
  });
});
