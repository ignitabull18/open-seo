import { requestDataforseo } from "@/server/lib/dataforseoTransport";

await loadLocalEnvFiles([".env.local", ".env"]);

if (process.env.DATAFORSEO_PROVIDER !== "composio") {
  process.env.DATAFORSEO_PROVIDER = "composio";
}

const missing = ["COMPOSIO_API_KEY", "DATAFORSEO_API_KEY"].filter(
  (name) => !process.env[name]?.trim(),
);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(", ")}`,
  );
}

const response = await requestDataforseo({
  path: "/v3/appendix/user_data",
  method: "GET",
});

if (!response.ok) {
  throw new Error(
    `Composio DataForSEO smoke failed with HTTP ${response.status}`,
  );
}

const body = (await response.json()) as {
  status_code?: number;
  status_message?: string;
  cost?: number;
};

if (body.status_code !== 20000) {
  throw new Error(
    `Composio DataForSEO smoke failed: ${body.status_code ?? "unknown"} ${
      body.status_message ?? ""
    }`.trim(),
  );
}

if (body.cost && body.cost !== 0) {
  throw new Error(
    `Expected zero-cost DataForSEO user_data call, got ${body.cost}`,
  );
}

console.log("Composio DataForSEO no-spend smoke passed");

async function loadLocalEnvFiles(paths: string[]) {
  for (const path of paths) {
    const text = await readOptionalFile(path);
    if (!text) continue;

    for (const line of text.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed || process.env[parsed.name]) continue;
      process.env[parsed.name] = parsed.value;
    }
  }
}

async function readOptionalFile(path: string) {
  try {
    const { readFile } = await import("node:fs/promises");
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

function parseEnvLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex <= 0) return null;

  const name = trimmed.slice(0, separatorIndex).trim();
  const rawValue = trimmed.slice(separatorIndex + 1).trim();
  if (!/^[A-Z0-9_]+$/i.test(name)) return null;

  return {
    name,
    value: unwrapEnvValue(rawValue),
  };
}

function unwrapEnvValue(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
