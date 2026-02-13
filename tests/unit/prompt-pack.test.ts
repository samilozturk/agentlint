import { describe, expect, it } from "vitest";

import { getPromptPack } from "@/server/services/prompt-pack";

describe("getPromptPack", () => {
  it("returns prompt pack for every artifact type", () => {
    const types = ["skills", "agents", "rules", "workflows", "plans"] as const;

    for (const type of types) {
      const pack = getPromptPack(type);
      expect(pack.title.length).toBeGreaterThan(0);
      expect(pack.summary.length).toBeGreaterThan(0);
      expect(pack.prompt.length).toBeGreaterThan(40);
    }
  });
});
