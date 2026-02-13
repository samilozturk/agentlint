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

type InputPanelProps = {
  value: string;
  onChange: (value: string) => void;
};

export function InputPanel({ value, onChange }: InputPanelProps) {
  return (
    <Card className="panel-glow border-border/50 bg-card/75">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.1em] font-[family-name:var(--font-display)]">
            Input
          </CardTitle>
          <CardDescription className="text-xs">
            Paste or edit your artifact content.
          </CardDescription>
        </div>
        <Badge variant="outline" className="tabular-nums font-mono text-[10px]">
          {value.length.toLocaleString()} chars
        </Badge>
      </CardHeader>
      <CardContent>
        <Textarea
          data-testid="artifact-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[380px] resize-none rounded-lg border-border/50 bg-background/60 font-mono text-sm leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
          placeholder="Paste your artifact content here..."
        />
      </CardContent>
    </Card>
  );
}
