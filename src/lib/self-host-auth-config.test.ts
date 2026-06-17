import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertSelfHostedAuthConfig,
  getSelfHostedAuthConfigMessage,
} from "./self-host-auth-config";

describe("self-hosted auth configuration", () => {
  it("accepts Cloudflare Access when TEAM_DOMAIN and POLICY_AUD are present", () => {
    expect(() =>
      assertSelfHostedAuthConfig({
        AUTH_MODE: "cloudflare_access",
        TEAM_DOMAIN: "https://team.cloudflareaccess.com",
        POLICY_AUD: "access-aud-tag",
      }),
    ).not.toThrow();
  });

  it("rejects Cloudflare Access with a clear missing-variable message", () => {
    expect(() =>
      assertSelfHostedAuthConfig({
        AUTH_MODE: "cloudflare_access",
        TEAM_DOMAIN: "",
        POLICY_AUD: undefined,
      }),
    ).toThrow(
      "AUTH_MODE=cloudflare_access requires TEAM_DOMAIN and POLICY_AUD",
    );
  });

  it("keeps local_noauth explicitly available for trusted local development", () => {
    expect(() =>
      assertSelfHostedAuthConfig({ AUTH_MODE: "local_noauth" }),
    ).not.toThrow();
  });

  it("returns null when self-hosted auth config is complete", () => {
    expect(
      getSelfHostedAuthConfigMessage({
        AUTH_MODE: "cloudflare_access",
        TEAM_DOMAIN: "https://team.cloudflareaccess.com",
        POLICY_AUD: "access-aud-tag",
      }),
    ).toBeNull();
  });
});

describe("Docker self-hosting files", () => {
  it("defaults compose deployments to Cloudflare Access and passes required env through", () => {
    const compose = readFileSync(resolve("compose.yaml"), "utf8");

    expect(compose).toContain("AUTH_MODE=${AUTH_MODE:-cloudflare_access}");
    expect(compose).toContain("TEAM_DOMAIN=${TEAM_DOMAIN:-}");
    expect(compose).toContain("POLICY_AUD=${POLICY_AUD:-}");
    expect(compose).toContain("CLOUDFLARE_INCLUDE_PROCESS_ENV=true");
    expect(compose).not.toContain("AUTH_MODE=local_noauth");
  });

  it("documents Cloudflare Access as the first-class Docker auth path", () => {
    const docs = readFileSync(resolve("docs/SELF_HOSTING_DOCKER.md"), "utf8");

    expect(docs).toContain("AUTH_MODE=cloudflare_access");
    expect(docs).toContain("TEAM_DOMAIN");
    expect(docs).toContain("POLICY_AUD");
    expect(docs).toContain("local_noauth");
    expect(docs).toContain("trusted local development");
  });
});
