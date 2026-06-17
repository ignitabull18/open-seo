import { isHostedAuthMode } from "@/lib/auth-mode";

let workersEnvPromise: Promise<Record<string, unknown> | null> | null = null;

async function getEnvValue(name: string): Promise<string | undefined> {
  const processValue =
    typeof process !== "undefined" ? process.env?.[name] : undefined;
  if (processValue) {
    return processValue;
  }

  const workersEnv = await getWorkersEnv();
  const workerValue = workersEnv?.[name];
  if (typeof workerValue === "string") {
    return workerValue;
  }
  if (isSecretsStoreSecret(workerValue)) {
    return workerValue.get();
  }
  return undefined;
}

export async function getOptionalEnvValue(
  name: string,
): Promise<string | undefined> {
  return getEnvValue(name);
}

export async function getRequiredEnvValue(name: string): Promise<string> {
  const value = await getOptionalEnvValue(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function isHostedServerAuthMode(): Promise<boolean> {
  return isHostedAuthMode(await getEnvValue("AUTH_MODE"));
}

async function getWorkersEnv(): Promise<Record<string, unknown> | null> {
  if (!workersEnvPromise) {
    workersEnvPromise = loadWorkersEnv();
  }
  return workersEnvPromise;
}

async function loadWorkersEnv(): Promise<Record<string, unknown> | null> {
  try {
    const workersModule = await import("cloudflare:workers");
    return isRecord(workersModule.env) ? workersModule.env : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSecretsStoreSecret(
  value: unknown,
): value is { get: () => Promise<string> } {
  return isRecord(value) && typeof value.get === "function";
}
