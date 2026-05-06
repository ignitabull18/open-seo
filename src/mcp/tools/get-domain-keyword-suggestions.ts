import { z } from "zod";
import { DomainService } from "@/server/features/domain/services/DomainService";
import { ProjectService } from "@/server/features/projects/services/ProjectService";
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

const inputSchema = {
  projectId: projectIdSchema,
  domain: z
    .string()
    .min(1)
    .describe("Competitor or reference domain to extract keywords from."),
  locationCode: locationCodeSchema.optional(),
  languageCode: languageCodeSchema.optional(),
} as const;

type Args = z.infer<z.ZodObject<typeof inputSchema>>;

export const getDomainKeywordSuggestionsTool = {
  name: "get_domain_keyword_suggestions",
  config: {
    title: "Get keyword suggestions for a domain",
    description:
      "Returns the top organic keywords a domain ranks for. Useful for competitor analysis. Charges credits (~100-300 typical). Cached for 12 hours.",
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
    const keywords = await DomainService.getSuggestedKeywords(
      {
        domain: args.domain,
        locationCode: args.locationCode ?? 2840,
        languageCode: args.languageCode ?? "en",
        organizationId: auth.organizationId,
        projectId: args.projectId,
      },
      billing,
    );
    const text = [
      `Top keywords for ${args.domain} (${keywords.length}):`,
      ...keywords
        .slice(0, 25)
        .map(
          (kw) =>
            `- "${kw.keyword}" #${kw.position ?? "?"} vol:${kw.searchVolume ?? "?"} kd:${kw.keywordDifficulty ?? "?"}`,
        ),
    ].join("\n");
    return mcpResponse({
      text,
      meta: {
        organizationId: auth.organizationId,
        projectId: args.projectId,
        url: buildDashboardUrl(baseUrl, `/p/${args.projectId}/domain`, {
          domain: args.domain,
        }),
      },
      structuredContent: { keywords },
    });
  },
};
