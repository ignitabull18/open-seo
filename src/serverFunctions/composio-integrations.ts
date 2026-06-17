import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  createComposioConnectLink,
  listComposioIntegrationStatuses,
} from "@/server/features/integrations/ComposioIntegrationService";
import { requireAuthenticatedContext } from "@/serverFunctions/middleware";

const composioConnectInputSchema = z.object({
  toolkitSlug: z.string().min(1),
  returnPath: z.string().startsWith("/").optional(),
});

export const listComposioIntegrations = createServerFn({ method: "GET" })
  .middleware(requireAuthenticatedContext)
  .handler(async ({ context }) =>
    listComposioIntegrationStatuses(context.userId),
  );

export const startComposioConnection = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .inputValidator((data: unknown) => composioConnectInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const request = getRequest();
    const origin = new URL(request.url).origin;
    const returnPath = normalizeReturnPath(data.returnPath);
    const separator = returnPath.includes("?") ? "&" : "?";
    const callbackUrl = `${origin}${returnPath}${separator}integration=${encodeURIComponent(
      data.toolkitSlug,
    )}`;

    return createComposioConnectLink({
      userId: context.userId,
      toolkitSlug: data.toolkitSlug,
      callbackUrl,
    });
  });

function normalizeReturnPath(returnPath: string | undefined) {
  if (
    !returnPath ||
    !returnPath.startsWith("/") ||
    returnPath.startsWith("//")
  ) {
    return "/settings";
  }

  return returnPath;
}
