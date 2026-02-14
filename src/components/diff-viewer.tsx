"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buildDiffSegments } from "@/lib/selective-diff";

type DiffViewerProps = {
  original: string;
  refined: string;
  selectedSegments?: number[];
  onSelectedSegmentsChange?: (next: number[]) => void;
  reasonHints?: string[];
};

export function DiffViewer({
  original,
  refined,
  selectedSegments = [],
  onSelectedSegmentsChange,
  reasonHints = [],
}: DiffViewerProps) {
  const diffs = useMemo(() => buildDiffSegments(original, refined), [original, refined]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const part of diffs) {
      if (part.kind === "added") added += part.count;
      if (part.kind === "removed") removed += part.count;
    }
    return { added, removed };
  }, [diffs]);

  function toggleSegment(index: number) {
    if (!onSelectedSegmentsChange) {
      return;
    }

    if (selectedSegments.includes(index)) {
      onSelectedSegmentsChange(selectedSegments.filter((value) => value !== index));
      return;
    }

    onSelectedSegmentsChange([...selectedSegments, index]);
  }

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

                const isSelectable = part.kind === "added" || part.kind === "removed";
                const isSelected = selectedSegments.includes(index);
                const reason =
                  isSelectable && reasonHints.length > 0
                    ? reasonHints[index % reasonHints.length]
                    : null;

                return (
                  <div key={`${part.kind}-${index}`} className="mb-1.5">
                    {isSelectable ? (
                      <div className="mb-1 flex flex-wrap items-center gap-2 px-2 text-[11px]">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border/50 bg-background/50 px-2 py-0.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSegment(index)}
                            className="h-3.5 w-3.5"
                          />
                          <span>Apply segment</span>
                        </label>
                        <Badge
                          className={
                            part.kind === "added"
                              ? "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-300"
                          }
                        >
                          {part.kind}
                        </Badge>
                        {reason ? (
                          <span className="rounded-md border border-border/40 bg-background/45 px-2 py-0.5 text-muted-foreground">
                            Why: {reason}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {lines.map((line, lineIdx) => (
                      <div
                        key={`${part.kind}-${index}-${lineIdx}`}
                        className={
                          part.kind === "added"
                            ? "rounded-[3px] bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-300"
                            : part.kind === "removed"
                              ? "rounded-[3px] bg-rose-500/10 px-2 py-0.5 text-rose-700 line-through decoration-rose-400/40 dark:text-rose-300"
                              : "px-2 py-0.5 text-muted-foreground"
                        }
                      >
                        <span className="mr-3 inline-block w-4 select-none text-right text-muted-foreground/40">
                          {part.kind === "added" ? "+" : part.kind === "removed" ? "-" : " "}
                        </span>
                        {line || " "}
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
