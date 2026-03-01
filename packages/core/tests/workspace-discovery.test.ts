import { discoverWorkspaceArtifacts } from "@agent-lint/core";
import path from "node:path";

describe("workspace-discovery", () => {
  const fixtureWorkspace = path.resolve(__dirname, "../../..", "fixtures", "workspace");

  it("discovers artifacts in fixture workspace", () => {
    const result = discoverWorkspaceArtifacts(fixtureWorkspace);

    expect(result.rootPath).toBe(fixtureWorkspace);
    expect(result.discovered.length).toBeGreaterThan(0);
  });

  it("identifies AGENTS.md as agents type", () => {
    const result = discoverWorkspaceArtifacts(fixtureWorkspace);
    const agents = result.discovered.filter((d) => d.type === "agents");
    expect(agents.length).toBeGreaterThan(0);
  });

  it("detects missing artifact types", () => {
    const result = discoverWorkspaceArtifacts(fixtureWorkspace);
    const foundTypes = new Set(result.discovered.map((d) => d.type));
    const missingTypes = result.missing.map((m) => m.type);

    for (const m of missingTypes) {
      expect(foundTypes.has(m)).toBe(false);
    }
  });

  it("reports relative paths", () => {
    const result = discoverWorkspaceArtifacts(fixtureWorkspace);
    for (const d of result.discovered) {
      expect(path.isAbsolute(d.relativePath)).toBe(false);
    }
  });

  it("reports missing sections for incomplete artifacts", () => {
    const result = discoverWorkspaceArtifacts(fixtureWorkspace);
    const hasAnyMissingSections = result.discovered.some(
      (d) => d.missingSections.length > 0,
    );
    expect(hasAnyMissingSections).toBe(true);
  });
});
