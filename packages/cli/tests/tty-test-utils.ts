import { PassThrough } from "node:stream";
import type { ReactNode } from "react";
import { render, type Instance } from "ink";

type MockTTYInput = PassThrough &
  NodeJS.ReadStream & {
    isTTY: true;
    setRawMode: (isRaw: boolean) => void;
    ref: () => MockTTYInput;
    unref: () => MockTTYInput;
  };

type MockTTYOutput = PassThrough &
  NodeJS.WriteStream & {
    isTTY: true;
    columns: number;
    rows: number;
  };

function createMockTTYInput(): MockTTYInput {
  const stdin = new PassThrough() as MockTTYInput;
  stdin.isTTY = true;
  stdin.setRawMode = () => {};
  stdin.ref = () => stdin;
  stdin.unref = () => stdin;
  return stdin;
}

function createMockTTYOutput(): MockTTYOutput {
  const stdout = new PassThrough() as MockTTYOutput;
  stdout.isTTY = true;
  stdout.columns = 120;
  stdout.rows = 40;
  return stdout;
}

export function sanitizeTerminalOutput(text: string): string {
  return text
    .replace(/\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "")
    .replace(/\r/g, "");
}

export function renderInTTY(node: ReactNode): {
  stdin: MockTTYInput;
  getStdout: () => string;
  getStderr: () => string;
  cleanup: () => void;
  instance: Instance;
} {
  const stdin = createMockTTYInput();
  const stdout = createMockTTYOutput();
  const stderr = createMockTTYOutput();

  let stdoutBuffer = "";
  let stderrBuffer = "";

  stdout.on("data", (chunk: Buffer) => {
    stdoutBuffer += chunk.toString();
  });

  stderr.on("data", (chunk: Buffer) => {
    stderrBuffer += chunk.toString();
  });

  const instance = render(node, {
    stdin,
    stdout,
    stderr,
    debug: true,
    exitOnCtrlC: false,
    patchConsole: false,
  });

  return {
    stdin,
    instance,
    getStdout: () => sanitizeTerminalOutput(stdoutBuffer),
    getStderr: () => sanitizeTerminalOutput(stderrBuffer),
    cleanup: () => {
      instance.unmount();
      instance.cleanup();
    },
  };
}

export function pressArrowDown(stdin: NodeJS.WritableStream): void {
  stdin.write("\u001B[B");
}

export function pressEnter(stdin: NodeJS.WritableStream): void {
  stdin.write("\r");
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitFor(
  condition: () => boolean,
  options?: { timeoutMs?: number; intervalMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 2_000;
  const intervalMs = options?.intervalMs ?? 20;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (condition()) {
      return;
    }
    await sleep(intervalMs);
  }

  throw new Error(`Timed out after ${timeoutMs}ms`);
}
