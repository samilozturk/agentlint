import { buildWorkspaceAutofixPlan } from "@agent-lint/core";
import path from "node:path";

describe("plan-builder", () => {
  const fixtureWorkspace = path.resolve(__dirname, "../../..", "fixtures", "workspace");

  it("builds a plan with markdown output", () => {
    const plan = buildWorkspaceAutofixPlan(fixtureWorkspace);
    expect(plan.markdown).toBeTruthy();
    expect(plan.markdown).toContain("# Workspace Autofix Plan");
  });

  it("includes discovered artifacts section", () => {
    const plan = buildWorkspaceAutofixPlan(fixtureWorkspace);
    expect(plan.markdown).toContain("## Discovered artifacts");
  });

  it("includes action plan section", () => {
    const plan = buildWorkspaceAutofixPlan(fixtureWorkspace);
    expect(plan.markdown).toContain("## Action plan");
  });

  it("includes LLM instructions", () => {
    const plan = buildWorkspaceAutofixPlan(fixtureWorkspace);
    expect(plan.markdown).toContain("## Instructions for the LLM");
    expect(plan.markdown).toContain("agentlint_get_guidelines");
  });

  it("includes guidelines references for discovered types", () => {
    const plan = buildWorkspaceAutofixPlan(fixtureWorkspace);
    expect(plan.markdown).toContain("## Guidelines references");
  });

  it("returns discovery result alongside markdown", () => {
    const plan = buildWorkspaceAutofixPlan(fixtureWorkspace);
    expect(plan.discoveryResult).toBeTruthy();
    expect(plan.discoveryResult.discovered.length).toBeGreaterThan(0);
    expect(plan.rootPath).toBe(fixtureWorkspace);
  });
});
