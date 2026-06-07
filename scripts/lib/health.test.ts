import { describe, expect, it } from "vitest";
import { validateHealthPayload } from "./health";

describe("validateHealthPayload", () => {
  it("accepts the expected production health shape", () => {
    expect(
      validateHealthPayload(
        {
          ok: true,
          service: "open-seo",
          commitSha: "abc",
          bindings: { DB: true, R2: true },
        },
        "abc",
      ),
    ).toEqual([]);
  });

  it("reports commit and binding drift", () => {
    expect(
      validateHealthPayload(
        {
          ok: true,
          service: "open-seo",
          commitSha: "old",
          bindings: { DB: false },
        },
        "new",
      ),
    ).toEqual([
      "health commit old does not match new",
      "health binding DB is unavailable",
    ]);
  });
});
