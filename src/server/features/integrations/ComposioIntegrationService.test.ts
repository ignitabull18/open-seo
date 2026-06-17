import { beforeEach, describe, expect, it, vi } from "vitest";

const { composioMock } = vi.hoisted(() => ({
  composioMock: {
    authConfigs: {
      list: vi.fn(),
    },
    connectedAccounts: {
      list: vi.fn(),
      link: vi.fn(),
    },
  },
}));

vi.mock("@/server/lib/composioClient", () => ({
  getComposioClient: vi.fn(() => Promise.resolve(composioMock)),
}));

describe("ComposioIntegrationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    composioMock.authConfigs.list.mockResolvedValue({
      items: [],
    });
    composioMock.connectedAccounts.list.mockResolvedValue({
      items: [],
    });
  });

  it("maps enabled auth configs and connected accounts into settings statuses", async () => {
    composioMock.authConfigs.list.mockImplementation(
      ({ toolkit }: { toolkit: string }) =>
        Promise.resolve({
          items:
            toolkit === "gmail"
              ? [
                  {
                    id: "ac_gmail",
                    name: "Gmail",
                    status: "ENABLED",
                    authScheme: "OAUTH2",
                    isComposioManaged: true,
                  },
                ]
              : [],
        }),
    );
    composioMock.connectedAccounts.list.mockResolvedValue({
      items: [
        {
          id: "ca_gmail",
          status: "ACTIVE",
          statusReason: null,
          toolkit: { slug: "gmail" },
          updatedAt: "2026-06-16T00:00:00.000Z",
        },
      ],
    });
    const { listComposioIntegrationStatuses } =
      await import("@/server/features/integrations/ComposioIntegrationService");

    const statuses = await listComposioIntegrationStatuses("user_123");
    const gmail = statuses.find((status) => status.slug === "gmail");

    expect(gmail).toMatchObject({
      slug: "gmail",
      connectable: true,
      authConfig: {
        id: "ac_gmail",
        name: "Gmail",
        authScheme: "OAUTH2",
        isComposioManaged: true,
      },
      connectedAccount: {
        id: "ca_gmail",
        status: "ACTIVE",
      },
    });
  });

  it("creates a Composio Connect Link for a known toolkit", async () => {
    composioMock.authConfigs.list.mockResolvedValue({
      items: [
        {
          id: "ac_slack",
          name: "Slack",
          status: "ENABLED",
        },
      ],
    });
    composioMock.connectedAccounts.link.mockResolvedValue({
      id: "ca_slack",
      redirectUrl: "https://composio.dev/connect/ca_slack",
    });
    const { createComposioConnectLink } =
      await import("@/server/features/integrations/ComposioIntegrationService");

    const result = await createComposioConnectLink({
      userId: "user_123",
      toolkitSlug: "slack",
      callbackUrl: "https://app.openseo.so/settings",
    });

    expect(result).toEqual({
      id: "ca_slack",
      redirectUrl: "https://composio.dev/connect/ca_slack",
    });
    expect(composioMock.connectedAccounts.link).toHaveBeenCalledWith(
      "user_123",
      "ac_slack",
      { callbackUrl: "https://app.openseo.so/settings" },
    );
  });
});
