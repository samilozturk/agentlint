import { readFileSync } from "node:fs";

import {
  CURRENT_RESOURCE_URIS,
  CURRENT_TOOL_IDS,
} from "../src/catalog.js";

const rootReadme = readFileSync(
  new URL("../../../README.md", import.meta.url),
  "utf-8",
);

const packageReadme = readFileSync(
  new URL("../README.md", import.meta.url),
  "utf-8",
);

function uniqueMatches(input: string, pattern: RegExp): string[] {
  return Array.from(new Set(input.match(pattern) ?? [])).sort();
}

describe("MCP docs consistency", () => {
  it("lists the current MCP tools in the root README", () => {
    expect(uniqueMatches(rootReadme, /agentlint_[a-z_]+/g)).toEqual(
      [...CURRENT_TOOL_IDS].sort(),
    );
  });

  it("lists the current MCP tools in the package README", () => {
    expect(uniqueMatches(packageReadme, /agentlint_[a-z_]+/g)).toEqual(
      [...CURRENT_TOOL_IDS].sort(),
    );
  });

  it("lists the current MCP resources in the root README", () => {
    expect(uniqueMatches(rootReadme, /agentlint:\/\/[a-z-]+\/\{type\}/g)).toEqual(
      [...CURRENT_RESOURCE_URIS].sort(),
    );
  });

  it("lists the current MCP resources in the package README", () => {
    expect(uniqueMatches(packageReadme, /agentlint:\/\/[a-z-]+\/\{type\}/g)).toEqual(
      [...CURRENT_RESOURCE_URIS].sort(),
    );
  });
});
