export interface R2ObjectSummary {
  key?: string;
  size?: number;
  last_modified?: string;
  http_metadata?: { cacheExpiry?: string };
}

interface R2ListPage {
  objects: R2ObjectSummary[];
  cursor?: string;
  truncated: boolean;
}

export function normalizeR2ListPage(page: unknown): R2ListPage {
  if (Array.isArray(page)) {
    return { objects: page as R2ObjectSummary[], truncated: false };
  }

  if (!page || typeof page !== "object") {
    throw new Error("R2 list response was not an object or array");
  }

  const record = page as {
    objects?: unknown;
    cursor?: unknown;
    truncated?: unknown;
  };

  return {
    objects: Array.isArray(record.objects)
      ? (record.objects as R2ObjectSummary[])
      : [],
    cursor: typeof record.cursor === "string" ? record.cursor : undefined,
    truncated: record.truncated === true,
  };
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
