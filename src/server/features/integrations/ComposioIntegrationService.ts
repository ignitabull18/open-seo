import { AppError } from "@/server/lib/errors";
import { getComposioClient } from "@/server/lib/composioClient";
import {
  composioToolkitCatalog,
  isKnownComposioToolkitSlug,
  type ComposioToolkitDefinition,
} from "@/server/features/integrations/composioCatalog";

type ConnectedAccountStatus =
  | "INITIALIZING"
  | "INITIATED"
  | "ACTIVE"
  | "FAILED"
  | "EXPIRED"
  | "INACTIVE"
  | "REVOKED";

type AuthConfigSummary = {
  id: string;
  name: string;
  authScheme?: string;
  isComposioManaged?: boolean;
};

type ConnectedAccountSummary = {
  id: string;
  status: ConnectedAccountStatus;
  updatedAt: string;
  statusReason: string | null;
};

type ComposioIntegrationStatus = ComposioToolkitDefinition & {
  authConfig: AuthConfigSummary | null;
  connectedAccount: ConnectedAccountSummary | null;
  connectable: boolean;
};

export async function listComposioIntegrationStatuses(userId: string) {
  const composio = await getComposioClient();
  const [authConfigs, connectedAccounts] = await Promise.all([
    Promise.all(
      composioToolkitCatalog.map(async (toolkit) => {
        try {
          const response = await composio.authConfigs.list({
            toolkit: toolkit.slug,
            limit: 25,
          });
          return [toolkit.slug, response.items] as const;
        } catch (error) {
          console.warn("Failed to list Composio auth configs", {
            toolkit: toolkit.slug,
            error,
          });
          return [toolkit.slug, []] as const;
        }
      }),
    ),
    composio.connectedAccounts.list({
      userIds: [userId],
      toolkitSlugs: composioToolkitCatalog.map((toolkit) => toolkit.slug),
      accountType: "ALL",
      limit: 100,
    }),
  ]);

  const authConfigsByToolkit = new Map<
    string,
    (typeof authConfigs)[number][1]
  >();
  for (const [toolkitSlug, configs] of authConfigs) {
    authConfigsByToolkit.set(toolkitSlug, configs);
  }
  const accountsByToolkit = new Map(
    connectedAccounts.items.map((account) => [account.toolkit.slug, account]),
  );

  return composioToolkitCatalog.map((toolkit): ComposioIntegrationStatus => {
    const enabledAuthConfig = authConfigsByToolkit
      .get(toolkit.slug)
      ?.find((authConfig) => authConfig.status === "ENABLED");
    const connectedAccount = accountsByToolkit.get(toolkit.slug);

    return {
      ...toolkit,
      authConfig: enabledAuthConfig
        ? {
            id: enabledAuthConfig.id,
            name: enabledAuthConfig.name,
            authScheme: enabledAuthConfig.authScheme,
            isComposioManaged: enabledAuthConfig.isComposioManaged,
          }
        : null,
      connectedAccount: connectedAccount
        ? {
            id: connectedAccount.id,
            status: connectedAccount.status,
            updatedAt: connectedAccount.updatedAt,
            statusReason: connectedAccount.statusReason,
          }
        : null,
      connectable: Boolean(enabledAuthConfig),
    };
  });
}

export async function createComposioConnectLink(args: {
  userId: string;
  toolkitSlug: string;
  callbackUrl: string;
}) {
  if (!isKnownComposioToolkitSlug(args.toolkitSlug)) {
    throw new AppError("VALIDATION_ERROR", "Unknown Composio toolkit");
  }

  const composio = await getComposioClient();
  const authConfigs = await composio.authConfigs.list({
    toolkit: args.toolkitSlug,
    limit: 25,
  });
  const authConfig = authConfigs.items.find(
    (item) => item.status === "ENABLED",
  );

  if (!authConfig) {
    throw new AppError(
      "VALIDATION_ERROR",
      "No enabled Composio auth config is available for this toolkit",
    );
  }

  const connectionRequest = await composio.connectedAccounts.link(
    args.userId,
    authConfig.id,
    {
      callbackUrl: args.callbackUrl,
    },
  );

  if (!connectionRequest.redirectUrl) {
    throw new AppError(
      "INTERNAL_ERROR",
      "Composio did not return a connection URL",
    );
  }

  return {
    id: connectionRequest.id,
    redirectUrl: connectionRequest.redirectUrl,
  };
}
