interface DeploymentSummary {
  createdAt: string;
  versionId: string;
}

interface VersionSummary {
  createdAt: string;
  versionId: string;
  tag?: string;
}

export function parseWranglerDeployVersion(output: string) {
  return output.match(/Current Version ID:\s*([a-f0-9-]+)/i)?.[1] ?? null;
}

export function parseWranglerDeploymentsList(output: string) {
  const deployments: DeploymentSummary[] = [];
  const blocks = output.split(/\n(?=Created:\s+)/);

  for (const block of blocks) {
    const createdAt = block.match(/Created:\s+([0-9T:.Z-]+)/)?.[1];
    const versionId = block.match(/\(100%\)\s+([a-f0-9-]+)/i)?.[1];
    if (createdAt && versionId) {
      deployments.push({ createdAt, versionId });
    }
  }

  return deployments;
}

export function latestDeployment(output: string) {
  return parseWranglerDeploymentsList(output).at(-1) ?? null;
}

export function parseWranglerVersionsList(output: string) {
  const versions: VersionSummary[] = [];
  const blocks = output.split(/\n(?=Created:\s+)/);

  for (const block of blocks) {
    const createdAt = block.match(/Created:\s+([0-9T:.Z-]+)/)?.[1];
    const versionId = block.match(/ID:\s+([a-f0-9-]+)/i)?.[1];
    const tag = block.match(/Tag:\s+([^\n]+)/)?.[1]?.trim();
    if (createdAt && versionId) {
      versions.push({ createdAt, versionId, tag });
    }
  }

  return versions;
}
