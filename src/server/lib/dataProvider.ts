const SEO_DATA_PROVIDER_NAMES = ["dataforseo", "composio"] as const;

type SeoDataProviderName = (typeof SEO_DATA_PROVIDER_NAMES)[number];

export function getSeoDataProviderName(env: {
  DATAFORSEO_PROVIDER?: string;
}): SeoDataProviderName {
  const configured = env.DATAFORSEO_PROVIDER?.trim().toLowerCase();

  if (configured === "composio") {
    return "composio";
  }

  return "dataforseo";
}
