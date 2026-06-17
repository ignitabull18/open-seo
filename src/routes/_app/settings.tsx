import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Monitor,
  Moon,
  Plug,
  RefreshCw,
  Sun,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type ThemePreference, useThemePreference } from "@/client/lib/theme";
import { authClient, useSession } from "@/lib/auth-client";
import { isHostedClientAuthMode } from "@/lib/auth-mode";
import {
  listComposioIntegrations,
  startComposioConnection,
} from "@/serverFunctions/composio-integrations";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

const COMPOSIO_INTEGRATIONS_QUERY_KEY = ["composioIntegrations"] as const;

function SettingsPage() {
  const isHosted = isHostedClientAuthMode();
  const { themePreference, setThemePreference } = useThemePreference();
  const { data: session, isPending: isSessionPending } = useSession();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const analyticsEnabled = session?.user?.analyticsOptedOut !== true;
  const integrationsQuery = useQuery({
    queryKey: COMPOSIO_INTEGRATIONS_QUERY_KEY,
    queryFn: () => listComposioIntegrations(),
    enabled: Boolean(session?.user),
    refetchOnWindowFocus: false,
  });
  const connectMutation = useMutation({
    mutationFn: (toolkitSlug: string) =>
      startComposioConnection({ data: { toolkitSlug } }),
    onSuccess: (result) => {
      window.location.assign(result.redirectUrl);
    },
    onError: () => {
      toast.error("We couldn't start that connection.");
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");

    if (status === "success") {
      toast.success("Integration connected");
      void queryClient.invalidateQueries({
        queryKey: COMPOSIO_INTEGRATIONS_QUERY_KEY,
      });
    } else if (status === "failed") {
      toast.error("Integration connection failed");
    }

    if (status) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [queryClient]);

  async function updateAnalyticsPreference(enabled: boolean) {
    setIsSaving(true);
    try {
      const result = await authClient.updateUser({
        analyticsOptedOut: !enabled,
      });
      if (result.error) {
        toast.error("We couldn't update your analytics setting.");
      } else {
        toast.success(enabled ? "Analytics enabled" : "Analytics disabled");
      }
    } catch {
      toast.error("We couldn't update your analytics setting.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="h-full overflow-auto bg-base-100 px-4 py-8 pb-24 md:px-6 md:py-12 md:pb-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div className="space-y-10">
            <AppearanceSection
              themePreference={themePreference}
              setThemePreference={setThemePreference}
            />

            {isHosted ? (
              <AnalyticsSection
                analyticsEnabled={analyticsEnabled}
                disabled={isSessionPending || isSaving || !session?.user}
                onChange={(enabled) => {
                  void updateAnalyticsPreference(enabled);
                }}
              />
            ) : null}
          </div>

          <IntegrationsSection
            query={integrationsQuery}
            activeToolkitSlug={connectMutation.variables}
            isConnecting={connectMutation.isPending}
            onRefresh={() => {
              void integrationsQuery.refetch();
            }}
            onConnect={(toolkitSlug) => connectMutation.mutate(toolkitSlug)}
          />
        </div>
      </div>
    </div>
  );
}

function AppearanceSection({
  themePreference,
  setThemePreference,
}: {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-base-content/50">Appearance</h2>
      <div className="flex items-center justify-between gap-6">
        <span className="text-sm">Theme</span>
        <div
          role="radiogroup"
          aria-label="Theme preference"
          className="flex gap-0.5 rounded-lg bg-base-200 p-0.5"
        >
          {THEME_OPTIONS.map((option) => {
            const isActive = option.value === themePreference;
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={option.label}
                className={`flex cursor-pointer items-center justify-center rounded-md px-3 py-1.5 transition-colors ${
                  isActive
                    ? "bg-base-100 text-base-content shadow-sm"
                    : "text-base-content/50 hover:text-base-content/80"
                }`}
                onClick={() => setThemePreference(option.value)}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AnalyticsSection({
  analyticsEnabled,
  disabled,
  onChange,
}: {
  analyticsEnabled: boolean;
  disabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-base-content/50">Analytics</h2>
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm">Help improve OpenSEO</p>
          <p className="mt-1 text-sm text-base-content/60">
            Share analytics and usage data.
          </p>
        </div>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={analyticsEnabled}
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.checked)}
          aria-label="Enable product analytics"
        />
      </div>
    </section>
  );
}

type IntegrationStatus = Awaited<
  ReturnType<typeof listComposioIntegrations>
>[number];

function IntegrationsSection({
  query,
  activeToolkitSlug,
  isConnecting,
  onRefresh,
  onConnect,
}: {
  query: ReturnType<typeof useQuery<IntegrationStatus[]>>;
  activeToolkitSlug: string | undefined;
  isConnecting: boolean;
  onRefresh: () => void;
  onConnect: (toolkitSlug: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Connected tools</h2>
          <p className="mt-1 text-sm leading-relaxed text-base-content/60">
            Connect external workspaces through Composio for reporting,
            publishing, alerts, and follow-up workflows.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm gap-2"
          disabled={query.isFetching}
          onClick={onRefresh}
        >
          <RefreshCw
            className={`size-4 ${query.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {query.isPending ? (
        <div className="flex min-h-48 items-center justify-center rounded-lg border border-base-300 bg-base-200">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : query.isError ? (
        <div className="rounded-lg border border-error/25 bg-error/5 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-error" />
            <div>
              <p className="text-sm font-medium">
                Tool connections are unavailable.
              </p>
              <p className="mt-1 text-sm text-base-content/60">
                Check the Composio API key binding and try again.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(query.data ?? []).map((integration) => (
            <IntegrationCard
              key={integration.slug}
              integration={integration}
              isConnecting={
                isConnecting && activeToolkitSlug === integration.slug
              }
              onConnect={() => onConnect(integration.slug)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function IntegrationCard({
  integration,
  isConnecting,
  onConnect,
}: {
  integration: IntegrationStatus;
  isConnecting: boolean;
  onConnect: () => void;
}) {
  const isActive = integration.connectedAccount?.status === "ACTIVE";
  const needsSetup = !integration.connectable;
  const statusLabel = needsSetup
    ? "Setup needed"
    : isActive
      ? "Connected"
      : integration.connectedAccount?.status
        ? titleCase(integration.connectedAccount.status)
        : "Not connected";
  const StatusIcon = needsSetup ? Wrench : isActive ? CheckCircle2 : Plug;

  return (
    <article className="rounded-lg border border-base-300 bg-base-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{integration.title}</h3>
            <span className="badge badge-ghost badge-sm">
              {integration.category}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-base-content/65">
            {integration.description}
          </p>
        </div>
        <StatusIcon
          className={`mt-0.5 size-5 shrink-0 ${
            isActive
              ? "text-success"
              : needsSetup
                ? "text-warning"
                : "text-base-content/40"
          }`}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {integration.useCases.map((useCase) => (
          <span
            key={useCase}
            className="rounded-md bg-base-200 px-2 py-1 text-xs text-base-content/65"
          >
            {useCase}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0 text-xs text-base-content/55">
          <div className="flex items-center gap-1.5">
            <span
              className={`size-2 rounded-full ${
                isActive
                  ? "bg-success"
                  : needsSetup
                    ? "bg-warning"
                    : "bg-base-content/30"
              }`}
            />
            <span>{statusLabel}</span>
          </div>
          {integration.authConfig ? (
            <p className="mt-1 truncate">
              {integration.authConfig.isComposioManaged
                ? "Composio managed auth"
                : integration.authConfig.name}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm gap-2"
          disabled={needsSetup || isConnecting}
          onClick={onConnect}
          title={needsSetup ? "Create an auth config in Composio first" : ""}
        >
          {isConnecting ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <ExternalLink className="size-4" />
          )}
          {isActive ? "Reconnect" : "Connect"}
        </button>
      </div>
    </article>
  );
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
