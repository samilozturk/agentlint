"use client";

import { useMemo, useState } from "react";
import { diffLines } from "diff";

import { ArtifactSelector } from "@/components/artifact-selector";
import { Button } from "@/components/ui/button";
import type { ArtifactType } from "@/lib/artifacts";
import { api } from "@/trpc/react";

const starterTemplates: Record<ArtifactType, string> = {
  skills: [
    "---",
    "name: safe-deploy-skill",
    "description: Deploy flow with explicit confirmations",
    "---",
    "",
    "# Inputs",
    "- environment: staging|production",
    "",
    "# Guardrails",
    "- Never force push",
    "- Ask user confirmation before prod deploy",
  ].join("\n"),
  agents: [
    "# AGENTS.md",
    "",
    "## Project Context",
    "- Stack: Next.js + TypeScript",
    "",
    "## Critical Rules",
    "- Run lint before finalizing",
    "- Avoid destructive git operations",
  ].join("\n"),
  rules: [
    "# Workspace Rules",
    "",
    "- No any types",
    "- Use App Router conventions",
    "- Require confirmation for dangerous commands",
  ].join("\n"),
  workflows: [
    "# Workflow: Release Patch",
    "",
    "1. Run tests",
    "2. Build app",
    "3. Ask confirmation",
    "4. Create release notes",
  ].join("\n"),
  plans: [
    "# Great Plan",
    "",
    "## Phase 1",
    "- Setup baseline stack",
    "",
    "## Exit Criteria",
    "- CI passes",
    "- Docs updated",
  ].join("\n"),
};

export function EditorWorkbench() {
  const utils = api.useUtils();
  const [artifactType, setArtifactType] = useState<ArtifactType>("agents");
  const [input, setInput] = useState(starterTemplates.agents);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const recentScans = api.artifacts.listRecent.useQuery();
  const analyzeMutation = api.artifacts.analyze.useMutation({
    onSuccess: async ({ result }) => {
      setOutput(result.refinedContent);
      await utils.artifacts.listRecent.invalidate();
    },
  });

  const diffs = useMemo(() => {
    if (!output) {
      return [];
    }

    return diffLines(input, output);
  }, [input, output]);

  async function onAnalyze() {
    await analyzeMutation.mutateAsync({
      type: artifactType,
      content: input,
    });
  }

  function onLoadTemplate(next: ArtifactType) {
    setArtifactType(next);
    setInput(starterTemplates[next]);
    setOutput("");
  }

  function onApplyFix() {
    if (output.length > 0) {
      setInput(output);
    }
  }

  async function onCopy() {
    if (!output) {
      return;
    }

    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function onExport() {
    if (!output) {
      return;
    }

    const blob = new Blob([output], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${artifactType}-refined.md`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <ArtifactSelector selected={artifactType} onSelect={onLoadTemplate} />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Input</h2>
            <span className="text-xs text-muted-foreground">{input.length} chars</span>
          </div>
          <textarea
            data-testid="artifact-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="h-[340px] w-full resize-none rounded-lg border bg-background p-3 font-mono text-sm outline-none ring-ring/30 focus:ring-2"
            placeholder="Paste your artifact content"
          />
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Perfected Output</h2>
            <span className="text-xs text-muted-foreground">{output.length} chars</span>
          </div>
          <pre
            data-testid="artifact-output"
            className="h-[340px] overflow-auto rounded-lg border bg-background p-3 font-mono text-sm"
          >
            {output || "Run Analyze to generate the perfected artifact."}
          </pre>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Judge & Actions</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={onAnalyze} disabled={analyzeMutation.isPending || input.length === 0}>
              {analyzeMutation.isPending ? "Judge is thinking..." : "Analyze"}
            </Button>
            <Button variant="secondary" onClick={onApplyFix} disabled={!output}>
              Fix
            </Button>
            <Button variant="outline" onClick={onCopy} disabled={!output}>
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="outline" onClick={onExport} disabled={!output}>
              Export
            </Button>
          </div>
        </div>

        {analyzeMutation.error ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {analyzeMutation.error.message || "Analysis failed. Please try again."}
          </p>
        ) : null}

        {analyzeMutation.data ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-background p-3 text-sm">
              <p className="font-medium">Score: {analyzeMutation.data.result.score}/100</p>
              <p className="mt-1 text-muted-foreground">Provider: {analyzeMutation.data.provider}</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>Clarity: {analyzeMutation.data.result.dimensions.clarity}</li>
                <li>Safety: {analyzeMutation.data.result.dimensions.safety}</li>
                <li>Token Efficiency: {analyzeMutation.data.result.dimensions.tokenEfficiency}</li>
                <li>Completeness: {analyzeMutation.data.result.dimensions.completeness}</li>
              </ul>
            </div>

            <div className="rounded-lg border bg-background p-3 text-sm">
              <p className="font-medium">Warnings</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {analyzeMutation.data.result.warnings.length > 0 ? (
                  analyzeMutation.data.result.warnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))
                ) : (
                  <li>- No critical warnings.</li>
                )}
              </ul>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Diff View</h2>
        <div className="max-h-64 overflow-auto rounded-lg border bg-background p-3 font-mono text-xs leading-5">
          {diffs.length === 0 ? (
            <p className="text-muted-foreground">Analyze content to see before/after diff.</p>
          ) : (
            diffs.map((part, index) => (
              <p
                key={`${part.added ? "add" : part.removed ? "rem" : "eq"}-${index}`}
                className={
                  part.added
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : part.removed
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                      : "text-muted-foreground"
                }
              >
                {part.value}
              </p>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Dashboard - Recent Scans</h2>
        {recentScans.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading scans...</p>
        ) : recentScans.data && recentScans.data.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {recentScans.data.map((scan) => (
              <li key={scan.id} className="rounded-lg border bg-background p-3">
                <p className="font-medium">
                  #{scan.id} - {scan.type} - score {scan.score ?? "n/a"}
                </p>
                <p className="mt-1 line-clamp-2 text-muted-foreground">{scan.originalContent}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No scans yet.</p>
        )}
      </section>
    </div>
  );
}
