import { describe, expect, it } from "vitest";

import { artifactSubmissionSchema, artifactTypeSchema } from "@/lib/artifacts";

describe("artifactTypeSchema", () => {
  it("accepts all 5 valid types", () => {
    for (const type of ["skills", "agents", "rules", "workflows", "plans"]) {
      expect(artifactTypeSchema.parse(type)).toBe(type);
    }
  });

  it("rejects invalid type string", () => {
    expect(() => artifactTypeSchema.parse("invalid")).toThrow();
  });
});

describe("artifactSubmissionSchema", () => {
  it("parses valid submission", () => {
    const result = artifactSubmissionSchema.parse({
      type: "agents",
      content: "# AGENTS.md\n\nSome content.",
    });

    expect(result.type).toBe("agents");
    expect(result.content).toBe("# AGENTS.md\n\nSome content.");
    expect(result.userId).toBeUndefined();
  });

  it("parses submission with optional userId", () => {
    const result = artifactSubmissionSchema.parse({
      type: "skills",
      content: "content",
      userId: "user-123",
    });

    expect(result.userId).toBe("user-123");
  });

  it("parses submission with optional context documents", () => {
    const result = artifactSubmissionSchema.parse({
      type: "agents",
      content: "# AGENTS.md",
      contextDocuments: [
        {
          label: "rules",
          content: "Do not force push.",
          path: ".windsurf/rules/security.md",
          priority: 8,
        },
      ],
    });

    expect(result.contextDocuments?.[0]?.label).toBe("rules");
  });

  it("rejects empty content", () => {
    expect(() =>
      artifactSubmissionSchema.parse({
        type: "agents",
        content: "",
      }),
    ).toThrow();
  });

  it("rejects content exceeding 1M characters", () => {
    expect(() =>
      artifactSubmissionSchema.parse({
        type: "agents",
        content: "x".repeat(1_000_001),
      }),
    ).toThrow();
  });

  it("accepts content at exactly 1M characters", () => {
    const result = artifactSubmissionSchema.parse({
      type: "agents",
      content: "x".repeat(1_000_000),
    });

    expect(result.content.length).toBe(1_000_000);
  });

  it("rejects invalid artifact type", () => {
    expect(() =>
      artifactSubmissionSchema.parse({
        type: "not-a-type",
        content: "hello",
      }),
    ).toThrow();
  });

  it("rejects missing type", () => {
    expect(() =>
      artifactSubmissionSchema.parse({
        content: "hello",
      }),
    ).toThrow();
  });

  it("rejects missing content", () => {
    expect(() =>
      artifactSubmissionSchema.parse({
        type: "agents",
      }),
    ).toThrow();
  });

  it("rejects userId exceeding 128 characters", () => {
    expect(() =>
      artifactSubmissionSchema.parse({
        type: "agents",
        content: "hello",
        userId: "x".repeat(129),
      }),
    ).toThrow();
  });
});
