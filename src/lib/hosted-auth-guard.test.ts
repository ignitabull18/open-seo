import { describe, expect, it } from "vitest";
import { getHostedAuthAllowlistResponse } from "./hosted-auth-guard";

function authRequest(path: string, body: unknown) {
  return new Request(`https://open-seo.example.com${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("hosted auth guard", () => {
  it("blocks hosted sign up for emails outside the allowlist", async () => {
    const response = await getHostedAuthAllowlistResponse(
      authRequest("/api/auth/sign-up/email", {
        email: "not-jeremy@example.com",
      }),
      "jeremy@ignitabull.com",
    );

    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("blocks hosted sign in for emails outside the allowlist", async () => {
    const response = await getHostedAuthAllowlistResponse(
      authRequest("/api/auth/sign-in/email", {
        email: "not-jeremy@example.com",
      }),
      "jeremy@ignitabull.com",
    );

    expect(response?.status).toBe(403);
  });

  it("allows configured hosted emails", async () => {
    await expect(
      getHostedAuthAllowlistResponse(
        authRequest("/api/auth/sign-up/email", {
          email: " JEREMY@IGNITABULL.COM ",
        }),
        "jeremy@ignitabull.com",
      ),
    ).resolves.toBeNull();
  });

  it("ignores unrestricted auth paths", async () => {
    await expect(
      getHostedAuthAllowlistResponse(
        authRequest("/api/auth/session", {
          email: "not-jeremy@example.com",
        }),
        "jeremy@ignitabull.com",
      ),
    ).resolves.toBeNull();
  });

  it("blocks malformed restricted requests", async () => {
    const response = await getHostedAuthAllowlistResponse(
      authRequest("/api/auth/sign-up/email", {
        username: "not-jeremy",
      }),
      "jeremy@ignitabull.com",
    );

    expect(response?.status).toBe(403);
  });
});
