import { createFileRoute } from "@tanstack/react-router";
import { ComposioToolsHub } from "@/client/features/integrations/ComposioToolsHub";

export const Route = createFileRoute("/_app/tools")({
  component: ToolsPage,
});

function ToolsPage() {
  return <ComposioToolsHub returnPath="/tools" />;
}
