export interface HealthPayload {
  ok?: boolean;
  service?: string;
  commitSha?: string;
  authMode?: string;
  bindings?: Record<string, boolean>;
}

export function validateHealthPayload(
  payload: HealthPayload,
  expectedCommitSha?: string,
) {
  const failures: string[] = [];

  if (!payload.ok) failures.push("health ok flag is false");
  if (payload.service !== "open-seo")
    failures.push("health service is not open-seo");
  if (expectedCommitSha && payload.commitSha !== expectedCommitSha) {
    failures.push(
      `health commit ${payload.commitSha ?? "unknown"} does not match ${expectedCommitSha}`,
    );
  }

  for (const [binding, available] of Object.entries(payload.bindings ?? {})) {
    if (!available) failures.push(`health binding ${binding} is unavailable`);
  }

  return failures;
}
