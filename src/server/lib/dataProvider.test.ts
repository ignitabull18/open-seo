import { describe, expect, it } from "vitest";
import { getSeoDataProviderName } from "@/server/lib/dataProvider";

describe("getSeoDataProviderName", () => {
  it("defaults to direct DataForSEO", () => {
    expect(getSeoDataProviderName({})).toBe("dataforseo");
    expect(getSeoDataProviderName({ DATAFORSEO_PROVIDER: "dataforseo" })).toBe(
      "dataforseo",
    );
  });

  it("enables Composio when configured", () => {
    expect(getSeoDataProviderName({ DATAFORSEO_PROVIDER: " composio " })).toBe(
      "composio",
    );
  });

  it("falls back to direct DataForSEO for unknown values", () => {
    expect(getSeoDataProviderName({ DATAFORSEO_PROVIDER: "unknown" })).toBe(
      "dataforseo",
    );
  });
});
