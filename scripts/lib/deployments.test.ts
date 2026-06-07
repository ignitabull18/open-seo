import { describe, expect, it } from "vitest";
import {
  latestDeployment,
  parseWranglerDeployVersion,
  parseWranglerDeploymentsList,
} from "./deployments";

describe("deployment parsing", () => {
  it("parses the current version id from deploy output", () => {
    expect(
      parseWranglerDeployVersion(
        "Uploaded open-seo\nCurrent Version ID: cc3fc2ff-7aa1-467f-aac0-6bbb3cf88211\n",
      ),
    ).toBe("cc3fc2ff-7aa1-467f-aac0-6bbb3cf88211");
  });

  it("parses deployments and returns the latest block", () => {
    const output = `
Created:     2026-06-07T02:23:44.901Z
Version(s):  (100%) 35589454-16d8-4945-ac6c-3ce6c8ccad8f

Created:     2026-06-07T02:28:39.508Z
Version(s):  (100%) cc3fc2ff-7aa1-467f-aac0-6bbb3cf88211
`;

    expect(parseWranglerDeploymentsList(output)).toHaveLength(2);
    expect(latestDeployment(output)).toEqual({
      createdAt: "2026-06-07T02:28:39.508Z",
      versionId: "cc3fc2ff-7aa1-467f-aac0-6bbb3cf88211",
    });
  });
});
