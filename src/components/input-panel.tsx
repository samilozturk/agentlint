"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { buildInstantLintSignals } from "@/lib/instant-lint";

const MAX_INPUT_CHARS = 1_000_000;

type InputPanelProps = {
  value: string;
  onChange: (value: string) => void;
};

export function InputPanel({ value, onChange }: InputPanelProps) {
  const isOverLimit = value.length > MAX_INPUT_CHARS;
  const instantSignals = buildInstantLintSignals({
    content: value,
    maxChars: MAX_INPUT_CHARS,
  });

  return (
    <Card className="panel-glow border-border/50 bg-card/75">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-sm font-semibold uppercase tracking-widest font-display">
            Input
          </CardTitle>
          <CardDescription className="text-xs">
            Paste or edit your artifact content.
          </CardDescription>
        </div>
        <Badge
          variant={isOverLimit ? "destructive" : "outline"}
          className="tabular-nums font-mono text-[10px]"
        >
          {value.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()}
        </Badge>
      </CardHeader>
      <CardContent>
        <Textarea
          data-testid="artifact-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[280px] resize-none rounded-lg border-border/50 bg-background/60 font-mono text-sm leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 sm:h-[320px] xl:h-[360px]"
          placeholder="Paste your artifact content here..."
        />

        <div className="mt-3 grid gap-1.5">
          {instantSignals.map((signal) => (
            <div
              key={signal.id}
              className={
                signal.severity === "error"
                  ? "rounded-md border border-destructive/35 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive"
                  : signal.severity === "warn"
                    ? "rounded-md border border-amber-500/35 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-300"
                    : "rounded-md border border-border/40 bg-background/45 px-2.5 py-1.5 text-xs text-muted-foreground"
              }
            >
              {signal.message}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
