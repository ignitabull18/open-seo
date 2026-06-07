import { spawnSync } from "node:child_process";

const bucket = process.env.OPEN_SEO_R2_BUCKET ?? "open-seo";
const prefix = process.env.OPEN_SEO_R2_PREFIX ?? "dataforseo-cache/";
const command = process.argv[2] ?? "info";

function wrangler(args: string[]) {
  const pnpmExecPath = process.env.npm_execpath;
  const executable = pnpmExecPath
    ? process.execPath
    : process.platform === "win32"
      ? "wrangler.cmd"
      : "wrangler";
  const execArgs = pnpmExecPath
    ? [pnpmExecPath, "exec", "wrangler", ...args]
    : args;
  const result = spawnSync(executable, execArgs, {
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (command === "info") {
  console.log(`Inspecting bucket ${bucket}; cache prefix is ${prefix}`);
  wrangler(["r2", "bucket", "info", bucket]);
} else if (command === "delete") {
  const key = process.argv[3];
  if (!key) {
    console.error("Usage: pnpm run r2:cache -- delete <object-key>");
    process.exit(1);
  }
  if (!key.startsWith(prefix)) {
    console.error(`Refusing to delete key outside ${prefix}: ${key}`);
    process.exit(1);
  }
  wrangler(["r2", "object", "delete", `${bucket}/${key}`]);
} else {
  console.error(
    [
      "Usage:",
      "  pnpm run r2:cache -- info",
      "  pnpm run r2:cache -- delete dataforseo-cache/<key>",
    ].join("\n"),
  );
  process.exit(1);
}
