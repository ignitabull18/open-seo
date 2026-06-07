export interface R2ObjectSummary {
  key?: string;
  size?: number;
  last_modified?: string;
  http_metadata?: { cacheExpiry?: string };
}

export function summarizeR2Objects(
  objects: R2ObjectSummary[],
  now = Date.now(),
) {
  let totalBytes = 0;
  let oldest: string | undefined;
  let newest: string | undefined;
  let soonestExpiry: string | undefined;

  for (const object of objects) {
    totalBytes += object.size ?? 0;
    if (object.last_modified) {
      if (!oldest || object.last_modified < oldest)
        oldest = object.last_modified;
      if (!newest || object.last_modified > newest)
        newest = object.last_modified;
    }
    const expiry = object.http_metadata?.cacheExpiry;
    if (expiry && (!soonestExpiry || expiry < soonestExpiry)) {
      soonestExpiry = expiry;
    }
  }

  return {
    count: objects.length,
    totalBytes,
    oldest,
    newest,
    soonestExpiry,
    oldestAgeDays: oldest
      ? Math.max(0, Math.round((now - new Date(oldest).getTime()) / 86_400_000))
      : undefined,
  };
}

export function formatR2Summary(
  summary: ReturnType<typeof summarizeR2Objects>,
) {
  return [
    `count=${summary.count}`,
    `bytes=${summary.totalBytes}`,
    summary.oldest ? `oldest=${summary.oldest}` : "",
    summary.newest ? `newest=${summary.newest}` : "",
    summary.oldestAgeDays === undefined
      ? ""
      : `oldestAge=${summary.oldestAgeDays}d`,
    summary.soonestExpiry ? `soonestExpiry=${summary.soonestExpiry}` : "",
  ]
    .filter(Boolean)
    .join("\t");
}
