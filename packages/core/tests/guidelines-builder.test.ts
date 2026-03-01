import { buildGuidelines } from "@agent-lint/core";
import { artifactTypeValues } from "@agent-lint/shared";

describe("guidelines-builder", () => {
  it("builds guidelines for every artifact type", () => {
    for (const type of artifactTypeValues) {
      const md = buildGuidelines(type);

      expect(md).toContain(`# Guidelines: ${type}`);
      expect(md).toContain("## Mandatory sections");
      expect(md).toContain("## Do");
      expect(md).toContain("## Don't");
      expect(md).toContain("## Guardrails");
      expect(md).toContain("## Quality checklist");
      expect(md).toContain("## Template skeleton");
      expect(md).toContain("## File discovery");
      expect(md).toContain("## Workflow");
    }
  });

  it("includes client-specific notes for cursor", () => {
    const md = buildGuidelines("agents", "cursor");
    expect(md).toContain("## Client-specific notes");
    expect(md).toContain(".cursor/rules/");
  });

  it("includes client-specific notes for windsurf", () => {
    const md = buildGuidelines("skills", "windsurf");
    expect(md).toContain(".windsurf/skills/");
  });

  it("includes client-specific notes for claude-code", () => {
    const md = buildGuidelines("agents", "claude-code");
    expect(md).toContain("CLAUDE.md");
  });

  it("includes client-specific notes for vscode", () => {
    const md = buildGuidelines("rules", "vscode");
    expect(md).toContain("copilot-instructions.md");
  });

  it("includes quality metric guidance", () => {
    const md = buildGuidelines("agents");
    expect(md).toContain("**clarity**");
    expect(md).toContain("**safety**");
    expect(md).toContain("**completeness**");
    expect(md).toContain("**maintainability**");
  });

  it("includes anti-patterns from specs", () => {
    const md = buildGuidelines("agents");
    expect(md).toContain("## Anti-patterns to avoid");
  });

  it("returns generic client notes by default", () => {
    const md = buildGuidelines("agents");
    expect(md).toContain("## Client-specific notes");
    expect(md).toContain("AGENTS.md");
  });
});
