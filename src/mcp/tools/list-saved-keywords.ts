import type { z } from "zod";
import { KeywordResearchService } from "@/server/features/keywords/services/KeywordResearchService";
import { ProjectService } from "@/server/features/projects/services/ProjectService";
import { mcpResponse } from "@/mcp/formatters";
import { getAuth, getBaseUrl, type ToolExtra } from "@/mcp/context";
import { buildDashboardUrl } from "@/mcp/urls";
import { projectIdSchema } from "@/mcp/schemas";

const inputSchema = {
  projectId: projectIdSchema,
} as const;

export const listSavedKeywordsTool = {
  name: "list_saved_keywords",
  config: {
    title: "List saved keywords",
    description:
      "Lists keywords saved to a project (with cached metrics like search volume, difficulty, CPC if available). Free — reads from OpenSEO's database, no DataForSEO call.",
    inputSchema,
  },
  handler: async (
    args: z.infer<z.ZodObject<typeof inputSchema>>,
    extra: ToolExtra,
  ) => {
    const auth = getAuth(extra);
    const baseUrl = getBaseUrl(extra);
    await ProjectService.getProjectForOrganization(
      auth.organizationId,
      args.projectId,
    );
    const { rows } = await KeywordResearchService.getSavedKeywords({
      projectId: args.projectId,
    });
    const text =
      rows.length === 0
        ? "No saved keywords yet."
        : `Saved keywords (${rows.length}):\n` +
          rows
            .map(
              (r) =>
                `- ${r.keyword}  vol:${r.searchVolume ?? "?"}  kd:${r.keywordDifficulty ?? "?"}  cpc:${r.cpc != null ? `$${r.cpc.toFixed(2)}` : "?"}`,
            )
            .join("\n");
    return mcpResponse({
      text,
      meta: {
        organizationId: auth.organizationId,
        projectId: args.projectId,
        url: buildDashboardUrl(baseUrl, `/p/${args.projectId}/saved`),
      },
      structuredContent: { rows },
    });
  },
};
