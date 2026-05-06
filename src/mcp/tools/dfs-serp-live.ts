import { z } from "zod";
import { ProjectService } from "@/server/features/projects/services/ProjectService";
import { createDataforseoClient } from "@/server/lib/dataforseoClient";
import { mcpResponse } from "@/mcp/formatters";
import {
  buildBillingCustomer,
  getAuth,
  getBaseUrl,
  type ToolExtra,
} from "@/mcp/context";
import { buildDashboardUrl } from "@/mcp/urls";
import {
  languageCodeSchema,
  locationCodeSchema,
  projectIdSchema,
} from "@/mcp/schemas";

const querySchema = z.object({
  keyword: z.string().min(1),
  locationCode: locationCodeSchema.optional(),
  languageCode: languageCodeSchema.optional(),
});

const inputSchema = {
  projectId: projectIdSchema,
  queries: z
    .array(querySchema)
    .min(1)
    .max(25)
    .describe(
      "1-25 queries. Bulk-friendly — prefer this over multiple single-query calls.",
    ),
} as const;

type Args = z.infer<z.ZodObject<typeof inputSchema>>;

export const dfsSerpLiveTool = {
  name: "dfs_serp_live",
  config: {
    title: "Live Google SERP results (raw)",
    description:
      "Fetches live Google SERP organic results for 1-25 queries. Pass-through to DataForSEO (the `dfs_` prefix indicates raw access — does not save to OpenSEO state). Charges credits per query (~30-60 each). Per-query errors don't fail the batch.",
    inputSchema,
  },
  handler: async (args: Args, extra: ToolExtra) => {
    const auth = getAuth(extra);
    const baseUrl = getBaseUrl(extra);
    await ProjectService.getProjectForOrganization(
      auth.organizationId,
      args.projectId,
    );
    const billing = buildBillingCustomer(auth, args.projectId);
    const client = createDataforseoClient(billing);

    const results = await Promise.all(
      args.queries.map(async (q) => {
        try {
          const items = await client.serp.live({
            keyword: q.keyword,
            locationCode: q.locationCode ?? 2840,
            languageCode: q.languageCode ?? "en",
          });
          // Trim noise — return only essentials per item.
          const trimmed = items.slice(0, 20).map((item) => ({
            type: item.type,
            rank: item.rank_absolute ?? item.rank_group ?? null,
            title: item.title ?? null,
            url: item.url ?? null,
            domain: item.domain ?? null,
            description: item.description ?? null,
          }));
          return { keyword: q.keyword, ok: true as const, items: trimmed };
        } catch (error) {
          return {
            keyword: q.keyword,
            ok: false as const,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );

    const okCount = results.filter((r) => r.ok).length;
    const text =
      results
        .map((r) => {
          if (r.ok) {
            const top = r.items.slice(0, 3);
            return `"${r.keyword}" (${r.items.length} results):\n${top
              .map(
                (it) =>
                  `  #${it.rank ?? "?"}  ${it.domain ?? "?"} — ${it.title ?? "?"}`,
              )
              .join("\n")}`;
          }
          return `"${r.keyword}": FAILED — ${r.error}`;
        })
        .join("\n\n") +
      `\n\n${okCount} of ${results.length} queries succeeded.`;

    return mcpResponse({
      text,
      meta: {
        organizationId: auth.organizationId,
        projectId: args.projectId,
        url: buildDashboardUrl(baseUrl, `/p/${args.projectId}/keywords`),
      },
      structuredContent: { results },
    });
  },
};
