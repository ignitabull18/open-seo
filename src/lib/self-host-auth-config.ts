import { getAuthMode } from "./auth-mode";

type SelfHostedAuthEnv = {
  AUTH_MODE?: string | null;
  TEAM_DOMAIN?: string | null;
  POLICY_AUD?: string | null;
};

const CLOUDFLARE_ACCESS_MISSING_MESSAGE =
  "AUTH_MODE=cloudflare_access requires TEAM_DOMAIN and POLICY_AUD";

function hasValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function getSelfHostedAuthConfigMessage(
  env: SelfHostedAuthEnv,
): string | null {
  const authMode = getAuthMode(env.AUTH_MODE);

  if (authMode !== "cloudflare_access") {
    return null;
  }

  const missing = [
    hasValue(env.TEAM_DOMAIN) ? null : "TEAM_DOMAIN",
    hasValue(env.POLICY_AUD) ? null : "POLICY_AUD",
  ].filter(Boolean);

  if (missing.length === 0) {
    return null;
  }

  return `${CLOUDFLARE_ACCESS_MISSING_MESSAGE}. Missing: ${missing.join(
    ", ",
  )}. Set AUTH_MODE=local_noauth only for trusted local development.`;
}

export function assertSelfHostedAuthConfig(env: SelfHostedAuthEnv) {
  const message = getSelfHostedAuthConfigMessage(env);

  if (message) {
    throw new Error(message);
  }
}
