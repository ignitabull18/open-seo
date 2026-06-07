interface ReleaseVerificationInput {
  version: string;
  hasReleaseNotes: boolean;
  hasDockerfile: boolean;
  tagExists: boolean;
  deployConfig: string;
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

  return { failures, warnings };
}
