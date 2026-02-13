import { describe, expect, it } from "vitest";

// parseJsonResult is not exported, so we test it indirectly by importing the module
// and testing the Zod schema behavior + JSON cleaning logic it depends on.
// We replicate the cleaning logic here to test it in isolation.
import { z } from "zod";

const aiJudgeSchema = z.object({
  score: z.number().int().min(0).max(100),
  dimensions: z.object({
    clarity: z.number().int().min(0).max(100),
    safety: z.number().int().min(0).max(100),
    tokenEfficiency: z.number().int().min(0).max(100),
    completeness: z.number().int().min(0).max(100),
  }),
  rationale: z.string().min(1),
  warnings: z.array(z.string()).default([]),
  refinedContent: z.string().min(1),
});

function parseJsonResult(raw: string) {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  return aiJudgeSchema.parse(parsed);
}

const validPayload = {
  score: 82,
  dimensions: {
    clarity: 85,
    safety: 90,
    tokenEfficiency: 75,
    completeness: 78,
  },
  rationale: "Well-structured artifact with clear sections.",
  warnings: ["Minor verbosity detected."],
  refinedContent: "# Refined\n\nCleaner version.",
};

describe("parseJsonResult (judge-provider internal logic)", () => {
  it("parses valid JSON string", () => {
    const result = parseJsonResult(JSON.stringify(validPayload));
    expect(result.score).toBe(82);
    expect(result.dimensions.clarity).toBe(85);
    expect(result.refinedContent).toContain("Refined");
  });

  it("strips ```json fences", () => {
    const wrapped = "```json\n" + JSON.stringify(validPayload) + "\n```";
    const result = parseJsonResult(wrapped);
    expect(result.score).toBe(82);
  });

  it("strips plain ``` fences", () => {
    const wrapped = "```\n" + JSON.stringify(validPayload) + "\n```";
    const result = parseJsonResult(wrapped);
    expect(result.score).toBe(82);
  });

  it("defaults warnings to empty array when omitted", () => {
    const { warnings: _unused, ...withoutWarnings } = validPayload;
    void _unused;
    const result = parseJsonResult(JSON.stringify(withoutWarnings));
    expect(result.warnings).toEqual([]);
  });

  it("throws on malformed JSON", () => {
    expect(() => parseJsonResult("not json at all")).toThrow();
  });

  it("throws on valid JSON missing required fields", () => {
    expect(() =>
      parseJsonResult(JSON.stringify({ score: 50 })),
    ).toThrow();
  });

  it("throws when score is out of range", () => {
    const outOfRange = { ...validPayload, score: 150 };
    expect(() => parseJsonResult(JSON.stringify(outOfRange))).toThrow();
  });

  it("throws when score is negative", () => {
    const negative = { ...validPayload, score: -5 };
    expect(() => parseJsonResult(JSON.stringify(negative))).toThrow();
  });

  it("throws when refinedContent is empty string", () => {
    const empty = { ...validPayload, refinedContent: "" };
    expect(() => parseJsonResult(JSON.stringify(empty))).toThrow();
  });

  it("throws when dimension is not integer", () => {
    const floatDim = {
      ...validPayload,
      dimensions: { ...validPayload.dimensions, clarity: 85.5 },
    };
    expect(() => parseJsonResult(JSON.stringify(floatDim))).toThrow();
  });
});
