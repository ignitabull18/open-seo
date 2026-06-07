interface ReleaseVerificationInput {
  version: string;
  hasReleaseNotes: boolean;
  hasDockerfile: boolean;
  tagExists: boolean;
  deployConfig: string;
  deploymentState?: {
    service?: string;
    url?: string;
    gitCommit?: string;
    workerVersionId?: string;
  } | null;
}

export function verifyRelease(input: ReleaseVerificationInput) {
  const failures: string[] = [];
  const warnings: string[] = [];
  const tag = `v${input.version}`;

  if (!input.hasReleaseNotes) {
    failures.push(`Missing release notes: release-notes/${tag}.md`);
  }

  if (!input.hasDockerfile) {
    failures.push("Missing Dockerfile.selfhost");
  }

  if (!input.tagExists) {
    warnings.push(`Local git tag ${tag} does not exist yet`);
  }

  for (const marker of ["open-seo", "workers_dev", "AUTH_MODE", "hosted"]) {
    if (!input.deployConfig.includes(marker)) {
      failures.push(
        `wrangler.jsonc is missing expected release marker: ${marker}`,
      );
    }
  }

  if (!input.deploymentState) {
    warnings.push("Missing deployment metadata: docs/deployment-state.json");
  } else {
    if (input.deploymentState.service !== "open-seo") {
      failures.push("Deployment metadata service is not open-seo");
    }
    if (!input.deploymentState.workerVersionId) {
      failures.push("Deployment metadata is missing workerVersionId");
    }
    if (!input.deploymentState.gitCommit) {
      failures.push("Deployment metadata is missing gitCommit");
    }
  }

  return { failures, warnings };
}
