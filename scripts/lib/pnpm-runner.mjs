import { execFileSync } from "node:child_process";
import process from "node:process";

export function resolvePnpmInvocation(
  env = process.env,
  platform = process.platform,
) {
  const npmExecPath = env.npm_execpath;
  if (npmExecPath) {
    return {
      command: process.execPath,
      args: [npmExecPath],
      shell: false,
    };
  }

  return {
    command: "pnpm",
    args: [],
    shell: platform === "win32",
  };
}

export function execPnpm(args, options = {}) {
  const invocation = resolvePnpmInvocation();
  return execFileSync(invocation.command, [...invocation.args, ...args], {
    shell: invocation.shell,
    ...options,
  });
}
