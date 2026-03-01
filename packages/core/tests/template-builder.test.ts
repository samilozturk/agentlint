import { getTemplate, buildTemplateMarkdown } from "@agent-lint/core";
import { artifactTypeValues } from "@agent-lint/shared";

describe("template-builder", () => {
  it("returns a template for every artifact type", () => {
    for (const type of artifactTypeValues) {
      const template = getTemplate(type);
      expect(template).toBeTruthy();
      expect(template.length).toBeGreaterThan(50);
    }
  });

  it("agents template includes required sections", () => {
    const t = getTemplate("agents");
    expect(t).toContain("## Quick commands");
    expect(t).toContain("## Repo map");
    expect(t).toContain("## Working rules");
    expect(t).toContain("## Verification steps");
    expect(t).toContain("## Security boundaries");
    expect(t).toContain("## Do not do");
  });

  it("skills template includes YAML frontmatter", () => {
    const t = getTemplate("skills");
    expect(t).toContain("---");
    expect(t).toContain("name:");
    expect(t).toContain("description:");
  });

  it("buildTemplateMarkdown wraps template in a code block", () => {
    const md = buildTemplateMarkdown("rules");
    expect(md).toContain("# Template: rules");
    expect(md).toContain("```markdown");
  });
});
