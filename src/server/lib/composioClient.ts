import { Composio } from "@composio/core";
import { AppError } from "@/server/lib/errors";
import { getOptionalEnvValue } from "@/server/lib/runtime-env";

let composio: Composio | undefined;

export async function getComposioClient() {
  const apiKey = await getOptionalEnvValue("COMPOSIO_API_KEY");

  if (!apiKey) {
    throw new AppError(
      "INTERNAL_ERROR",
      "COMPOSIO_API_KEY is required to use Composio integrations",
    );
  }

  composio ??= new Composio({ apiKey });

  return composio;
}
