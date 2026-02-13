"use client";

import { useMemo } from "react";
import { diffLines, type Change } from "diff";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type DiffViewerProps = {
  original: string;
  refined: string;
};

export function DiffViewer({ original, refined }: DiffViewerProps) {
  const diffs = useMemo<Change[]>(() => {
    if (!refined) return [];
    return diffLines(original, refined);
  }, [original, refined]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const part of diffs) {
      if (part.added) added += part.count ?? 0;
      if (part.removed) removed += part.count ?? 0;
    }
    return { added, removed };
  }, [diffs]);

  return (
    <Card className="panel-glow border-border/50 bg-card/75">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-sm font-semibold uppercase tracking-widest font-display">
            Diff View
          </CardTitle>
          <CardDescription className="text-xs">
            Inspect before → after changes line by line.
          </CardDescription>
        </div>
        {diffs.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-transparent text-[10px]">
              +{stats.added}
            </Badge>
            <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-transparent text-[10px]">
              -{stats.removed}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 w-full rounded-lg border border-border/50 bg-background/60">
          <div className="p-4 font-mono text-xs leading-6">
            {diffs.length === 0 ? (
              <p className="text-muted-foreground/60 italic">
                Analyze content to see before/after diff.
              </p>
            ) : (
              diffs.map((part, index) => {
                const lines = part.value.split("\n").filter((line, i, arr) =>
                  i < arr.length - 1 || line.length > 0
                );

                return lines.map((line, lineIdx) => (
                  <div
                    key={`${part.added ? "a" : part.removed ? "r" : "e"}-${index}-${lineIdx}`}
                    className={
                      part.added
                        ? "rounded-[3px] bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-300"
                        : part.removed
                          ? "rounded-[3px] bg-rose-500/10 px-2 py-0.5 text-rose-700 line-through decoration-rose-400/40 dark:text-rose-300"
                          : "px-2 py-0.5 text-muted-foreground"
                    }
                  >
                    <span className="mr-3 inline-block w-4 select-none text-right text-muted-foreground/40">
                      {part.added ? "+" : part.removed ? "-" : " "}
                    </span>
                    {line || " "}
                  </div>
                ));
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
