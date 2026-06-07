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
        deploymentState: {
          service: "open-seo",
          gitCommit: "abc",
          workerVersionId: "version",
        },
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
        deploymentState: {
          service: "open-seo",
          gitCommit: "abc",
          workerVersionId: "version",
        },
      }).warnings,
    ).toEqual(["Local git tag v1.2.3 does not exist yet"]);
  });

  it("validates deployment metadata", () => {
    expect(
      verifyRelease({
        version: "1.2.3",
        hasReleaseNotes: true,
        hasDockerfile: true,
        tagExists: true,
        deployConfig: '"open-seo" "workers_dev" "AUTH_MODE" "hosted"',
        deploymentState: {
          service: "wrong",
        },
      }).failures,
    ).toEqual([
      "Deployment metadata service is not open-seo",
      "Deployment metadata is missing workerVersionId",
      "Deployment metadata is missing gitCommit",
    ]);
  });
});
