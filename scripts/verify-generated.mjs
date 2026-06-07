import { spawnSync } from "node:child_process";

const generatedFiles = [
  "src/routeTree.gen.ts",
  "web/src/routeTree.gen.ts",
  "worker-configuration.d.ts",
  "web/worker-configuration.d.ts",
];

const result = spawnSync(
  "git",
  ["diff", "--exit-code", "--", ...generatedFiles],
  {
    stdio: "inherit",
  },
);

if (result.status !== 0) {
  console.error(
    [
      "",
      "Generated files are out of date.",
      "Regenerate route trees with the relevant build command:",
      "  pnpm run build",
      "  pnpm --dir web run build",
      "Regenerate Cloudflare types after binding changes:",
      "  pnpm run cf-typegen",
      "  pnpm --dir web run cf-typegen",
    ].join("\n"),
  );
  process.exit(result.status ?? 1);
}
