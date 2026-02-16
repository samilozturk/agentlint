"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ArtifactSelector } from "@/components/artifact-selector";
import { AnalysisDashboard } from "@/components/analysis-dashboard";
import {
  ContextDocumentsPanel,
  normalizeContextDocuments,
  type ContextDocumentDraft,
} from "@/components/context-documents-panel";
import { DiffViewer } from "@/components/diff-viewer";
import { InputPanel } from "@/components/input-panel";
import { JudgeToolbar } from "@/components/judge-toolbar";
import { OutputPanel } from "@/components/output-panel";
import { RecentScans } from "@/components/recent-scans";
import { ScoreDisplay } from "@/components/score-display";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ArtifactType } from "@/lib/artifacts";
import { applySelectedSegments } from "@/lib/selective-diff";
import { api } from "@/trpc/react";

export type WorkbenchTab = "compose" | "review" | "history";

type EditorWorkbenchProps = {
  activeTab?: WorkbenchTab;
  onActiveTabChange?: (tab: WorkbenchTab) => void;
};

const analysisStages = [
  "Sanitizing input",
  "Running static checks",
  "Evaluating semantic safety",
  "Calling judge provider",
  "Finalizing output",
];

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

export function EditorWorkbench({
  activeTab: activeTabProp,
  onActiveTabChange,
}: EditorWorkbenchProps) {
  const utils = api.useUtils();
  const [artifactType, setArtifactType] = useState<ArtifactType>("agents");
  const [input, setInput] = useState(starterTemplates.agents);
  const [output, setOutput] = useState("");
  const [internalActiveTab, setInternalActiveTab] = useState<WorkbenchTab>("compose");
  const [contextDocuments, setContextDocuments] = useState<ContextDocumentDraft[]>([]);
  const [analysisStageIndex, setAnalysisStageIndex] = useState<number | null>(null);
  const [selectedDiffSegments, setSelectedDiffSegments] = useState<number[]>([]);
  const stageStreamRef = useRef<EventSource | null>(null);

  const activeTab = activeTabProp ?? internalActiveTab;

  function setActiveTab(next: WorkbenchTab) {
    if (onActiveTabChange) {
      onActiveTabChange(next);
      return;
    }
    setInternalActiveTab(next);
  }

  const recentScans = api.artifacts.listRecent.useQuery();
  const analyzeMutation = api.artifacts.analyze.useMutation({
    onSuccess: async ({ result }) => {
      setOutput(result.refinedContent);
      setSelectedDiffSegments([]);
      setActiveTab("review");
      await utils.artifacts.listRecent.invalidate();
    },
  });

  const analysisStageProgress = useMemo(() => {
    if (analysisStageIndex === null) {
      return 0;
    }
    return ((analysisStageIndex + 1) / analysisStages.length) * 100;
  }, [analysisStageIndex]);

  useEffect(() => {
    return () => {
      if (stageStreamRef.current) {
        stageStreamRef.current.close();
      }
    };
  }, []);

  function startStageProgress() {
    if (stageStreamRef.current) {
      stageStreamRef.current.close();
      stageStreamRef.current = null;
    }

    setAnalysisStageIndex(0);

    if (typeof EventSource === "undefined") {
      return;
    }

    const source = new EventSource("/api/analyze/stages");

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { index?: number };
        if (typeof payload.index === "number") {
          setAnalysisStageIndex(Math.min(payload.index, analysisStages.length - 1));
        }
      } catch {
        // Ignore malformed stream chunks and keep local progress.
      }
    };

    source.addEventListener("done", () => {
      source.close();
      if (stageStreamRef.current === source) {
        stageStreamRef.current = null;
      }
    });

    source.onerror = () => {
      source.close();
      if (stageStreamRef.current === source) {
        stageStreamRef.current = null;
      }
    };

    stageStreamRef.current = source;
  }

  function stopStageProgress() {
    if (stageStreamRef.current) {
      stageStreamRef.current.close();
      stageStreamRef.current = null;
    }
    setAnalysisStageIndex(null);
  }

  async function onAnalyze() {
    const normalizedContext = normalizeContextDocuments(contextDocuments);

    startStageProgress();

    try {
      await analyzeMutation.mutateAsync({
        type: artifactType,
        content: input,
        contextDocuments: normalizedContext.length > 0 ? normalizedContext : undefined,
      });
    } finally {
      stopStageProgress();
    }
  }

  function onLoadTemplate(next: ArtifactType) {
    setArtifactType(next);
    setInput(starterTemplates[next]);
    setOutput("");
    setActiveTab("compose");
    setContextDocuments([]);
  }

  function onApplyFix() {
    if (output.length > 0) {
      setInput(output);
      setSelectedDiffSegments([]);
    }
  }

  function onApplySelected() {
    if (!output || selectedDiffSegments.length === 0) {
      return;
    }

    const merged = applySelectedSegments({
      original: input,
      refined: output,
      selectedSegmentIndexes: new Set(selectedDiffSegments),
    });

    setInput(merged);
  }

  async function onCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  }

  function onExport() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${artifactType}-refined.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const scoreData = analyzeMutation.data
    ? {
        score: analyzeMutation.data.result.score,
        provider: analyzeMutation.data.provider,
        requestedProvider: analyzeMutation.data.requestedProvider,
        fallbackUsed: analyzeMutation.data.fallbackUsed,
        fallbackReason: analyzeMutation.data.fallbackReason,
        confidence: analyzeMutation.data.confidence,
        dimensions: analyzeMutation.data.result.dimensions,
        warnings: analyzeMutation.data.result.warnings,
      }
    : null;

  const analysis = analyzeMutation.data?.result.analysis ?? null;

  return (
    <div id="workbench" className="flex flex-col gap-4 sm:gap-5">
      <Card className="panel-glow border-border/50 bg-card/75">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-widest font-display">
            Artifact Type
          </CardTitle>
          <CardDescription className="text-xs">
            Select artifact category, then compose and evaluate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ArtifactSelector selected={artifactType} onSelect={onLoadTemplate} />
        </CardContent>
      </Card>

      {activeTab === "compose" ? (
        <section id="compose" className="space-y-4">
          <Accordion
            type="multiple"
            defaultValue={["studio", "actions"]}
            className="panel-glow rounded-xl border border-border/50 bg-card/70 px-4 sm:px-5"
          >
            <AccordionItem value="studio">
              <AccordionTrigger className="text-xs font-semibold uppercase tracking-widest font-display">
                Compose Workspace
              </AccordionTrigger>
              <AccordionContent>
                <section className="grid gap-4 xl:grid-cols-2">
                  <InputPanel value={input} onChange={setInput} />
                  <OutputPanel value={output} isLoading={analyzeMutation.isPending} />
                </section>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="context">
              <AccordionTrigger className="text-xs font-semibold uppercase tracking-widest font-display">
                Project Context
              </AccordionTrigger>
              <AccordionContent>
                <ContextDocumentsPanel
                  documents={contextDocuments}
                  onChange={setContextDocuments}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="actions" className="border-b-0">
              <AccordionTrigger className="text-xs font-semibold uppercase tracking-widest font-display">
                Judge & Actions
              </AccordionTrigger>
              <AccordionContent>
                <Card className="panel-glow border-border/50 bg-card/75">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-widest font-display">
                      Judge & Actions
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Run analysis, apply selected fixes, copy, and export.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    <JudgeToolbar
                      isPending={analyzeMutation.isPending}
                      hasOutput={output.length > 0}
                      hasSelectedDiff={selectedDiffSegments.length > 0}
                      inputLength={input.trim().length}
                      isOverLimit={input.length > 1_000_000}
                      errorMessage={analyzeMutation.error?.message ?? null}
                      onAnalyze={onAnalyze}
                      onApplyFix={onApplyFix}
                      onApplySelected={onApplySelected}
                      onCopy={onCopy}
                      onExport={onExport}
                    />
                    {analyzeMutation.isPending && analysisStageIndex !== null ? (
                      <div className="space-y-2 rounded-md border border-border/40 bg-background/45 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">Pipeline Stage</span>
                          <span className="text-muted-foreground">
                            {analysisStages[analysisStageIndex]}
                          </span>
                        </div>
                        <Progress value={analysisStageProgress} className="h-1.5" />
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      ) : null}

      {activeTab === "review" ? (
        <section id="review" className="space-y-4">
          <Card className="panel-glow border-border/50 bg-card/75">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-widest font-display">
                Score Overview
              </CardTitle>
              <CardDescription className="text-xs">
                Inspect quality score, safety warnings, and reviewer confidence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreDisplay data={scoreData} isLoading={analyzeMutation.isPending} />
            </CardContent>
          </Card>

          <DiffViewer
            original={input}
            refined={output}
            selectedSegments={selectedDiffSegments}
            onSelectedSegmentsChange={setSelectedDiffSegments}
            reasonHints={(analysis?.missingItems ?? []).map((item) => item.recommendation)}
          />

          <AnalysisDashboard analysis={analysis} />
        </section>
      ) : null}

      {activeTab === "history" ? (
        <section id="history">
          <RecentScans
            scans={recentScans.data}
            isLoading={recentScans.isLoading}
          />
        </section>
      ) : null}
    </div>
  );
}
