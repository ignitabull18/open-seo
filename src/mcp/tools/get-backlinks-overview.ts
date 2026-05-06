import { z } from "zod";
import { BacklinksService } from "@/server/features/backlinks/services/BacklinksService";
import { ProjectService } from "@/server/features/projects/services/ProjectService";
import { mcpResponse } from "@/mcp/formatters";
import {
  buildBillingCustomer,
  getAuth,
  getBaseUrl,
  type ToolExtra,
} from "@/mcp/context";
import { buildDashboardUrl } from "@/mcp/urls";
import { projectIdSchema } from "@/mcp/schemas";

const inputSchema = {
  projectId: projectIdSchema,
  target: z
    .string()
    .min(1)
    .describe(
      "Domain or URL to analyze (e.g. 'example.com' or 'https://example.com/blog').",
    ),
  scope: z
    .enum(["domain", "page"])
    .optional()
    .describe(
      "'domain' analyzes the whole domain; 'page' analyzes a specific URL. Defaults to 'domain'.",
    ),
  hideSpam: z
    .boolean()
    .optional()
    .describe("Filter out spammy referring domains. Defaults to true."),
} as const;

type Args = z.infer<z.ZodObject<typeof inputSchema>>;

export const getBacklinksOverviewTool = {
  name: "get_backlinks_overview",
  config: {
    title: "Get backlinks overview",
    description:
      "Returns a backlinks profile summary (total backlinks, referring domains, top referring domains). Charges credits (~200-500 typical). Requires that the user's DataForSEO account has Backlinks enabled.",
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
    const lookup = { target: args.target, scope: args.scope };
    const spamOptions = { hideSpam: args.hideSpam ?? true };
    const [overview, refDomains] = await Promise.all([
      BacklinksService.profileOverview(lookup, billing, spamOptions),
      BacklinksService.profileReferringDomains(lookup, billing, spamOptions),
    ]);
    const topDomains = refDomains.rows ?? [];
    const text = [
      `Backlinks profile for ${args.target} (${args.scope ?? "domain"}):`,
      JSON.stringify(overview, null, 2).slice(0, 800),
      "",
      `Top referring domains (${Math.min(topDomains.length, 10)} shown):`,
      ...topDomains
        .slice(0, 10)
        .map((d) => `- ${d.domain ?? "?"}  backlinks:${d.backlinks ?? "?"}`),
    ].join("\n");
    return mcpResponse({
      text,
      meta: {
        organizationId: auth.organizationId,
        projectId: args.projectId,
        url: buildDashboardUrl(baseUrl, `/p/${args.projectId}/backlinks`, {
          target: args.target,
        }),
      },
      structuredContent: { overview, referringDomains: refDomains },
    });
  },
};
