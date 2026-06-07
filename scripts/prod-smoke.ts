import { spawnSync } from "node:child_process";

const baseUrl =
  process.env.OPEN_SEO_PROD_URL ??
  "https://open-seo.lingering-rain-68b6.workers.dev";

function run(command: string, args: string[]) {
  const pnpmExecPath = process.env.npm_execpath;
  const executable =
    pnpmExecPath && command === "wrangler"
      ? process.execPath
      : process.platform === "win32"
        ? `${command}.cmd`
        : command;
  const execArgs =
    pnpmExecPath && command === "wrangler"
      ? [pnpmExecPath, "exec", command, ...args]
      : args;
  const result = spawnSync(executable, execArgs, {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`,
    );
  }

  return result.stdout;
}

async function expectStatus(
  path: string,
  expected: number | ((status: number) => boolean),
  init?: RequestInit,
) {
  const response = await fetch(new URL(path, baseUrl), init);
  const pass =
    typeof expected === "number"
      ? response.status === expected
      : expected(response.status);

  if (!pass) {
    throw new Error(`${path} returned ${response.status}`);
  }

  console.log(`${response.status} ${path}`);
}

await expectStatus("/", 200);
await expectStatus("/sign-up", 200);
await expectStatus("/sign-in", 200);

for (const path of ["/api/auth/sign-up/email", "/api/auth/sign-in/email"]) {
  await expectStatus(path, 403, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "not-jeremy@example.com",
      password: "this-is-only-a-smoke-test",
    }),
  });
}

const secrets = run("wrangler", ["secret", "list"]);
for (const secret of ["BETTER_AUTH_SECRET", "DATAFORSEO_API_KEY"]) {
  if (!secrets.includes(secret)) {
    throw new Error(`Missing expected Worker secret: ${secret}`);
  }
}
console.log("Worker secrets include required production entries");

const jeremyUser = run("wrangler", [
  "d1",
  "execute",
  "DB",
  "--remote",
  "--command",
  "select email from user where email = 'jeremy@ignitabull.com' limit 1;",
]);
if (!jeremyUser.includes("jeremy@ignitabull.com")) {
  throw new Error("Production D1 did not return the Jeremy user row");
}
console.log("Production D1 contains the hosted Jeremy account");

run("wrangler", ["deployments", "list", "--name", "open-seo"]);
console.log(`Production smoke checks passed for ${baseUrl}`);
