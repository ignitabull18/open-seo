import { describe, expect, it } from "vitest";
import { buildCommand } from "./command";

describe("buildCommand", () => {
  it("uses pnpm exec for wrangler inside pnpm scripts", () => {
    expect(
      buildCommand("wrangler", ["secret", "list"], {
        env: { npm_execpath: "C:/pnpm.cjs" },
        execPath: "node.exe",
        platform: "win32",
      }),
    ).toEqual({
      executable: "node.exe",
      args: ["C:/pnpm.cjs", "exec", "wrangler", "secret", "list"],
    });
  });

  it("uses cmd shims on Windows outside pnpm scripts", () => {
    expect(
      buildCommand("wrangler", ["deploy"], {
        env: {},
        platform: "win32",
      }),
    ).toMatchObject({
      executable: "wrangler.cmd",
      args: ["deploy"],
    });
  });

  it("does not wrap arbitrary commands in pnpm exec", () => {
    expect(
      buildCommand("git", ["rev-parse", "HEAD"], {
        env: { npm_execpath: "pnpm.cjs" },
        platform: "linux",
      }),
    ).toMatchObject({
      executable: "git",
      args: ["rev-parse", "HEAD"],
    });
  });

  it("does not add a cmd suffix to git on Windows", () => {
    expect(
      buildCommand("git", ["rev-parse", "HEAD"], {
        env: {},
        platform: "win32",
      }),
    ).toMatchObject({
      executable: "git",
      args: ["rev-parse", "HEAD"],
    });
  });
});
