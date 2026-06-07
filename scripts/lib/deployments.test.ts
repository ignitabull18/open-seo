import { describe, expect, it } from "vitest";
import {
  latestDeployment,
  parseWranglerDeployVersion,
  parseWranglerDeploymentsList,
  parseWranglerVersionsList,
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

  it("parses versions list output", () => {
    const output = `
Created:  2026-06-07T05:16:19.253Z
Tag:      latest
ID:       c40f1f9c-21f6-43b7-a820-9c6cfac5fb40

Created:  2026-06-07T04:43:20.184Z
ID:       e5b066f7-a819-401b-8022-a14309fedaaa
`;

    expect(parseWranglerVersionsList(output)).toEqual([
      {
        createdAt: "2026-06-07T05:16:19.253Z",
        versionId: "c40f1f9c-21f6-43b7-a820-9c6cfac5fb40",
        tag: "latest",
      },
      {
        createdAt: "2026-06-07T04:43:20.184Z",
        versionId: "e5b066f7-a819-401b-8022-a14309fedaaa",
      },
    ]);
  });
});
