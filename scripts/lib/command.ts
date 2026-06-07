import { spawnSync, type SpawnSyncReturns } from "node:child_process";

interface BuiltCommand {
  executable: string;
  args: string[];
}

const windowsShimCommands = new Set(["gh", "pnpm", "wrangler"]);

export function buildCommand(
  command: string,
  args: string[],
  options: {
    env?: Record<string, string | undefined>;
    platform?: NodeJS.Platform;
    execPath?: string;
  } = {},
): BuiltCommand {
  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;
  const execPath = options.execPath ?? process.execPath;

  if (env.npm_execpath && ["gh", "pnpm", "wrangler"].includes(command)) {
    return {
      executable: execPath,
      args:
        command === "pnpm"
          ? [env.npm_execpath, ...args]
          : [env.npm_execpath, "exec", command, ...args],
    };
  }

  return {
    executable:
      platform === "win32" && windowsShimCommands.has(command)
        ? `${command}.cmd`
        : command,
    args,
  };
}

export function runCommand(
  command: string,
  args: string[],
  options: {
    env?: Record<string, string | undefined>;
    stdio?: "inherit" | "pipe";
  } = {},
): SpawnSyncReturns<string> {
  const built = buildCommand(command, args, { env: options.env });
  return spawnSync(built.executable, built.args, {
    encoding: "utf8",
    env: options.env as NodeJS.ProcessEnv | undefined,
    shell: process.platform === "win32" && built.executable.endsWith(".cmd"),
    stdio: options.stdio ?? "pipe",
  });
}

export function runRequired(
  command: string,
  args: string[],
  env?: Record<string, string | undefined>,
) {
  const result = runCommand(command, args, { env });

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`,
    );
  }

  return result.stdout;
}
