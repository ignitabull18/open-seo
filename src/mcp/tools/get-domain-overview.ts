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
  domain: z.string().min(1).describe("Domain to analyze (e.g. 'example.com')."),
  includeSubdomains: z.boolean().optional().default(false),
  locationCode: locationCodeSchema.optional(),
  languageCode: languageCodeSchema.optional(),
} as const;

type Args = z.infer<z.ZodObject<typeof inputSchema>>;

export const getDomainOverviewTool = {
  name: "get_domain_overview",
  config: {
    title: "Get domain overview",
    description:
      "Returns organic traffic, organic keyword count, and the domain's top-ranking keywords. Charges credits (~100-300 typical). Cached for 12 hours per domain.",
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
    const result = await DomainService.getOverview(
      {
        projectId: args.projectId,
        domain: args.domain,
        includeSubdomains: args.includeSubdomains ?? false,
        locationCode: args.locationCode ?? 2840,
        languageCode: args.languageCode ?? "en",
      },
      billing,
    );
    const text = [
      `Domain: ${result.domain}`,
      `Organic traffic: ${result.organicTraffic ?? "?"}`,
      `Organic keywords: ${result.organicKeywords ?? "?"}`,
      `Backlinks: ${result.backlinks ?? "?"}`,
      `Referring domains: ${result.referringDomains ?? "?"}`,
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
      structuredContent: result,
    });
  },
};
