import fs from "node:fs";
import path from "node:path";
import { buildMaintenanceSnippet, type MaintenanceSnippetResult } from "@agent-lint/core";
import type { McpClient } from "./clients.js";

type SupportedSnippetClient =
  | "cursor"
  | "windsurf"
  | "vscode"
  | "claude-code"
  | "generic";

export type MaintenanceInstallResult =
  | { status: "created"; targetPath: string }
  | { status: "updated"; targetPath: string }
  | { status: "appended"; targetPath: string }
  | { status: "exists"; targetPath: string }
  | { status: "skipped"; targetPath?: string; message: string }
  | { status: "error"; targetPath?: string; message: string };

type WriteMode = "append" | "replace";

const DEFAULT_LINE_ENDING = process.platform === "win32" ? "\r\n" : "\n";

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createBackup(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, `${filePath}.bak`);
  }
}

function resolveSnippetClient(client: McpClient): SupportedSnippetClient {
  switch (client.id) {
    case "cursor":
      return "cursor";
    case "windsurf":
      return "windsurf";
    case "vscode":
      return "vscode";
    case "claude-code":
      return "claude-code";
    default:
      return "generic";
  }
}

function resolveGenericTargetPath(cwd: string): string {
  const agentsPath = path.join(cwd, "AGENTS.md");
  if (fs.existsSync(agentsPath)) {
    return agentsPath;
  }

  const claudePath = path.join(cwd, "CLAUDE.md");
  if (fs.existsSync(claudePath)) {
    return claudePath;
  }

  return agentsPath;
}

function resolveTarget(
  client: McpClient,
  cwd: string,
): { snippet: MaintenanceSnippetResult; targetPath: string; writeMode: WriteMode } {
  const snippetClient = resolveSnippetClient(client);
  const snippet = buildMaintenanceSnippet(snippetClient);

  if (snippetClient === "generic") {
    return {
      snippet,
      targetPath: resolveGenericTargetPath(cwd),
      writeMode: "append",
    };
  }

  return {
    snippet,
    targetPath: path.join(cwd, snippet.targetPath),
    writeMode: snippetClient === "cursor" || snippetClient === "windsurf"
      ? "replace"
      : "append",
  };
}

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

function detectLineEnding(text: string): string {
  return text.includes("\r\n") ? "\r\n" : DEFAULT_LINE_ENDING;
}

function renderSnippet(snippet: string, lineEnding: string): string {
  const normalized = normalizeLineEndings(snippet);
  return `${normalized.replace(/\n/g, lineEnding)}${lineEnding}`;
}

function stripTrailingLineEndings(text: string): string {
  return text.replace(/(?:\r\n|\n)+$/u, "");
}

function matchesManagedSnippet(existing: string, snippet: string): boolean {
  return stripTrailingLineEndings(normalizeLineEndings(existing)) ===
    stripTrailingLineEndings(normalizeLineEndings(snippet));
}

function containsSnippet(existing: string, snippet: string): boolean {
  return normalizeLineEndings(existing).includes(normalizeLineEndings(snippet));
}

function appendSnippet(existing: string, snippet: string, lineEnding: string): string {
  const endsWithLineEnding = /(?:\r\n|\n)$/u.test(existing);
  const endsWithBlankLine = /(?:(?:\r\n|\n)){2}$/u.test(existing);
  const separator = existing.length === 0
    ? ""
    : !endsWithLineEnding
      ? `${lineEnding}${lineEnding}`
      : !endsWithBlankLine
        ? lineEnding
        : "";

  return `${existing}${separator}${renderSnippet(snippet, lineEnding)}`;
}

export function installMaintenanceRule(client: McpClient, cwd: string): MaintenanceInstallResult {
  const { snippet, targetPath, writeMode } = resolveTarget(client, cwd);

  try {
    ensureDir(targetPath);

    if (!fs.existsSync(targetPath)) {
      fs.writeFileSync(targetPath, renderSnippet(snippet.snippet, DEFAULT_LINE_ENDING), "utf-8");
      return { status: "created", targetPath };
    }

    const raw = fs.readFileSync(targetPath, "utf-8");
    const lineEnding = detectLineEnding(raw);

    if (writeMode === "replace") {
      if (matchesManagedSnippet(raw, snippet.snippet)) {
        return { status: "exists", targetPath };
      }

      createBackup(targetPath);
      fs.writeFileSync(targetPath, renderSnippet(snippet.snippet, lineEnding), "utf-8");
      return { status: "updated", targetPath };
    }

    if (containsSnippet(raw, snippet.snippet)) {
      return { status: "exists", targetPath };
    }

    createBackup(targetPath);
    fs.writeFileSync(targetPath, appendSnippet(raw, snippet.snippet, lineEnding), "utf-8");
    return { status: "appended", targetPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      targetPath,
      message: `Failed to install maintenance rule for ${client.name}: ${message}`,
    };
  }
}
