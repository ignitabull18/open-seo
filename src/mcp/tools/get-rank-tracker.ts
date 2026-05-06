import { z } from "zod";
import { ProjectService } from "@/server/features/projects/services/ProjectService";
import { RankTrackingRepository } from "@/server/features/rank-tracking/repositories/RankTrackingRepository";
import { getLatestResults } from "@/server/features/rank-tracking/services/rankTrackingResults";
import { mcpResponse } from "@/mcp/formatters";
import { getAuth, getBaseUrl, type ToolExtra } from "@/mcp/context";
import { buildDashboardUrl } from "@/mcp/urls";
import { projectIdSchema } from "@/mcp/schemas";

const inputSchema = {
  projectId: projectIdSchema,
  trackerId: z
    .string()
    .optional()
    .describe(
      "Rank tracker config ID. If omitted, lists all rank trackers in the project.",
    ),
} as const;

type Args = z.infer<z.ZodObject<typeof inputSchema>>;

export const getRankTrackerTool = {
  name: "get_rank_tracker",
  config: {
    title: "Get rank tracker",
    description:
      "Read-only access to rank tracker configs and their latest results. With `trackerId`, returns config + latest snapshot per keyword. Without it, lists all trackers in the project. Free — reads from OpenSEO state, no DataForSEO call. To trigger a new check, use the dashboard.",
    inputSchema,
  },
  handler: async (args: Args, extra: ToolExtra) => {
    const auth = getAuth(extra);
    const baseUrl = getBaseUrl(extra);
    await ProjectService.getProjectForOrganization(
      auth.organizationId,
      args.projectId,
    );

    if (!args.trackerId) {
      const configs = await RankTrackingRepository.getConfigsForProject(
        args.projectId,
      );
      const text =
        configs.length === 0
          ? "No rank trackers configured for this project."
          : `Rank trackers (${configs.length}):\n` +
            configs
              .map(
                (c) =>
                  `- ${c.id}  ${c.domain}  loc:${c.locationCode}  schedule:${c.scheduleInterval}  active:${c.isActive ?? true}`,
              )
              .join("\n");
      return mcpResponse({
        text,
        meta: {
          organizationId: auth.organizationId,
          projectId: args.projectId,
          url: buildDashboardUrl(baseUrl, `/p/${args.projectId}/rank-tracking`),
        },
        structuredContent: { configs },
      });
    }

    const config = await RankTrackingRepository.getConfigById({
      configId: args.trackerId,
      projectId: args.projectId,
    });
    if (!config) {
      return mcpResponse({
        text: `Rank tracker ${args.trackerId} not found in project ${args.projectId}.`,
        meta: {
          organizationId: auth.organizationId,
          projectId: args.projectId,
        },
      });
    }
    const results = await getLatestResults(args.trackerId, args.projectId);
    const text = [
      `Tracker ${config.id} (${config.domain}):`,
      `Schedule: ${config.scheduleInterval}, devices: ${config.devices}, depth: ${config.serpDepth}`,
      `Latest run: ${results.run?.lastCheckedAt ?? "never"}`,
      `Keywords (${results.rows.length}):`,
      ...results.rows
        .slice(0, 25)
        .map(
          (r) =>
            `- "${r.keyword}"  desktop:#${r.desktop.position ?? "-"} (was ${r.desktop.previousPosition ?? "-"})  mobile:#${r.mobile.position ?? "-"}`,
        ),
    ].join("\n");
    return mcpResponse({
      text,
      meta: {
        organizationId: auth.organizationId,
        projectId: args.projectId,
        url: buildDashboardUrl(
          baseUrl,
          `/p/${args.projectId}/rank-tracking/${args.trackerId}`,
        ),
      },
      structuredContent: { config, results },
    });
  },
};
