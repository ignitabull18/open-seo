import { getRequiredEnvValue } from "@/server/lib/runtime-env";

const API_BASE = "https://api.dataforseo.com";

export async function requestDataforseo(args: {
  path: string;
  method: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
}): Promise<Response> {
  const apiKey = await getRequiredEnvValue("DATAFORSEO_API_KEY");
  return fetch(`${API_BASE}${args.path}`, {
    method: args.method,
    headers: {
      Authorization: `Basic ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: args.body === undefined ? undefined : JSON.stringify(args.body),
    signal: args.signal,
  });
}

export async function postDataforseoJson(path: string, payload: unknown) {
  const response = await requestDataforseo({
    path,
    method: "POST",
    body: payload,
  });

  return {
    response,
    rawText: await response.text(),
  };
}
