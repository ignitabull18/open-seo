import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { loadJsonc } from "./lib/jsonc";

const configs = [
  {
    label: "root",
    wranglerPath: "wrangler.jsonc",
    typesPath: "worker-configuration.d.ts",
  },
  {
    label: "web",
    wranglerPath: "web/wrangler.jsonc",
    typesPath: "web/worker-configuration.d.ts",
  },
];

interface WranglerConfig {
  vars?: Record<string, string>;
  kv_namespaces?: Array<{ binding?: string }>;
  d1_databases?: Array<{ binding?: string }>;
  r2_buckets?: Array<{ binding?: string }>;
  workflows?: Array<{ binding?: string }>;
  services?: Array<{ binding?: string }>;
  queues?: {
    producers?: Array<{ binding?: string; queue?: string }>;
    consumers?: Array<{ binding?: string; queue?: string }>;
  };
}

export function bindingNames(config: WranglerConfig) {
  const names = new Set(Object.keys(config.vars ?? {}));
  const collections: Array<
    Array<{ binding?: string; queue?: string }> | undefined
  > = [
    config.kv_namespaces,
    config.d1_databases,
    config.r2_buckets,
    config.workflows,
    config.services,
    config.queues?.producers,
    config.queues?.consumers,
  ];

  for (const collection of collections) {
    for (const item of collection ?? []) {
      if (item?.binding) names.add(item.binding);
      if (item?.queue) names.add(item.queue);
    }
  }

  return [...names].sort();
}

export function verifyBindings() {
  const failures: string[] = [];

  for (const { label, wranglerPath, typesPath } of configs) {
    const config = loadJsonc(wranglerPath) as WranglerConfig;
    const types = readFileSync(typesPath, "utf8");
    const missing = bindingNames(config).filter(
      (name) => !new RegExp(`\\b${name}\\b`).test(types),
    );

    if (missing.length > 0) {
      failures.push(
        `${label} Env types are missing wrangler bindings: ${missing.join(", ")}`,
      );
      failures.push(
        `Run ${label === "root" ? "pnpm run cf-typegen" : "pnpm --dir web run cf-typegen"}.`,
      );
    }
  }

  return failures;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const failures = verifyBindings();
  for (const failure of failures) console.error(failure);
  if (failures.length > 0) process.exit(1);
}
