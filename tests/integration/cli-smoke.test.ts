import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

async function runCli(args: string[]) {
  const cliEntry = path.resolve(process.cwd(), "src/cli/index.ts");
  const tsxEntry = path.resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs");

  return execFileAsync(process.execPath, [tsxEntry, cliEntry, ...args], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      LLM_PROVIDER: "mock",
      ANALYSIS_V2_ENABLED: "true",
    },
    maxBuffer: 10 * 1024 * 1024,
  });
}

describe("Agent Lint CLI", () => {
  it("supports score command in json mode", async () => {
    const { stdout } = await runCli([
      "score",
      "--type",
      "agents",
      "--content",
      "# AGENTS.md\n\nNever force push.",
      "--json",
    ]);

    const parsed = JSON.parse(stdout) as {
      score: number;
      provider: string;
      confidence: number;
    };

    expect(typeof parsed.score).toBe("number");
    expect(typeof parsed.provider).toBe("string");
    expect(typeof parsed.confidence).toBe("number");
  });

  it("supports fix command", async () => {
    const { stdout } = await runCli([
      "fix",
      "--type",
      "rules",
      "--content",
      "# Rules\n\nDo not reveal secrets.",
    ]);

    expect(stdout.trim().length).toBeGreaterThan(0);
  });
});
