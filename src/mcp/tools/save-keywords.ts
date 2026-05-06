import { z } from "zod";
import { KeywordResearchService } from "@/server/features/keywords/services/KeywordResearchService";
import { ProjectService } from "@/server/features/projects/services/ProjectService";
import { mcpResponse } from "@/mcp/formatters";
import { getAuth, getBaseUrl, type ToolExtra } from "@/mcp/context";
import { buildDashboardUrl } from "@/mcp/urls";
import {
  languageCodeSchema,
  locationCodeSchema,
  projectIdSchema,
} from "@/mcp/schemas";

const inputSchema = {
  projectId: projectIdSchema,
  keywords: z
    .array(z.string().min(1))
    .min(1)
    .max(100)
    .describe("Keywords to save (1-100)."),
  locationCode: locationCodeSchema.optional(),
  languageCode: languageCodeSchema.optional(),
} as const;

type Args = z.infer<z.ZodObject<typeof inputSchema>>;

export const saveKeywordsTool = {
  name: "save_keywords",
  config: {
    title: "Save keywords",
    description:
      "Save keywords to a project's saved-keywords list. Free — does not call DataForSEO. Idempotent: re-saving an existing keyword is a no-op.",
    inputSchema,
  },
  handler: async (args: Args, extra: ToolExtra) => {
    const auth = getAuth(extra);
    const baseUrl = getBaseUrl(extra);
    await ProjectService.getProjectForOrganization(
      auth.organizationId,
      args.projectId,
    );
    await KeywordResearchService.saveKeywords({
      projectId: args.projectId,
      keywords: args.keywords,
      locationCode: args.locationCode ?? 2840,
      languageCode: args.languageCode ?? "en",
    });
    return mcpResponse({
      text: `Saved ${args.keywords.length} keyword(s) to project ${args.projectId}.`,
      meta: {
        organizationId: auth.organizationId,
        projectId: args.projectId,
        url: buildDashboardUrl(baseUrl, `/p/${args.projectId}/saved`),
      },
    });
  },
};
