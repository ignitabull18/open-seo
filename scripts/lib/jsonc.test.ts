import { describe, expect, it } from "vitest";
import { stripJsonc } from "./jsonc";
import { bindingNames } from "../verify-bindings";

describe("stripJsonc", () => {
  it("removes comments and trailing commas while preserving strings", () => {
    const parsed = JSON.parse(
      stripJsonc(`{
        // comment
        "url": "https://example.com//kept",
        "vars": { "AUTH_MODE": "hosted", },
        "r2_buckets": [{ "binding": "R2", }],
      }`),
    );

    expect(parsed.url).toBe("https://example.com//kept");
    expect(parsed.vars.AUTH_MODE).toBe("hosted");
    expect(parsed.r2_buckets[0].binding).toBe("R2");
  });
});

describe("bindingNames", () => {
  it("extracts vars and Cloudflare binding names", () => {
    expect(
      bindingNames({
        vars: { AUTH_MODE: "hosted" },
        kv_namespaces: [{ binding: "KV" }],
        d1_databases: [{ binding: "DB" }],
        r2_buckets: [{ binding: "R2" }],
        workflows: [{ binding: "RANK_CHECK_WORKFLOW" }],
      }),
    ).toEqual(["AUTH_MODE", "DB", "KV", "R2", "RANK_CHECK_WORKFLOW"]);
  });
});
