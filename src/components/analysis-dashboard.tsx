"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, XCircle } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { JudgeAnalysis, MissingSeverity, QualityStatus } from "@/lib/judge";

type AnalysisDashboardProps = {
  analysis: JudgeAnalysis | null;
};

function StatusBadge({ status }: { status: QualityStatus }) {
  if (status === "pass") {
    return (
      <Badge className="gap-1 border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="size-3" />
        ✓ Pass
      </Badge>
    );
  }

  if (status === "improve") {
    return (
      <Badge className="gap-1 border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300">
        <AlertTriangle className="size-3" />
        ! Improve
      </Badge>
    );
  }

  return (
    <Badge className="gap-1 border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-300">
      <XCircle className="size-3" />
      ✗ Fail
    </Badge>
  );
}

function SeverityBadge({ severity }: { severity: MissingSeverity }) {
  if (severity === "blocking") {
    return <Badge variant="destructive">Blocking</Badge>;
  }

  if (severity === "important") {
    return <Badge className="border-transparent bg-amber-500/15 text-amber-700">Important</Badge>;
  }

  return <Badge variant="outline">Nice to have</Badge>;
}

export function AnalysisDashboard({ analysis }: AnalysisDashboardProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  async function copyPrompt() {
    if (!analysis) {
      return;
    }
    await navigator.clipboard.writeText(analysis.promptPack.prompt);
    setCopiedPrompt(true);
    window.setTimeout(() => setCopiedPrompt(false), 1200);
  }

  return (
    <Card className="panel-glow border-border/50 bg-card/75">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-widest font-display">
          Quality Analyzer
        </CardTitle>
        <CardDescription className="text-xs">
          Checklist status, missing items, best practices, and prompt packs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!analysis ? (
          <p className="rounded-lg border border-border/40 bg-background/40 p-4 text-sm italic text-muted-foreground/70">
            Run Analyze to view checklist results and improvement guidance.
          </p>
        ) : (
          <Tabs defaultValue="missing" className="gap-4">
            <TabsList>
              <TabsTrigger value="missing">Missing</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
              <TabsTrigger value="prompt">Prompt Pack</TabsTrigger>
            </TabsList>

            <TabsContent value="missing">
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border/40 bg-background/50 p-3">
                {analysis.missingItems.length === 0 ? (
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    No critical gaps detected.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {analysis.missingItems.map((item) => (
                      <article key={item.id} className="rounded-md border border-border/40 bg-card/70 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <SeverityBadge severity={item.severity} />
                          <p className="text-sm font-semibold">{item.title}</p>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
                        <p className="mt-2 text-xs">
                          <span className="font-medium">Fix:</span> {item.recommendation}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="checklist">
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border/40 bg-background/50 p-3">
                <div className="grid gap-2">
                  {analysis.checklist.map((item) => (
                    <article key={item.id} className="rounded-md border border-border/40 bg-card/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{item.label}</p>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
                      <p className="mt-2 text-xs">
                        <span className="font-medium">Improve:</span> {item.recommendation}
                      </p>
                      {item.evidence ? (
                        <p className="mt-2 text-[11px] text-muted-foreground/80">
                          <span className="font-medium">Evidence:</span> {item.evidence}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metrics">
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border/40 bg-background/50 p-3">
                <Accordion type="multiple" className="w-full">
                  {analysis.metricExplanations.map((metric) => (
                    <AccordionItem key={metric.id} value={metric.id}>
                      <AccordionTrigger>
                        <span className="flex items-center gap-2 text-left">
                          <StatusBadge status={metric.status} />
                          <span>
                            {metric.label} <span className="text-muted-foreground">({metric.score}/100)</span>
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        <p className="text-xs">
                          <span className="font-medium">Rule:</span> {metric.definition}
                        </p>
                        <p className="text-xs">
                          <span className="font-medium">Current:</span> {metric.assessment}
                        </p>
                        <p className="text-xs">
                          <span className="font-medium">Improve:</span> {metric.improvement}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </TabsContent>

            <TabsContent value="examples">
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border/40 bg-background/50 p-3">
                <div className="grid gap-2">
                  {analysis.bestPracticeHints.map((hint) => (
                    <article key={hint.id} className="rounded-md border border-border/40 bg-card/70 p-3">
                      <p className="text-sm font-semibold">{hint.title}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{hint.why}</p>
                      <p className="mt-2 rounded bg-emerald-500/8 p-2 text-xs">
                        <span className="font-medium">Good:</span> {hint.goodExample}
                      </p>
                      <p className="mt-2 rounded bg-rose-500/8 p-2 text-xs">
                        <span className="font-medium">Avoid:</span> {hint.avoidExample}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompt">
              <div className="rounded-lg border border-border/40 bg-background/50 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{analysis.promptPack.title}</p>
                    <p className="text-xs text-muted-foreground">{analysis.promptPack.summary}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={copyPrompt} className="gap-2">
                    <Copy className="size-3.5" />
                    {copiedPrompt ? "Copied" : "Copy Prompt"}
                  </Button>
                </div>
                <div className="h-56 overflow-y-auto rounded border border-border/40 bg-card/60 p-3">
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {analysis.promptPack.prompt}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
