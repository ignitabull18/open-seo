import { Composio } from "@composio/core";
import { AppError } from "@/server/lib/errors";
import { getOptionalEnvValue } from "@/server/lib/runtime-env";

const COMPOSIO_DATAFORSEO_TOOLKIT_VERSION = "20260429_00";
const DATAFORSEO_TOOLKIT_SLUG = "dataforseo";

let composio: Composio | undefined;

export async function getComposioClient() {
  const apiKey = await getOptionalEnvValue("COMPOSIO_API_KEY");

  if (!apiKey) {
    throw new AppError(
      "INTERNAL_ERROR",
      "COMPOSIO_API_KEY is required to use Composio integrations",
    );
  }

  const toolkitVersion =
    (await getOptionalEnvValue("COMPOSIO_DATAFORSEO_TOOLKIT_VERSION")) ||
    COMPOSIO_DATAFORSEO_TOOLKIT_VERSION;

  composio ??= new Composio({
    apiKey,
    toolkitVersions: {
      [DATAFORSEO_TOOLKIT_SLUG]: toolkitVersion,
    },
  });

  return composio;
}
