import { AppError } from "@/server/lib/errors";
import { getComposioClient } from "@/server/lib/composioClient";
import {
  getOptionalEnvValue,
  getRequiredEnvValue,
} from "@/server/lib/runtime-env";

const DATAFORSEO_TOOLKIT_SLUG = "dataforseo";

type ComposioProxyResponse = {
  data?: unknown;
  error?: string | null;
  successful?: boolean;
};

async function getDataforseoCustomConnectionData() {
  const basicEncoded = await getRequiredEnvValue("DATAFORSEO_API_KEY");
  const credentials = decodeDataforseoBasicAuth(basicEncoded);

  return {
    authScheme: "BASIC" as const,
    toolkitSlug: DATAFORSEO_TOOLKIT_SLUG,
    val: {
      status: "ACTIVE" as const,
      username: credentials.username,
      password: credentials.password,
      base_url: "https://api.dataforseo.com",
    },
  };
}

function decodeDataforseoBasicAuth(encoded: string) {
  let decoded: string;

  try {
    decoded = atob(encoded);
  } catch {
    throw new AppError(
      "INTERNAL_ERROR",
      "DATAFORSEO_API_KEY must be base64-encoded login:password when used with Composio",
    );
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex <= 0 || separatorIndex === decoded.length - 1) {
    throw new AppError(
      "INTERNAL_ERROR",
      "DATAFORSEO_API_KEY must decode to login:password when used with Composio",
    );
  }

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
  };
}

export async function proxyDataforseoRequestWithComposio(args: {
  path: string;
  method: "GET" | "POST";
  body?: unknown;
}): Promise<unknown> {
  const connectedAccountId = await getOptionalEnvValue(
    "COMPOSIO_DATAFORSEO_CONNECTED_ACCOUNT_ID",
  );
  const composioClient = await getComposioClient();
  const result = (await composioClient.tools.proxyExecute({
    endpoint: args.path,
    method: args.method,
    body: args.body,
    ...(connectedAccountId
      ? { connectedAccountId }
      : { customConnectionData: await getDataforseoCustomConnectionData() }),
  })) as ComposioProxyResponse;

  if (result.successful === false) {
    throw new AppError(
      "INTERNAL_ERROR",
      result.error ?? "Composio DataForSEO proxy execution failed",
    );
  }

  return result.data ?? result;
}
