import { describe, expect, it } from "vitest";
import { formatR2Summary, summarizeR2Objects } from "./r2-cache";

describe("summarizeR2Objects", () => {
  it("summarizes count, bytes, dates, and expiry", () => {
    const summary = summarizeR2Objects(
      [
        {
          key: "dataforseo-cache/a",
          size: 3,
          last_modified: "2026-06-01T00:00:00.000Z",
          http_metadata: { cacheExpiry: "2026-06-10T00:00:00.000Z" },
        },
        {
          key: "dataforseo-cache/b",
          size: 7,
          last_modified: "2026-06-03T00:00:00.000Z",
          http_metadata: { cacheExpiry: "2026-06-09T00:00:00.000Z" },
        },
      ],
      new Date("2026-06-07T00:00:00.000Z").getTime(),
    );

    expect(summary).toMatchObject({
      count: 2,
      totalBytes: 10,
      oldest: "2026-06-01T00:00:00.000Z",
      newest: "2026-06-03T00:00:00.000Z",
      soonestExpiry: "2026-06-09T00:00:00.000Z",
      oldestAgeDays: 6,
    });
    expect(formatR2Summary(summary)).toContain("bytes=10");
  });
});
