import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  envMock,
  proxyMock,
  getOptionalEnvValueMock,
  getRequiredEnvValueMock,
  fetchMock,
} = vi.hoisted(() => {
  const envValues: Record<string, string | undefined> = {
    DATAFORSEO_PROVIDER: undefined as string | undefined,
  };

  return {
    envMock: envValues,
    proxyMock: vi.fn(),
    getOptionalEnvValueMock: vi.fn((name: string) => {
      const value = envValues[name];
      return Promise.resolve(typeof value === "string" ? value : undefined);
    }),
    getRequiredEnvValueMock: vi.fn(),
    fetchMock: vi.fn<typeof fetch>(),
  };
});

vi.mock("@/server/lib/composioDataforseo", () => ({
  proxyDataforseoRequestWithComposio: proxyMock,
}));

vi.mock("@/server/lib/runtime-env", () => ({
  getOptionalEnvValue: getOptionalEnvValueMock,
  getRequiredEnvValue: getRequiredEnvValueMock,
}));

describe("requestDataforseo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.DATAFORSEO_PROVIDER = undefined;
    getRequiredEnvValueMock.mockResolvedValue("encoded-login-password");
    fetchMock.mockResolvedValue(Response.json({ status_code: 20000 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("uses direct DataForSEO by default", async () => {
    const { requestDataforseo } =
      await import("@/server/lib/dataforseoTransport");

    await requestDataforseo({
      path: "/v3/appendix/user_data",
      method: "GET",
    });

    const fetchCall = fetchMock.mock.calls[0];
    expect(fetchCall?.[0]).toBe(
      "https://api.dataforseo.com/v3/appendix/user_data",
    );
    expect(fetchCall?.[1]?.method).toBe("GET");
    expect(fetchCall?.[1]?.headers).toEqual({
      Authorization: "Basic encoded-login-password",
      "Content-Type": "application/json",
    });
    expect(proxyMock).not.toHaveBeenCalled();
  });

  it("uses Composio when DATAFORSEO_PROVIDER is composio", async () => {
    envMock.DATAFORSEO_PROVIDER = "composio";
    proxyMock.mockResolvedValue({ status_code: 20000 });
    const { requestDataforseo } =
      await import("@/server/lib/dataforseoTransport");

    const response = await requestDataforseo({
      path: "/v3/appendix/user_data",
      method: "GET",
    });

    expect(await response.json()).toEqual({ status_code: 20000 });
    expect(proxyMock).toHaveBeenCalledWith({
      path: "/v3/appendix/user_data",
      method: "GET",
      body: undefined,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
