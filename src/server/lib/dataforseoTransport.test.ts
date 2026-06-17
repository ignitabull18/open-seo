import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequiredEnvValueMock, fetchMock } = vi.hoisted(() => ({
  getRequiredEnvValueMock: vi.fn(),
  fetchMock: vi.fn<typeof fetch>(),
}));

vi.mock("@/server/lib/runtime-env", () => ({
  getRequiredEnvValue: getRequiredEnvValueMock,
}));

describe("requestDataforseo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRequiredEnvValueMock.mockResolvedValue("encoded-login-password");
    fetchMock.mockResolvedValue(Response.json({ status_code: 20000 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("uses direct DataForSEO with the configured API key", async () => {
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
  });

  it("serializes POST bodies and preserves the abort signal", async () => {
    const abortController = new AbortController();
    const { requestDataforseo } =
      await import("@/server/lib/dataforseoTransport");

    await requestDataforseo({
      path: "/v3/dataforseo_labs/google/keyword_overview/live",
      method: "POST",
      body: [{ keyword: "seo" }],
      signal: abortController.signal,
    });

    const fetchCall = fetchMock.mock.calls[0];
    expect(fetchCall?.[1]?.body).toBe(JSON.stringify([{ keyword: "seo" }]));
    expect(fetchCall?.[1]?.signal).toBe(abortController.signal);
  });
});
