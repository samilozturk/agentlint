import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildServerEntry,
  CLIENT_REGISTRY,
  type McpClient,
  type ClientId,
  getDefaultSelectedClientIds,
} from "../src/commands/clients.js";

// ── Helpers ─────────────────────────────────────────────────────────────

/** Create a minimal McpClient stub for a given client id */
function stubClient(id: ClientId, overrides?: Partial<McpClient>): McpClient {
  return {
    id,
    name: id,
    configFormat: "json",
    rootKey: "mcpServers",
    scopes: {},
    detectBinaries: [],
    detectDirs: [],
    ...overrides,
  };
}

// ── buildServerEntry ────────────────────────────────────────────────────

describe("buildServerEntry", () => {
  it("returns stdio entry with type for vscode", () => {
    const entry = buildServerEntry(stubClient("vscode", { rootKey: "servers" }));
    expect(entry).toEqual({
      type: "stdio",
      command: "npx",
      args: ["-y", "@agent-lint/mcp"],
    });
  });

  it("returns zed-specific structure with command.path", () => {
    const entry = buildServerEntry(stubClient("zed", { rootKey: "context_servers" }));
    expect(entry).toEqual({
      command: { path: "npx", args: ["-y", "@agent-lint/mcp"] },
      settings: {},
    });
  });

  it("returns opencode-specific structure with type local", () => {
    const entry = buildServerEntry(stubClient("opencode", { rootKey: "mcp" }));
    expect(entry).toEqual({
      type: "local",
      command: ["npx", "-y", "@agent-lint/mcp"],
      enabled: true,
    });
  });

  it("returns flat command/args for codex (TOML)", () => {
    const entry = buildServerEntry(stubClient("codex", { configFormat: "toml", rootKey: "mcp_servers" }));
    expect(entry).toEqual({
      command: "npx",
      args: ["-y", "@agent-lint/mcp"],
    });
  });

  it("returns default stdio entry for cursor", () => {
    const entry = buildServerEntry(stubClient("cursor"));
    expect(entry).toEqual({
      command: "npx",
      args: ["-y", "@agent-lint/mcp"],
    });
  });

  it("returns default stdio entry for windsurf", () => {
    const entry = buildServerEntry(stubClient("windsurf"));
    expect(entry).toEqual({
      command: "npx",
      args: ["-y", "@agent-lint/mcp"],
    });
  });

  it("returns default stdio entry for claude-desktop", () => {
    const entry = buildServerEntry(stubClient("claude-desktop"));
    expect(entry).toEqual({
      command: "npx",
      args: ["-y", "@agent-lint/mcp"],
    });
  });

  it("returns default stdio entry for claude-code", () => {
    const entry = buildServerEntry(stubClient("claude-code"));
    expect(entry).toEqual({
      command: "npx",
      args: ["-y", "@agent-lint/mcp"],
    });
  });

  it("returns default stdio entry for cline", () => {
    const entry = buildServerEntry(stubClient("cline"));
    expect(entry).toEqual({
      command: "npx",
      args: ["-y", "@agent-lint/mcp"],
    });
  });

  it("returns default stdio entry for kiro", () => {
    const entry = buildServerEntry(stubClient("kiro"));
    expect(entry).toEqual({
      command: "npx",
      args: ["-y", "@agent-lint/mcp"],
    });
  });

  it("never includes rootKey wrapper in returned entry", () => {
    for (const client of CLIENT_REGISTRY) {
      const entry = buildServerEntry(client);
      // The entry must NOT contain the rootKey as a top-level key
      // (that's what the removed buildMcpPayload used to do)
      expect(entry).not.toHaveProperty(client.rootKey);
    }
  });

  it("returns fresh objects on each call (no mutation risk)", () => {
    const client = stubClient("cursor");
    const a = buildServerEntry(client);
    const b = buildServerEntry(client);
    expect(a).toEqual(b);
    expect(a).not.toBe(b); // different references
  });

  it("covers every client in CLIENT_REGISTRY without throwing", () => {
    for (const client of CLIENT_REGISTRY) {
      expect(() => buildServerEntry(client)).not.toThrow();
      const entry = buildServerEntry(client);
      expect(entry).toBeDefined();
      expect(typeof entry).toBe("object");
    }
  });
});

describe("getDefaultSelectedClientIds", () => {
  it("preselects clients detected from workspace directories", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "agentlint-clients-"));
    fs.mkdirSync(path.join(cwd, ".cursor"));

    const selected = getDefaultSelectedClientIds([
      { client: stubClient("cursor", { detectDirs: [".cursor"] }), detectedBy: "binary" },
      { client: stubClient("vscode", { detectDirs: [".vscode"] }), detectedBy: "binary" },
    ], cwd);

    expect(selected).toEqual(["cursor"]);

    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it("preselects clients with existing config files", () => {
    const selected = getDefaultSelectedClientIds([
      { client: stubClient("claude-desktop"), detectedBy: "config-exists" },
    ], process.cwd());

    expect(selected).toEqual(["claude-desktop"]);
  });

  it("does not preselect binary-only detections", () => {
    const selected = getDefaultSelectedClientIds([
      { client: stubClient("codex"), detectedBy: "binary" },
      { client: stubClient("windsurf"), detectedBy: "binary" },
    ], process.cwd());

    expect(selected).toEqual([]);
  });
});
