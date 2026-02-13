import { describe, expect, it } from "vitest";

import { parseArtifactContent } from "@/lib/parser";

describe("parseArtifactContent", () => {
  it("returns empty result for empty string", () => {
    const result = parseArtifactContent("");
    expect(result).toEqual({
      frontmatter: null,
      body: "",
      parseError: null,
    });
  });

  it("returns empty result for whitespace-only string", () => {
    const result = parseArtifactContent("   \n\t  ");
    expect(result).toEqual({
      frontmatter: null,
      body: "",
      parseError: null,
    });
  });

  it("parses valid frontmatter", () => {
    const input = "---\nname: foo\ntags:\n  - a\n  - b\n---\n# Body content";
    const result = parseArtifactContent(input);

    expect(result.parseError).toBeNull();
    expect(result.frontmatter).toEqual({ name: "foo", tags: ["a", "b"] });
    expect(result.body).toBe("# Body content");
  });

  it("handles plain markdown without frontmatter", () => {
    const input = "# Hello\n\nSome text here.";
    const result = parseArtifactContent(input);

    expect(result.parseError).toBeNull();
    expect(result.body).toBe("# Hello\n\nSome text here.");
  });

  it("returns parseError for invalid YAML frontmatter without crashing", () => {
    const input = "---\n: : invalid\n---\ntext after";
    const result = parseArtifactContent(input);

    expect(result.parseError).toBeTruthy();
    expect(result.body).toBeTruthy();
  });

  it("handles frontmatter with empty data", () => {
    const input = "---\n---\n# Just body";
    const result = parseArtifactContent(input);

    expect(result.parseError).toBeNull();
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe("# Just body");
  });

  it("processes large input without throwing", () => {
    const largeInput = "# Header\n" + "x".repeat(100_000);
    const start = performance.now();
    const result = parseArtifactContent(largeInput);
    const elapsed = performance.now() - start;

    expect(result.parseError).toBeNull();
    expect(result.body.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(1000);
  });
});
