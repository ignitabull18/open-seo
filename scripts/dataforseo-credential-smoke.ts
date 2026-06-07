import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path: string) {
  try {
    const text = readFileSync(resolve(path), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^"|"$/g, "");
    }
  } catch {
    // Optional local convenience only.
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const apiKey = process.env.DATAFORSEO_API_KEY?.trim();

if (!apiKey) {
  console.error(
    "Missing DATAFORSEO_API_KEY. Set it in the environment or .env.local to run the no-spend credential smoke.",
  );
  process.exit(1);
}

const response = await fetch("https://api.dataforseo.com/v3/appendix/status", {
  headers: {
    Authorization: `Basic ${apiKey}`,
  },
});

if (!response.ok) {
  throw new Error(
    `DataForSEO status smoke failed with HTTP ${response.status}`,
  );
}

const body = (await response.json()) as {
  status_code?: number;
  status_message?: string;
  cost?: number;
};

if (body.status_code !== 20000) {
  throw new Error(
    `DataForSEO status smoke failed: ${body.status_code ?? "unknown"} ${body.status_message ?? ""}`.trim(),
  );
}

if (body.cost !== 0) {
  throw new Error(
    `Expected zero-cost DataForSEO status call, got ${body.cost}`,
  );
}

console.log("DataForSEO no-spend credential smoke passed");
