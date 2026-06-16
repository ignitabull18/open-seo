import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Plug,
  RefreshCw,
  Search,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  listComposioIntegrations,
  startComposioConnection,
} from "@/serverFunctions/composio-integrations";

const QUERY_KEY = ["composioIntegrations"] as const;
const ALL_CATEGORY = "All";

type IntegrationStatus = Awaited<
  ReturnType<typeof listComposioIntegrations>
>[number];

const EMPTY_INTEGRATIONS: IntegrationStatus[] = [];

export function ComposioToolsHub({ returnPath }: { returnPath: string }) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [search, setSearch] = useState("");
  const integrationsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => listComposioIntegrations(),
    refetchOnWindowFocus: false,
  });
  const connectMutation = useMutation({
    mutationFn: (toolkitSlug: string) =>
      startComposioConnection({
        data: {
          toolkitSlug,
          returnPath,
        },
      }),
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
      toast.success("Tool connected");
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    } else if (status === "failed") {
      toast.error("Tool connection failed");
    }

    if (status) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [queryClient]);

  const integrations = integrationsQuery.data ?? EMPTY_INTEGRATIONS;
  const categories = useMemo(
    () => [
      ALL_CATEGORY,
      ...Array.from(
        new Set(integrations.map((item) => item.category)),
      ).toSorted(),
    ],
    [integrations],
  );
  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return integrations.filter((integration) => {
      const matchesCategory =
        category === ALL_CATEGORY || integration.category === category;
      const matchesSearch =
        !normalizedSearch ||
        [integration.title, integration.description, integration.category]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [category, integrations, search]);
  const connectedCount = integrations.filter(
    (item) => item.connectedAccount?.status === "ACTIVE",
  ).length;
  const connectableCount = integrations.filter(
    (item) => item.connectable,
  ).length;

  return (
    <div className="h-full overflow-auto bg-base-100 px-4 py-8 pb-24 md:px-6 md:py-10 md:pb-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Connected tools
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-base-content/65">
              Connect the systems OpenSEO can use for reporting, content
              workflows, outreach, issue tracking, alerts, and source-backed SEO
              work.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm gap-2 self-start md:self-auto"
            disabled={integrationsQuery.isFetching}
            onClick={() => {
              void integrationsQuery.refetch();
            }}
          >
            <RefreshCw
              className={`size-4 ${
                integrationsQuery.isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile label="Connected" value={connectedCount} />
          <MetricTile label="Ready to connect" value={connectableCount} />
          <MetricTile label="Toolkits" value={integrations.length} />
        </div>

        <div className="flex flex-col gap-3 border-y border-base-300 py-3 md:flex-row md:items-center md:justify-between">
          <div className="join overflow-x-auto">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={`btn join-item btn-sm ${
                  category === item ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="input input-sm input-bordered flex min-w-0 items-center gap-2 md:w-72">
            <Search className="size-4 text-base-content/40" />
            <input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              className="min-w-0"
              placeholder="Search tools"
            />
          </label>
        </div>

        {integrationsQuery.isPending ? (
          <div className="flex min-h-64 items-center justify-center rounded-lg border border-base-300 bg-base-200">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : integrationsQuery.isError ? (
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
          <div className="grid gap-3 lg:grid-cols-3">
            {filtered.map((integration) => (
              <ToolCard
                key={integration.slug}
                integration={integration}
                isConnecting={
                  connectMutation.isPending &&
                  connectMutation.variables === integration.slug
                }
                onConnect={() => connectMutation.mutate(integration.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-200 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-base-content/45">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-base-content">{value}</p>
    </div>
  );
}

function ToolCard({
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
    <article className="flex min-h-64 flex-col rounded-lg border border-base-300 bg-base-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-medium text-base-content/45">
            {integration.category}
          </span>
          <h2 className="mt-1 text-base font-semibold">{integration.title}</h2>
        </div>
        <StatusIcon
          className={`size-5 shrink-0 ${
            isActive
              ? "text-success"
              : needsSetup
                ? "text-warning"
                : "text-base-content/40"
          }`}
        />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-base-content/65">
        {integration.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {integration.useCases.map((useCase) => (
          <span
            key={useCase}
            className="rounded-md bg-base-200 px-2 py-1 text-xs text-base-content/65"
          >
            {useCase}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
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
            <ArrowUpRight className="size-4" />
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
