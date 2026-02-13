"use client";

import { useState } from "react";
import { Check, Clipboard, Download, Loader2, WandSparkles, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type JudgeToolbarProps = {
  isPending: boolean;
  hasOutput: boolean;
  inputLength: number;
  errorMessage: string | null;
  onAnalyze: () => void;
  onApplyFix: () => void;
  onCopy: () => Promise<void>;
  onExport: () => void;
};

export function JudgeToolbar({
  isPending,
  hasOutput,
  inputLength,
  errorMessage,
  onAnalyze,
  onApplyFix,
  onCopy,
  onExport,
}: JudgeToolbarProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await onCopy();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onAnalyze}
              disabled={isPending || inputLength === 0}
              className="gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Judge is thinking</span>
                  <span className="inline-flex gap-0.5">
                    <span className="inline-block size-1 rounded-full bg-current" style={{ animation: "thinking-dots 1.4s infinite", animationDelay: "0s" }} />
                    <span className="inline-block size-1 rounded-full bg-current" style={{ animation: "thinking-dots 1.4s infinite", animationDelay: "0.2s" }} />
                    <span className="inline-block size-1 rounded-full bg-current" style={{ animation: "thinking-dots 1.4s infinite", animationDelay: "0.4s" }} />
                  </span>
                </>
              ) : (
                <>
                  <WandSparkles className="size-4" />
                  Analyze
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Run the judge pipeline on your artifact</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" onClick={onApplyFix} disabled={!hasOutput}>
              <Wrench className="size-4" />
              Apply Fix
            </Button>
          </TooltipTrigger>
          <TooltipContent>Replace input with the perfected output</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={handleCopy} disabled={!hasOutput}>
              {copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy output to clipboard</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={onExport} disabled={!hasOutput}>
              <Download className="size-4" />
              Export
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download as markdown file</TooltipContent>
        </Tooltip>
      </div>

      {errorMessage ? (
        <div className="animate-scale-in rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
