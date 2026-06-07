import { describe, expect, it } from "vitest";
import { verifyRelease } from "./release";

describe("verifyRelease", () => {
  it("reports missing release notes and dockerfile", () => {
    expect(
      verifyRelease({
        version: "1.2.3",
        hasReleaseNotes: false,
        hasDockerfile: false,
        tagExists: true,
        deployConfig: '"open-seo" "workers_dev" "AUTH_MODE" "hosted"',
      }).failures,
    ).toEqual([
      "Missing release notes: release-notes/v1.2.3.md",
      "Missing Dockerfile.selfhost",
    ]);
  });

  it("warns when the local tag does not exist", () => {
    expect(
      verifyRelease({
        version: "1.2.3",
        hasReleaseNotes: true,
        hasDockerfile: true,
        tagExists: false,
        deployConfig: '"open-seo" "workers_dev" "AUTH_MODE" "hosted"',
      }).warnings,
    ).toEqual(["Local git tag v1.2.3 does not exist yet"]);
  });
});
