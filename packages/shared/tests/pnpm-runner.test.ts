import { describe, expect, it } from "vitest";
import { resolvePnpmInvocation } from "../../../scripts/lib/pnpm-runner.mjs";

describe("resolvePnpmInvocation", () => {
  it("uses npm_execpath when available", () => {
    const invocation = resolvePnpmInvocation(
      { npm_execpath: "/tmp/pnpm.cjs" },
      "linux",
    );

    expect(invocation).toEqual({
      command: process.execPath,
      args: ["/tmp/pnpm.cjs"],
      shell: false,
    });
  });

  it("falls back to pnpm without shell on unix-like platforms", () => {
    const invocation = resolvePnpmInvocation({}, "linux");

    expect(invocation).toEqual({
      command: "pnpm",
      args: [],
      shell: false,
    });
  });

  it("falls back to pnpm with shell on Windows", () => {
    const invocation = resolvePnpmInvocation({}, "win32");

    expect(invocation).toEqual({
      command: "pnpm",
      args: [],
      shell: true,
    });
  });
});
