export type ComposioToolkitCategory =
  | "Search"
  | "Analytics"
  | "Content"
  | "Social"
  | "CRM"
  | "Productivity";

export type ComposioToolkitDefinition = {
  slug: string;
  title: string;
  category: ComposioToolkitCategory;
  description: string;
  useCases: string[];
};

export const composioToolkitCatalog = [
  {
    slug: "google_search_console",
    title: "Google Search Console",
    category: "Search",
    description:
      "Bring search performance, indexing, and query data into SEO workflows.",
    useCases: ["Index checks", "Query trends", "Page diagnostics"],
  },
  {
    slug: "google_analytics",
    title: "Google Analytics",
    category: "Analytics",
    description:
      "Compare SEO work against traffic, engagement, and conversion signals.",
    useCases: ["Traffic context", "Landing pages", "Conversion impact"],
  },
  {
    slug: "google_sheets",
    title: "Google Sheets",
    category: "Productivity",
    description:
      "Export keyword, backlink, and audit work into team spreadsheets.",
    useCases: ["Exports", "Briefing docs", "Client reporting"],
  },
  {
    slug: "gmail",
    title: "Gmail",
    category: "Productivity",
    description:
      "Draft outreach, client summaries, and report follow-ups from OpenSEO context.",
    useCases: ["Outreach", "Client reports", "Follow-ups"],
  },
  {
    slug: "google_docs",
    title: "Google Docs",
    category: "Content",
    description:
      "Create briefs, refresh plans, and SEO reports in shared documents.",
    useCases: ["Content briefs", "Audit reports", "Refresh plans"],
  },
  {
    slug: "slack",
    title: "Slack",
    category: "Productivity",
    description:
      "Send audit summaries, rank changes, and campaign updates to channels.",
    useCases: ["Alerts", "Team updates", "Approvals"],
  },
  {
    slug: "notion",
    title: "Notion",
    category: "Content",
    description:
      "Push research, briefs, and task-ready SEO findings into workspaces.",
    useCases: ["Briefs", "Backlogs", "Knowledge base"],
  },
  {
    slug: "wordpress",
    title: "WordPress",
    category: "Content",
    description:
      "Prepare publishing workflows for content updates and metadata fixes.",
    useCases: ["Publishing", "Metadata", "Content refresh"],
  },
  {
    slug: "linkedin",
    title: "LinkedIn",
    category: "Social",
    description:
      "Connect social distribution to brand and content-performance workflows.",
    useCases: ["Distribution", "Thought leadership", "Campaign support"],
  },
  {
    slug: "hubspot",
    title: "HubSpot",
    category: "CRM",
    description:
      "Tie SEO opportunities to lifecycle, contact, and campaign context.",
    useCases: ["Campaign context", "Lead quality", "Lifecycle reporting"],
  },
  {
    slug: "github",
    title: "GitHub",
    category: "Productivity",
    description:
      "Turn technical SEO findings into issues developers can act on.",
    useCases: ["Issue creation", "Fix tracking", "Release notes"],
  },
  {
    slug: "jira",
    title: "Jira",
    category: "Productivity",
    description:
      "Send crawl defects, content tasks, and technical SEO work into sprints.",
    useCases: ["Sprint tasks", "Bug tracking", "Prioritization"],
  },
] satisfies ComposioToolkitDefinition[];

const composioToolkitSlugs = composioToolkitCatalog.map(
  (toolkit) => toolkit.slug,
);

export function isKnownComposioToolkitSlug(slug: string) {
  return composioToolkitSlugs.includes(slug);
}
