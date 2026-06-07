import { readFileSync } from "node:fs";

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

function stripJsonc(value) {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const next = value[index + 1];

    if (inString) {
      output += char;
      escaped = char === "\\" && !escaped;
      if (char === '"' && !escaped) inString = false;
      if (char !== "\\") escaped = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === "/" && next === "/") {
      while (index < value.length && value[index] !== "\n") index += 1;
      output += "\n";
      continue;
    }

    if (char === "/" && next === "*") {
      index += 2;
      while (
        index < value.length &&
        !(value[index] === "*" && value[index + 1] === "/")
      ) {
        index += 1;
      }
      index += 1;
      continue;
    }

    output += char;
  }

  return output.replace(/,\s*([}\]])/g, "$1");
}

function loadJsonc(path) {
  return JSON.parse(stripJsonc(readFileSync(path, "utf8")));
}

function bindingNames(config) {
  const names = new Set(Object.keys(config.vars ?? {}));

  for (const collection of [
    config.kv_namespaces,
    config.d1_databases,
    config.r2_buckets,
    config.workflows,
    config.services,
    config.queues?.producers,
    config.queues?.consumers,
  ]) {
    for (const item of collection ?? []) {
      if (item?.binding) names.add(item.binding);
      if (item?.queue) names.add(item.queue);
    }
  }

  return [...names].sort();
}

let failed = false;

for (const { label, wranglerPath, typesPath } of configs) {
  const config = loadJsonc(wranglerPath);
  const types = readFileSync(typesPath, "utf8");
  const missing = bindingNames(config).filter(
    (name) => !new RegExp(`\\b${name}\\b`).test(types),
  );

  if (missing.length > 0) {
    failed = true;
    console.error(
      `${label} Env types are missing wrangler bindings: ${missing.join(", ")}`,
    );
    console.error(
      `Run ${label === "root" ? "pnpm run cf-typegen" : "pnpm --dir web run cf-typegen"}.`,
    );
  }
}

if (failed) process.exit(1);
