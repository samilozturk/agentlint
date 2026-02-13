import { describe, expect, it } from "vitest";

import { validateMarkdownOrYaml } from "@/server/security/export-validation";

describe("validateMarkdownOrYaml", () => {
  it("rejects empty string", () => {
    const result = validateMarkdownOrYaml("");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("empty");
  });

  it("rejects whitespace-only string", () => {
    const result = validateMarkdownOrYaml("   \n\t  ");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("empty");
  });

  it("accepts valid markdown", () => {
    const result = validateMarkdownOrYaml("# Hello\n\nworld");
    expect(result.valid).toBe(true);
    expect(result.reason).toBeNull();
  });

  it("rejects unclosed code fence", () => {
    const result = validateMarkdownOrYaml("```js\nconst x = 1;");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Unclosed code fence");
  });

  it("accepts properly closed code fence", () => {
    const result = validateMarkdownOrYaml("```js\nconst x = 1;\n```");
    expect(result.valid).toBe(true);
  });

  it("accepts valid frontmatter + body", () => {
    const result = validateMarkdownOrYaml("---\ntitle: test\n---\n# Body");
    expect(result.valid).toBe(true);
  });

  it("rejects invalid frontmatter", () => {
    const result = validateMarkdownOrYaml("---\n: : bad: yaml:\n---");
    expect(result.valid).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it("accepts markdown with multiple properly closed fences", () => {
    const content = "# Doc\n\n```ts\ncode1\n```\n\n```py\ncode2\n```";
    const result = validateMarkdownOrYaml(content);
    expect(result.valid).toBe(true);
  });

  it("rejects three backtick fences (odd count)", () => {
    const content = "```ts\ncode\n```\n\n```orphan";
    const result = validateMarkdownOrYaml(content);
    expect(result.valid).toBe(false);
  });
});
