import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  envMock,
  proxyExecuteMock,
  getOptionalEnvValueMock,
  getRequiredEnvValueMock,
} = vi.hoisted(() => {
  const envValues: Record<string, string | undefined> = {
    COMPOSIO_API_KEY: "cmp_key",
    COMPOSIO_DATAFORSEO_TOOLKIT_VERSION: undefined as string | undefined,
    COMPOSIO_DATAFORSEO_CONNECTED_ACCOUNT_ID: undefined as string | undefined,
    DATAFORSEO_API_KEY: btoa("dataforseo-login:dataforseo-password"),
  };

  return {
    envMock: envValues,
    proxyExecuteMock: vi.fn(),
    getOptionalEnvValueMock: vi.fn((name: string) => {
      const value = envValues[name];
      return Promise.resolve(typeof value === "string" ? value : undefined);
    }),
    getRequiredEnvValueMock: vi.fn((name: string) => {
      const value = envValues[name];
      if (typeof value === "string" && value.length > 0) {
        return Promise.resolve(value);
      }
      return Promise.reject(
        new Error(`Missing required environment variable: ${name}`),
      );
    }),
  };
});

const composioConstructorMock = vi.hoisted(() =>
  vi.fn(() => ({
    tools: {
      proxyExecute: proxyExecuteMock,
    },
  })),
);

vi.mock("@/server/lib/runtime-env", () => ({
  getOptionalEnvValue: getOptionalEnvValueMock,
  getRequiredEnvValue: getRequiredEnvValueMock,
}));

vi.mock("@composio/core", () => ({
  Composio: composioConstructorMock,
}));

describe("proxyDataforseoRequestWithComposio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.COMPOSIO_API_KEY = "cmp_key";
    envMock.COMPOSIO_DATAFORSEO_TOOLKIT_VERSION = undefined;
    envMock.COMPOSIO_DATAFORSEO_CONNECTED_ACCOUNT_ID = undefined;
    envMock.DATAFORSEO_API_KEY = btoa("dataforseo-login:dataforseo-password");
  });

  it("routes DataForSEO requests through Composio with custom Basic auth", async () => {
    proxyExecuteMock.mockResolvedValue({
      successful: true,
      data: { status_code: 20000 },
    });
    const { proxyDataforseoRequestWithComposio } =
      await import("@/server/lib/composioDataforseo");

    const result = await proxyDataforseoRequestWithComposio({
      path: "/v3/appendix/user_data",
      method: "GET",
    });

    expect(result).toEqual({ status_code: 20000 });
    expect(composioConstructorMock).toHaveBeenCalledWith({
      apiKey: "cmp_key",
      toolkitVersions: { dataforseo: "20260429_00" },
    });
    expect(proxyExecuteMock).toHaveBeenCalledWith({
      endpoint: "/v3/appendix/user_data",
      method: "GET",
      body: undefined,
      customConnectionData: {
        authScheme: "BASIC",
        toolkitSlug: "dataforseo",
        val: {
          status: "ACTIVE",
          username: "dataforseo-login",
          password: "dataforseo-password",
          base_url: "https://api.dataforseo.com",
        },
      },
    });
  });

  it("uses a configured Composio connected account when present", async () => {
    envMock.COMPOSIO_DATAFORSEO_CONNECTED_ACCOUNT_ID = "ca_dataforseo";
    proxyExecuteMock.mockResolvedValue({
      successful: true,
      data: { ok: true },
    });
    const { proxyDataforseoRequestWithComposio } =
      await import("@/server/lib/composioDataforseo");

    await proxyDataforseoRequestWithComposio({
      path: "/v3/dataforseo_labs/google/keyword_overview/live",
      method: "POST",
      body: [{ keywords: ["seo"] }],
    });

    expect(proxyExecuteMock).toHaveBeenCalledWith({
      endpoint: "/v3/dataforseo_labs/google/keyword_overview/live",
      method: "POST",
      body: [{ keywords: ["seo"] }],
      connectedAccountId: "ca_dataforseo",
    });
  });

  it("throws when Composio reports execution failure", async () => {
    proxyExecuteMock.mockResolvedValue({
      successful: false,
      error: "bad auth",
    });
    const { proxyDataforseoRequestWithComposio } =
      await import("@/server/lib/composioDataforseo");

    await expect(
      proxyDataforseoRequestWithComposio({
        path: "/v3/appendix/user_data",
        method: "GET",
      }),
    ).rejects.toThrow("bad auth");
  });
});
