import {
  artifactTypeSchema,
  artifactTypeValues,
} from "@agent-lint/shared";

describe("artifacts", () => {
  it("exposes expected artifact type values", () => {
    const expected = ["agents", "skills", "rules", "workflows", "plans"];

    expect([...artifactTypeValues]).toHaveLength(expected.length);
    expect([...artifactTypeValues].slice().sort()).toEqual(expected.slice().sort());
  });

  it("validates artifact type schema", () => {
    expect(artifactTypeSchema.parse("agents")).toBe("agents");
    expect(artifactTypeSchema.safeParse("invalid-type").success).toBe(false);
  });
});
