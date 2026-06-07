import { readdirSync } from "node:fs";

export const authSessionSmokePath = "/api/auth/get-session";

export function latestLocalMigrationName(dir = "drizzle") {
  return (
    readdirSync(dir)
      .filter((entry) => /^\d+_.*\.sql$/.test(entry))
      .sort()
      .at(-1) ?? null
  );
}

export function remoteMigrationsAreCurrent(
  output: string,
  latestMigration: string | null,
) {
  return (
    output.includes("No migrations to apply") ||
    (latestMigration !== null && output.includes(latestMigration))
  );
}

export function workflowListHasOpenSeoWorkflows(output: string) {
  return (
    output.includes("site-audit-workflow") &&
    output.includes("rank-check-workflow") &&
    output.includes("open-seo")
  );
}

export function workflowInstancesHealthy(output: string) {
  const lowered = output.toLowerCase();
  return !["errored", "failed", "terminated"].some((marker) =>
    lowered.includes(marker),
  );
}
