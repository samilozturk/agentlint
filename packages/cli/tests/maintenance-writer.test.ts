import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CLIENT_REGISTRY,
  type ClientId,
} from "../src/commands/clients.js";
import { installMaintenanceRule } from "../src/commands/maintenance-writer.js";

function getClient(id: ClientId) {
  const client = CLIENT_REGISTRY.find((entry) => entry.id === id);
  if (!client) {
    throw new Error(`Missing client fixture for ${id}`);
  }
  return client;
}

describe("installMaintenanceRule", () => {
  it("writes a dedicated cursor rule file", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentlint-rule-cursor-"));

    try {
      const result = installMaintenanceRule(getClient("cursor"), tmpDir);
      expect(result.status).toBe("created");
      expect(fs.existsSync(path.join(tmpDir, ".cursor", "rules", "agentlint-maintenance.mdc"))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("falls back to AGENTS.md for unsupported clients", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentlint-rule-generic-"));

    try {
      const result = installMaintenanceRule(getClient("codex"), tmpDir);
      expect(result.status).toBe("created");
      expect(fs.existsSync(path.join(tmpDir, "AGENTS.md"))).toBe(true);
      expect(fs.readFileSync(path.join(tmpDir, "AGENTS.md"), "utf-8")).toContain("Agent Lint Context Maintenance");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("prefers existing CLAUDE.md over creating AGENTS.md for generic fallback", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentlint-rule-claude-"));

    try {
      fs.writeFileSync(path.join(tmpDir, "CLAUDE.md"), "# Project Claude\n", "utf-8");
      const result = installMaintenanceRule(getClient("zed"), tmpDir);

      expect(result.status).toBe("appended");
      expect(fs.existsSync(path.join(tmpDir, "AGENTS.md"))).toBe(false);
      expect(fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf-8")).toContain("Agent Lint Context Maintenance");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("is idempotent when the same rule already exists", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentlint-rule-idempotent-"));

    try {
      const client = getClient("vscode");
      const first = installMaintenanceRule(client, tmpDir);
      const second = installMaintenanceRule(client, tmpDir);

      expect(first.status).toBe("created");
      expect(second.status).toBe("exists");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("treats CRLF files as already configured", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentlint-rule-crlf-"));

    try {
      const client = getClient("vscode");
      const targetPath = path.join(tmpDir, ".github", "copilot-instructions.md");

      installMaintenanceRule(client, tmpDir);
      const raw = fs.readFileSync(targetPath, "utf-8");
      fs.writeFileSync(targetPath, raw.replace(/\r?\n/g, "\r\n"), "utf-8");

      const result = installMaintenanceRule(client, tmpDir);
      const finalRaw = fs.readFileSync(targetPath, "utf-8");

      expect(result.status).toBe("exists");
      expect((finalRaw.match(/plain-English requests/g) ?? [])).toHaveLength(1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("updates dedicated Cursor rule files in place", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agentlint-rule-update-"));

    try {
      const client = getClient("cursor");
      const targetPath = path.join(tmpDir, ".cursor", "rules", "agentlint-maintenance.mdc");

      installMaintenanceRule(client, tmpDir);
      const raw = fs.readFileSync(targetPath, "utf-8");
      fs.writeFileSync(
        targetPath,
        raw.replace("Agent Lint context maintenance rules", "Older Agent Lint context maintenance rules"),
        "utf-8",
      );

      const result = installMaintenanceRule(client, tmpDir);
      const finalRaw = fs.readFileSync(targetPath, "utf-8");

      expect(result.status).toBe("updated");
      expect((finalRaw.match(/# Agent Lint Context Maintenance/g) ?? [])).toHaveLength(1);
      expect(finalRaw).not.toContain("Older Agent Lint context maintenance rules");
      expect(fs.existsSync(`${targetPath}.bak`)).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
