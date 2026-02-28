import type { AnalyzeArtifactMcpCoreOutput } from "@agent-lint/core";
import type { ArtifactType } from "@agent-lint/shared";

export type AnalysisDisplayResult = {
  filePath: string;
  type: ArtifactType;
  output: AnalyzeArtifactMcpCoreOutput;
};

export type ScanDisplayResult = {
  filePath: string;
  type: ArtifactType;
  score: number;
  warnings: string[];
};

export type FormatOptions = {
  verbose?: boolean;
};

const ANSI = {
  reset: "\u001b[0m",
  bold: "\u001b[1m",
  red: "\u001b[31m",
  yellow: "\u001b[33m",
  green: "\u001b[32m",
};

function colorScore(score: number): string {
  if (score >= 85) {
    return `${ANSI.green}${score}${ANSI.reset}`;
  }
  if (score >= 70) {
    return `${ANSI.yellow}${score}${ANSI.reset}`;
  }
  return `${ANSI.red}${score}${ANSI.reset}`;
}

export function formatAnalysisText(result: AnalysisDisplayResult, options: FormatOptions = {}): string {
  const metricLines = result.output.result.analysis.metricExplanations.map(
    (metric) => `- ${metric.id}: ${metric.score} (${metric.status})`,
  );

  const warnings = result.output.warnings;
  const warningLines = warnings.length > 0 ? warnings.map((warning) => `- ${warning}`) : ["- none"];

  const lines = [
    `${ANSI.bold}Artifact${ANSI.reset}: ${result.filePath}`,
    `${ANSI.bold}Type${ANSI.reset}: ${result.type}`,
    `${ANSI.bold}Score${ANSI.reset}: ${colorScore(result.output.result.score)}`,
    `${ANSI.bold}Dimensions${ANSI.reset}: clarity=${result.output.result.dimensions.clarity}, safety=${result.output.result.dimensions.safety}, tokenEfficiency=${result.output.result.dimensions.tokenEfficiency}, completeness=${result.output.result.dimensions.completeness}`,
    `${ANSI.bold}Warnings${ANSI.reset}:`,
    ...warningLines,
  ];

  if (options.verbose) {
    lines.push(`${ANSI.bold}Metrics${ANSI.reset}:`, ...metricLines, `${ANSI.bold}Rationale${ANSI.reset}: ${result.output.result.rationale}`);
  }

  return `${lines.join("\n")}\n`;
}

export function formatAnalysisJson(result: AnalysisDisplayResult): string {
  return `${JSON.stringify(result, null, 2)}\n`;
}

export function formatScanText(results: ScanDisplayResult[], options: FormatOptions = {}): string {
  if (results.length === 0) {
    return "No artifacts found.\n";
  }

  const header = `${"Path".padEnd(48)} ${"Type".padEnd(10)} Score`;
  const separator = `${"-".repeat(48)} ${"-".repeat(10)} -----`;
  const rows = results.map((item) => `${item.filePath.padEnd(48)} ${item.type.padEnd(10)} ${colorScore(item.score)}`);
  const average = Math.round(results.reduce((sum, item) => sum + item.score, 0) / results.length);

  const lines = [header, separator, ...rows, "", `Artifacts: ${results.length}`, `Average score: ${average}`];
  if (options.verbose) {
    const withWarnings = results.filter((item) => item.warnings.length > 0);
    lines.push(`Files with warnings: ${withWarnings.length}`);
  }

  return `${lines.join("\n")}\n`;
}

export function formatScanJson(results: ScanDisplayResult[]): string {
  return `${JSON.stringify(results, null, 2)}\n`;
}
