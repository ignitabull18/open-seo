import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";
import {
  createMcpToken,
  listMcpTokens,
  revokeMcpToken,
} from "@/serverFunctions/tokens";

export const Route = createFileRoute("/_app/tokens")({
  component: TokensPage,
});

function TokensPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const tokensQuery = useQuery({
    queryKey: ["mcpTokens"],
    queryFn: () => listMcpTokens({ data: undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (newName: string) =>
      createMcpToken({ data: { name: newName } }),
    onSuccess: (token) => {
      setCreatedToken(token.token);
      setName("");
      void queryClient.invalidateQueries({ queryKey: ["mcpTokens"] });
    },
    onError: () => toast.error("Failed to create token"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeMcpToken({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mcpTokens"] });
      toast.success("Token revoked");
    },
    onError: () => toast.error("Failed to revoke token"),
  });

  async function copyToken(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      toast.success("Token copied to clipboard");
    } catch {
      toast.error("Couldn't copy — copy manually");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(name.trim());
  }

  const tokens = tokensQuery.data ?? [];

  return (
    <div className="h-full overflow-auto bg-base-100 px-4 py-8 pb-24 md:px-6 md:py-12 md:pb-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Tokens</h1>
          <p className="mt-2 text-sm text-base-content/70">
            Personal access tokens for OpenSEO API access. Create a token for
            each external client you connect.
          </p>
        </div>

        {createdToken ? (
          <section className="rounded-lg border border-warning/40 bg-warning/5 p-4 space-y-3">
            <h2 className="text-sm font-semibold">
              Copy your token now — it won't be shown again
            </h2>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-base-200 px-3 py-2 text-xs font-mono">
                {createdToken}
              </code>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => void copyToken(createdToken)}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setCreatedToken(null)}
            >
              I've copied it
            </button>
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-base-content/50">
            Create a new token
          </h2>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              className="input input-bordered flex-1"
              placeholder="e.g. 'Claude Desktop'"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              disabled={createMutation.isPending}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create token"}
            </button>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-base-content/50">
            Active tokens ({tokens.length})
          </h2>
          {tokensQuery.isLoading ? (
            <p className="text-sm text-base-content/50">Loading…</p>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-base-content/50">
              No tokens yet. Create one to get started.
            </p>
          ) : (
            <ul className="divide-y divide-base-300 rounded-lg border border-base-300">
              {tokens.map((token) => (
                <li
                  key={token.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{token.name}</div>
                    <div className="text-xs text-base-content/50 font-mono">
                      {token.prefix}…{" "}
                      <span className="font-sans">
                        · created {formatDate(token.createdAt)}
                        {token.lastUsedAt
                          ? ` · last used ${formatDate(token.lastUsedAt)}`
                          : " · never used"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost text-error"
                    onClick={() => {
                      if (
                        confirm(
                          `Revoke "${token.name}"? Clients using this token will stop working immediately.`,
                        )
                      ) {
                        revokeMutation.mutate(token.id);
                      }
                    }}
                    disabled={revokeMutation.isPending}
                    aria-label="Revoke"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
