import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { artifactTypeValues, type ArtifactType, type ContextDocumentInput } from "@/lib/artifacts";
import { executeAnalyzeArtifactTool } from "@/mcp/tools";

type CliCommand = "analyze" | "fix" | "score";

type ParsedCliOptions = {
  type: ArtifactType;
  content: string;
  contextDocuments: ContextDocumentInput[];
  asJson: boolean;
  analysisEnabled?: boolean;
};

function redirectOperationalLogsToStderr(): void {
  console.info = (...args: unknown[]) => {
    console.error(...args.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg))));
  };
}

function printUsage(): void {
  process.stdout.write(
    [
      "Agent Lint CLI",
      "",
      "Usage:",
      "  npm run cli -- analyze --type <type> [--file <path> | --content <text>] [--context-file <path>] [--json]",
      "  npm run cli -- fix --type <type> [--file <path> | --content <text>] [--context-file <path>]",
      "  npm run cli -- score --type <type> [--file <path> | --content <text>] [--context-file <path>] [--json]",
      "",
      `Types: ${artifactTypeValues.join(", ")}`,
      "",
      "Examples:",
      "  npm run cli -- analyze --type agents --file AGENTS.md --json",
      "  npm run cli -- fix --type rules --file docs/rules.md",
      "  npm run cli -- score --type workflows --content \"# Workflow\\n\\n1. Run lint\"",
    ].join("\n"),
  );
}

async function loadContent(filePath: string | undefined, inlineContent: string | undefined): Promise<string> {
  if (filePath && inlineContent) {
    throw new Error("Provide either --file or --content, not both.");
  }

  if (filePath) {
    return readFile(filePath, "utf8");
  }

  if (inlineContent) {
    return inlineContent;
  }

  throw new Error("Missing input. Provide --file or --content.");
}

function parseArtifactType(raw: string | undefined): ArtifactType {
  if (!raw) {
    throw new Error("Missing --type option.");
  }

  if (artifactTypeValues.includes(raw as ArtifactType)) {
    return raw as ArtifactType;
  }

  throw new Error(`Invalid artifact type '${raw}'. Expected one of: ${artifactTypeValues.join(", ")}.`);
}

function parseBoolean(raw: string | undefined): boolean | undefined {
  if (!raw) {
    return undefined;
  }

  if (raw === "true") {
    return true;
  }

  if (raw === "false") {
    return false;
  }

  throw new Error(`Expected boolean value 'true' or 'false', received '${raw}'.`);
}

async function loadContextDocuments(contextFiles: string[]): Promise<ContextDocumentInput[]> {
  const docs: ContextDocumentInput[] = [];

  for (const contextPath of contextFiles) {
    const content = await readFile(contextPath, "utf8");
    docs.push({
      label: path.basename(contextPath),
      path: contextPath,
      content,
      priority: 5,
    });
  }

  return docs;
}

async function parseCliOptions(argv: string[]): Promise<ParsedCliOptions> {
  const parsed = parseArgs({
    args: argv,
    allowPositionals: false,
    options: {
      type: {
        type: "string",
      },
      file: {
        type: "string",
      },
      content: {
        type: "string",
      },
      "context-file": {
        type: "string",
        multiple: true,
      },
      json: {
        type: "boolean",
        default: false,
      },
      "analysis-enabled": {
        type: "string",
      },
      help: {
        type: "boolean",
        default: false,
      },
    },
  });

  if (parsed.values.help) {
    printUsage();
    process.exit(0);
  }

  const type = parseArtifactType(parsed.values.type);
  const content = await loadContent(parsed.values.file, parsed.values.content);
  const contextDocuments = await loadContextDocuments(parsed.values["context-file"] ?? []);

  return {
    type,
    content,
    contextDocuments,
    asJson: Boolean(parsed.values.json),
    analysisEnabled: parseBoolean(parsed.values["analysis-enabled"]),
  };
}

async function runAnalyzeCommand(options: ParsedCliOptions): Promise<void> {
  const result = await executeAnalyzeArtifactTool({
    type: options.type,
    content: options.content,
    contextDocuments: options.contextDocuments,
    analysisEnabled: options.analysisEnabled,
  });

  if (options.asJson) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  process.stdout.write(
    [
      `score: ${result.score}`,
      `provider: ${result.provider}`,
      `fallback: ${result.fallbackUsed ? result.fallbackReason : "none"}`,
      `warnings: ${result.warnings.length}`,
      "",
      result.refinedContent,
    ].join("\n") + "\n",
  );
}

async function runFixCommand(options: ParsedCliOptions): Promise<void> {
  const result = await executeAnalyzeArtifactTool({
    type: options.type,
    content: options.content,
    contextDocuments: options.contextDocuments,
    analysisEnabled: options.analysisEnabled,
  });

  if (options.asJson) {
    process.stdout.write(
      `${JSON.stringify({ refinedContent: result.refinedContent, warnings: result.warnings }, null, 2)}\n`,
    );
    return;
  }

  process.stdout.write(`${result.refinedContent}\n`);
}

async function runScoreCommand(options: ParsedCliOptions): Promise<void> {
  const result = await executeAnalyzeArtifactTool({
    type: options.type,
    content: options.content,
    contextDocuments: options.contextDocuments,
    analysisEnabled: options.analysisEnabled,
  });

  const output = {
    score: result.score,
    provider: result.provider,
    fallbackUsed: result.fallbackUsed,
    fallbackReason: result.fallbackReason,
    confidence: result.confidence,
    warnings: result.warnings,
  };

  if (options.asJson) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }

  process.stdout.write(
    [
      `score: ${output.score}`,
      `provider: ${output.provider}`,
      `confidence: ${output.confidence}`,
      `warnings: ${output.warnings.length}`,
      output.warnings.map((warning) => `- ${warning}`).join("\n"),
    ]
      .filter(Boolean)
      .join("\n") + "\n",
  );
}

async function run(): Promise<void> {
  redirectOperationalLogsToStderr();

  if (!process.env.LLM_PROVIDER) {
    process.env.LLM_PROVIDER = "mock";
  }

  const [commandRaw, ...restArgs] = process.argv.slice(2);
  if (!commandRaw || commandRaw === "--help" || commandRaw === "-h") {
    printUsage();
    return;
  }

  const command = commandRaw as CliCommand;
  if (command !== "analyze" && command !== "fix" && command !== "score") {
    throw new Error(`Unknown command '${commandRaw}'.`);
  }

  const options = await parseCliOptions(restArgs);

  if (command === "analyze") {
    await runAnalyzeCommand(options);
    return;
  }

  if (command === "fix") {
    await runFixCommand(options);
    return;
  }

  await runScoreCommand(options);
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown CLI error";
  process.stderr.write(`agentlint CLI error: ${message}\n`);
  process.exit(1);
});
