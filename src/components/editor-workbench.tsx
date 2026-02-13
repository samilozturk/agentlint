"use client";

import { useMemo, useState } from "react";
import { diffLines } from "diff";
import { CircleAlert, Clipboard, Download, Sparkles, WandSparkles } from "lucide-react";

import { ArtifactSelector } from "@/components/artifact-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="flex flex-col gap-5">
      <Card className="panel-glow rounded-3xl border-border/70 bg-card/75">
        <CardHeader className="flex flex-wrap items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="text-base">Artifact Type</CardTitle>
            <CardDescription>Choose what to evaluate before running the judge.</CardDescription>
          </div>
          <Badge variant="outline">Template presets</Badge>
        </CardHeader>
        <CardContent>
          <ArtifactSelector selected={artifactType} onSelect={onLoadTemplate} />
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="panel-glow rounded-2xl border-border/70 bg-card/72">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-base">Input</CardTitle>
              <CardDescription>Paste context content to refine.</CardDescription>
            </div>
            <Badge variant="secondary">{input.length} chars</Badge>
          </CardHeader>
          <CardContent>
            <textarea
              data-testid="artifact-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="h-[360px] w-full resize-none rounded-2xl border border-border/75 bg-background/85 p-4 font-mono text-sm leading-relaxed outline-none ring-ring/30 transition focus:ring-2"
              placeholder="Paste your artifact content"
            />
          </CardContent>
        </Card>

        <Card className="panel-glow rounded-2xl border-border/70 bg-card/72">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-base">Perfected Output</CardTitle>
              <CardDescription>Refined version generated by the selected judge.</CardDescription>
            </div>
            <Badge variant="secondary">{output.length} chars</Badge>
          </CardHeader>
          <CardContent>
            <pre
              data-testid="artifact-output"
              className="h-[360px] overflow-auto rounded-2xl border border-border/75 bg-background/85 p-4 font-mono text-sm leading-relaxed"
            >
              {output || "Run Analyze to generate the perfected artifact."}
            </pre>
          </CardContent>
        </Card>
      </section>

      <Card className="panel-glow rounded-2xl border-border/70 bg-card/72">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 sm:flex-row">
          <div>
            <CardTitle className="text-base">Judge and Actions</CardTitle>
            <CardDescription>Run analysis, apply fixes, and export improved artifacts.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={onAnalyze} disabled={analyzeMutation.isPending || input.length === 0}>
              <WandSparkles className="size-4" />
              {analyzeMutation.isPending ? "Judge is thinking..." : "Analyze"}
            </Button>
            <Button variant="secondary" onClick={onApplyFix} disabled={!output}>
              Apply Fix
            </Button>
            <Button variant="outline" onClick={onCopy} disabled={!output}>
              <Clipboard className="size-4" />
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="outline" onClick={onExport} disabled={!output}>
              <Download className="size-4" />
              Export
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {analyzeMutation.error ? (
            <p className="rounded-xl border border-destructive/45 bg-destructive/12 p-3 text-sm text-destructive">
              {analyzeMutation.error.message || "Analysis failed. Please try again."}
            </p>
          ) : null}

          {analyzeMutation.data ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/80 p-4 text-sm">
                <p className="font-semibold">Score: {analyzeMutation.data.result.score}/100</p>
                <p className="mt-1 text-muted-foreground">Provider: {analyzeMutation.data.provider}</p>
                <ul className="mt-3 grid gap-1 text-muted-foreground">
                  <li>Clarity: {analyzeMutation.data.result.dimensions.clarity}</li>
                  <li>Safety: {analyzeMutation.data.result.dimensions.safety}</li>
                  <li>Token Efficiency: {analyzeMutation.data.result.dimensions.tokenEfficiency}</li>
                  <li>Completeness: {analyzeMutation.data.result.dimensions.completeness}</li>
                </ul>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/80 p-4 text-sm">
                <p className="mb-2 inline-flex items-center gap-2 font-semibold">
                  <CircleAlert className="size-4 text-accent" />
                  Warnings
                </p>
                <ul className="grid gap-1 text-muted-foreground">
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
          ) : (
            <p className="text-sm text-muted-foreground">
              Run Analyze to view score breakdown and warnings.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="panel-glow rounded-2xl border-border/70 bg-card/72">
        <CardHeader>
          <CardTitle className="text-base">Diff View</CardTitle>
          <CardDescription>Inspect all before and after changes line by line.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-72 overflow-auto rounded-2xl border border-border/75 bg-background/85 p-4 font-mono text-xs leading-6">
            {diffs.length === 0 ? (
              <p className="text-muted-foreground">Analyze content to see before/after diff.</p>
            ) : (
              diffs.map((part, index) => (
                <p
                  key={`${part.added ? "add" : part.removed ? "rem" : "eq"}-${index}`}
                  className={
                    part.added
                      ? "rounded-sm bg-emerald-500/13 text-emerald-700 dark:text-emerald-300"
                      : part.removed
                        ? "rounded-sm bg-rose-500/13 text-rose-700 dark:text-rose-300"
                        : "text-muted-foreground"
                  }
                >
                  {part.value}
                </p>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="panel-glow rounded-2xl border-border/70 bg-card/72">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Recent Scans</CardTitle>
            <CardDescription>Quick view of previously analyzed artifacts.</CardDescription>
          </div>
          <Badge variant="outline">
            <Sparkles className="mr-1 size-3" />
            History
          </Badge>
        </CardHeader>
        <CardContent>
          {recentScans.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading scans...</p>
          ) : recentScans.data && recentScans.data.length > 0 ? (
            <ul className="grid gap-2 text-sm">
              {recentScans.data.map((scan) => (
                <li
                  key={scan.id}
                  className="rounded-xl border border-border/70 bg-background/80 p-3 transition-colors hover:border-primary/45"
                >
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
        </CardContent>
      </Card>
    </div>
  );
}
